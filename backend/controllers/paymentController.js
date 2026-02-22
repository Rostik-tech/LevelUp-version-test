// controllers/paymentController.js
import axios from "axios";
import dotenv from "dotenv";
import {
  sequelize,
  Order,
  Payment,
  OrderItem,
  Product,
} from "../models/index.js";
import { canTransition } from "../utils/orderStatus.js";
import { sendOrderNotification } from "../utils/emailService.js";

dotenv.config();

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

// ==============================
// GET PAYPAL ACCESS TOKEN
// ==============================
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

// ==============================
// CREATE PAYPAL ORDER
// ==============================
export const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { orderId } = req.body;

    if (!orderId) {
      await transaction.rollback();
      return res.status(400).json({ message: "orderId обязателен" });
    }

    const dbOrder = await Order.findByPk(orderId, { transaction });

    if (!dbOrder) {
      await transaction.rollback();
      return res.status(404).json({ message: "Заказ не найден" });
    }

    if (dbOrder.status !== "PENDING") {
      await transaction.rollback();
      return res.status(400).json({ message: "Заказ уже обработан" });
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
              value: dbOrder.totalPrice.toString(),
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

    await Payment.create(
      {
        OrderId: dbOrder.id,
        UserId: dbOrder.UserId,
        amount: dbOrder.totalPrice,
        method: "PAYPAL",
        paypalOrderId,
        status: "PENDING",
      },
      { transaction }
    );

    await transaction.commit();

    res.json(response.data);

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
};

// ==============================
// CAPTURE + STOCK + EMAIL
// ==============================
export const captureOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

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
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (verifyResponse.data.status !== "COMPLETED") {
      await transaction.rollback();
      return res.status(400).json({ message: "Оплата не подтверждена" });
    }

    const payment = await Payment.findOne({
      where: { paypalOrderId: id },
      transaction,
    });

    if (!payment) {
      await transaction.rollback();
      return res.status(404).json({ message: "Payment не найден" });
    }

    const dbOrder = await Order.findByPk(payment.OrderId, { transaction });

    if (dbOrder.status === "PAID") {
      await transaction.commit();
      return res.json({ message: "Уже оплачено" });
    }

    if (!canTransition(dbOrder.status, "PAID")) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Недопустимый переход статуса`,
      });
    }

    // 🔥 STOCK DECREMENT
    const items = await OrderItem.findAll({
      where: { OrderId: dbOrder.id },
      transaction,
    });

    for (const item of items) {
      const product = await Product.findByPk(item.ProductId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!product) throw new Error("Товар не найден");

      if (product.stock < item.quantity)
        throw new Error("Недостаточно товара на складе");

      product.stock -= item.quantity;
      await product.save({ transaction });
    }

    dbOrder.status = "PAID";
    await dbOrder.save({ transaction });

    payment.status = "COMPLETED";
    await payment.save({ transaction });

    await transaction.commit();

    try {
      const fullItems = await OrderItem.findAll({
        where: { OrderId: dbOrder.id },
        include: [Product],
      });

      await sendOrderNotification(dbOrder, payment, fullItems);
    } catch (err) {
      console.error("Email failed:", err.message);
    }

    res.json({
      message: "Оплата подтверждена",
      order: dbOrder,
    });

  } catch (error) {
  await transaction.rollback();

  // Если ошибка пришла от PayPal
  if (error.response?.data?.name === "UNPROCESSABLE_ENTITY") {
    const details = error.response.data.details?.[0];

    if (details?.issue === "ORDER_ALREADY_CAPTURED") {
      return res.status(200).json({
        message: "Уже оплачено",
      });
    }

    return res.status(400).json({
      message: "Ошибка бизнес-валидации PayPal",
      details: error.response.data,
    });
  }

  // Любая другая PayPal ошибка
  if (error.response?.data) {
    return res.status(400).json({
      message: "Ошибка PayPal",
      details: error.response.data,
    });
  }

  // Настоящая серверная ошибка
  console.error("CAPTURE ERROR:", error.message);

  res.status(500).json({
    message: "Внутренняя ошибка сервера",
  });
}
};

// ==============================
// WEBHOOK (fallback only)
// ==============================
export const paypalWebhook = async (req, res) => {
  try {
    const rawBody = req.body.toString("utf8");
    const event = JSON.parse(rawBody);

    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      console.warn("Webhook received");
    }

    res.status(200).send("Webhook processed");

  } catch (error) {
    console.error("WEBHOOK ERROR:", error.message);
    res.status(500).send("Webhook error");
  }
};