// controllers/paymentController.js
import axios from "axios";
import dotenv from "dotenv";
import { Order, Payment } from "../models/index.js";
import { canTransition } from "../utils/orderStatus.js";

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

// =============================
// СОЗДАНИЕ PAYPAL ЗАКАЗА
// =============================
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

// =============================
// CAPTURE
// =============================
export const captureOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const accessToken = await getAccessToken();

    // Capture
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

    // Verify
    const verifyResponse = await axios.get(
      `${PAYPAL_BASE}/v2/checkout/orders/${id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (verifyResponse.data.status !== "COMPLETED") {
      return res.status(400).json({ message: "Оплата не подтверждена" });
    }

    const payment = await Payment.findOne({
      where: { paypalOrderId: id },
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment не найден" });
    }

    const dbOrder = await Order.findByPk(payment.OrderId);

    if (!canTransition(dbOrder.status, "paid")) {
      return res.status(400).json({
        message: `Недопустимый переход статуса: ${dbOrder.status} → paid`,
      });
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

// =============================
// WEBHOOK
// =============================
export const paypalWebhook = async (req, res) => {
  try {
    const event = req.body;
    const accessToken = await getAccessToken();

    const verifyResponse = await axios.post(
      `${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`,
      {
        transmission_id: req.headers["paypal-transmission-id"],
        transmission_time: req.headers["paypal-transmission-time"],
        cert_url: req.headers["paypal-cert-url"],
        auth_algo: req.headers["paypal-auth-algo"],
        transmission_sig: req.headers["paypal-transmission-sig"],
        webhook_id: process.env.PAYPAL_WEBHOOK_ID,
        webhook_event: event,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (verifyResponse.data.verification_status !== "SUCCESS") {
      return res.status(400).send("Invalid signature");
    }

    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const paypalOrderId =
        event.resource.supplementary_data.related_ids.order_id;

      const payment = await Payment.findOne({
        where: { paypalOrderId },
      });

      if (!payment) {
        return res.status(200).send("Payment not found");
      }

      const dbOrder = await Order.findByPk(payment.OrderId);

      // Webhook не должен ломать систему
      if (canTransition(dbOrder.status, "paid")) {
        dbOrder.status = "paid";
        await dbOrder.save();

        payment.status = "completed";
        await payment.save();
      }

      // если переход невозможен — просто игнорируем
    }

    res.status(200).send("Webhook processed");

  } catch (error) {
    res.status(500).send("Webhook error");
  }
};