// controllers/paymentController.js
import axios from "axios";
import dotenv from "dotenv";
import { Order, Payment } from "../models/index.js";

dotenv.config();

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

// 🔹 Получение access token
const getAccessToken = async () => {
  const response = await axios({
    url: `${PAYPAL_BASE}/v1/oauth2/token`,
    method: "post",
    auth: {
      username: process.env.PAYPAL_CLIENT_ID,
      password: process.env.PAYPAL_SECRET,
    },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: "grant_type=client_credentials",
  });

  return response.data.access_token;
};

// 🔹 Создание PayPal заказа (СУММА ТОЛЬКО ИЗ БАЗЫ)
export const createOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "orderId обязателен" });
    }

    const dbOrder = await Order.findByPk(orderId);

    if (!dbOrder) {
      return res.status(404).json({ message: "Заказ не найден" });
    }

    if (dbOrder.totalPrice <= 0) {
      return res.status(400).json({ message: "Сумма заказа некорректна" });
    }

    const accessToken = await getAccessToken();

    const response = await axios.post(
      `${PAYPAL_BASE}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: dbOrder.totalPrice.toString(), // 🔥 БЕРЁМ ИЗ БАЗЫ
            },
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const paypalOrderId = response.data.id;

    await Payment.create({
      OrderId: dbOrder.id,
      UserId: dbOrder.UserId,
      amount: dbOrder.totalPrice,
      method: "paypal",
      paypalOrderId,
      status: "pending",
    });

    res.json(response.data);

  } catch (error) {
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
};

// 🔥 ДВОЙНАЯ СЕРВЕРНАЯ ВАЛИДАЦИЯ
export const captureOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const accessToken = await getAccessToken();

    await axios.post(
      `${PAYPAL_BASE}/v2/checkout/orders/${id}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const verifyResponse = await axios.get(
      `${PAYPAL_BASE}/v2/checkout/orders/${id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const orderData = verifyResponse.data;

    if (orderData.status !== "COMPLETED") {
      return res.status(400).json({ message: "Оплата не подтверждена" });
    }

    const payment = await Payment.findOne({
      where: { paypalOrderId: id },
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment не найден" });
    }

    const dbOrder = await Order.findByPk(payment.OrderId);

    if (!dbOrder) {
      return res.status(404).json({ message: "Заказ не найден" });
    }

    dbOrder.status = "paid";
    await dbOrder.save();

    payment.status = "completed";
    await payment.save();

    res.json({
      message: "Оплата подтверждена",
      order: dbOrder,
      payment,
    });

  } catch (error) {
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
};