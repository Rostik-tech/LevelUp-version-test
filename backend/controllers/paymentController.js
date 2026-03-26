// controllers/paymentController.js
import axios from "axios";
import dotenv from "dotenv";
import { createInvoiceForOrder } from "./invoiceController.js";
import { Invoice } from "../models/index.js";
import { sendBusinessInvoiceCopy } from "../services/emailService.js";
import {
  sequelize,
  Order,
  Payment,
  OrderItem,
  Product,
} from "../models/index.js";
import { sendOrderNotification } from "../services/emailService.js";

dotenv.config();

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

// ========================================
// PAYPAL ACCESS TOKEN
// ========================================

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

// ========================================
// CREATE PAYPAL ORDER (PRODUCTION READY)
// ========================================

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

    if (dbOrder.status !== "PENDING") {
      return res.status(400).json({ message: "Заказ уже обработан" });
    }

    const accessToken = await getAccessToken();

    const response = await axios.post(
      `${PAYPAL_BASE}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: dbOrder.id.toString(),
            amount: {
              currency_code: "USD",
              value: dbOrder.totalPrice.toFixed(2),
            },
          },
        ],
        application_context: {
          return_url: "https://www.levelup-gaming.store/success.html",
          cancel_url: "https://www.levelup-gaming.store/cancel.html",
          brand_name: "Level Up Gaming",
          landing_page: "LOGIN",
          user_action: "PAY_NOW",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const paypalOrderId = response.data.id;

    const transaction = await sequelize.transaction();

    try {
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
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    res.json(response.data);

  } catch (error) {
    console.error("CREATE PAYPAL ORDER ERROR:", error.message);

    res.status(500).json({
      message: "Ошибка создания PayPal заказа",
      details: error.response?.data || error.message,
    });
  }
};

// ========================================
// CAPTURE PAYPAL ORDER
// ========================================

export const captureOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    if (!id) {
      await transaction.rollback();
      return res.status(400).json({ message: "paypalOrderId обязателен" });
    }

    if (!req.user || !req.user.id) {
      await transaction.rollback();
      return res.status(401).json({ message: "Требуется авторизация" });
    }

    // 🔒 1. Блокируем Payment
    const payment = await Payment.findOne({
      where: { paypalOrderId: id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!payment) {
      await transaction.rollback();
      return res.status(404).json({ message: "Payment не найден" });
    }

    // 🔐 2. Проверка владельца
    if (payment.UserId !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({
        message: "Вы не можете подтвердить чужой заказ",
      });
    }

    // ✅ Idempotency
if (payment.status === "COMPLETED") {

  const existingOrder = await Order.findByPk(payment.OrderId);

  const existingInvoice = await Invoice.findOne({
    where: { orderId: existingOrder.id },
  });

  await transaction.commit();

  return res.status(200).json({
    message: "Уже оплачено",
    order: existingOrder,
    invoiceNumber: existingInvoice?.invoiceNumber || null,
  });
}

    // 🔒 3. Блокируем Order
    const dbOrder = await Order.findByPk(payment.OrderId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!dbOrder) {
      await transaction.rollback();
      return res.status(404).json({ message: "Заказ не найден" });
    }

    if (dbOrder.UserId !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({
        message: "Вы не можете подтвердить чужой заказ",
      });
    }

    if (dbOrder.status !== "PENDING") {
      await transaction.rollback();
      return res.status(400).json({
        message: "Заказ уже обработан",
      });
    }

    // 🔑 4. Capture у PayPal
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

    // 🔍 5. Проверка статуса PayPal
const verifyResponse = await axios.get(
  `${PAYPAL_BASE}/v2/checkout/orders/${id}`,
  {
    headers: { Authorization: `Bearer ${accessToken}` },
  }
);

if (
  verifyResponse.data.status !== "COMPLETED" ||
  verifyResponse.data.purchase_units[0].amount.value !==
    dbOrder.totalPrice.toFixed(2)
) {
  await transaction.rollback();
  return res.status(400).json({
    message: "Оплата не подтверждена или сумма не совпадает",
  });
}

// 🔥 ВАЖНО: сохраняем captureId
const captureId =
  verifyResponse.data.purchase_units[0].payments.captures[0].id;

payment.paypalCaptureId = captureId;

    // 🔥 6. Уменьшаем stock
    const items = await OrderItem.findAll({
      where: { OrderId: dbOrder.id },
      transaction,
    });

    for (const item of items) {
      const product = await Product.findByPk(item.ProductId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!product)
        throw new Error("Товар не найден");

      if (product.stock < item.quantity)
        throw new Error("Недостаточно товара на складе");

      product.stock -= item.quantity;
      await product.save({ transaction });
    }

    // 🔄 7. Обновление статусов
    dbOrder.status = "PAID";
    await dbOrder.save({ transaction });

    payment.status = "COMPLETED";
    await payment.save({ transaction });

    await transaction.commit();

    // 🧾 8. Создание инвойса
   const invoice = await createInvoiceForOrder(dbOrder);

   const fullItems = await OrderItem.findAll({
  where: { OrderId: dbOrder.id },
  include: [Product],
});

await sendBusinessInvoiceCopy(invoice, dbOrder, fullItems);

    // 📧 Email
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
  invoiceNumber: invoice?.invoiceNumber || null,
});

  } catch (error) {
    await transaction.rollback();
    console.error("CAPTURE ERROR:", error.message);

    res.status(500).json({
      message: "Ошибка подтверждения оплаты",
    });
  }
};
// ========================================
// WEBHOOK (optional fallback)
// ========================================

import crypto from "crypto";

/* ========================================
   PAYPAL WEBHOOK (PRODUCTION LEVEL)
======================================== */

export const paypalWebhook = async (req, res) => {
  const transmissionId = req.headers["paypal-transmission-id"];
  const transmissionTime = req.headers["paypal-transmission-time"];
  const certUrl = req.headers["paypal-cert-url"];
  const authAlgo = req.headers["paypal-auth-algo"];
  const transmissionSig = req.headers["paypal-transmission-sig"];

  try {
    const accessToken = await getAccessToken();

    // 🔐 Verify webhook signature via PayPal API
    const verifyResponse = await axios.post(
      `${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`,
      {
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: process.env.PAYPAL_WEBHOOK_ID,
        webhook_event: req.body,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const isSandbox = process.env.PAYPAL_MODE !== "live";

if (
  verifyResponse.data.verification_status !== "SUCCESS" &&
  !isSandbox
) {
  console.warn("⚠️ Invalid webhook signature");
  return res.status(400).send("Invalid signature");
}

    // 🔥 FIX: parse raw body (PayPal webhook приходит как Buffer)
let event;

try {
  event = JSON.parse(req.body.toString());
} catch (err) {
  console.error("❌ Webhook JSON parse error:", err.message);
  return res.status(400).send("Invalid JSON");
}

const eventType = event.event_type;

    console.log("📩 PayPal Webhook:", eventType);

    const transaction = await sequelize.transaction();

    try {
      // ===============================
      // PAYMENT COMPLETED
      // ===============================
if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
  const captureId = event.resource.id;
  const paypalOrderId =
    event.resource.supplementary_data?.related_ids?.order_id;

  // 🔒 сначала ищем по captureId
  let payment = await Payment.findOne({
    where: { paypalCaptureId: captureId },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  // 🔁 fallback: ищем по paypalOrderId
  if (!payment && paypalOrderId) {
    payment = await Payment.findOne({
      where: { paypalOrderId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
  }

  // ⚠️ если вообще не нашли payment
  if (!payment) {
    console.warn("⚠️ Webhook: payment not found", {
      captureId,
      paypalOrderId,
    });

    await transaction.commit();
    return res.status(200).send("Payment not found");
  }

  // ✅ idempotency: если уже completed — просто выходим
  if (payment.status === "COMPLETED") {
    await transaction.commit();
    return res.status(200).send("Already processed");
  }

  // 🔥 сохраняем captureId если его ещё нет
  if (!payment.paypalCaptureId) {
    payment.paypalCaptureId = captureId;
  }

  payment.status = "COMPLETED";
  await payment.save({ transaction });

  // 🔄 обновляем заказ
  const order = await Order.findByPk(payment.OrderId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (order && order.status !== "PAID") {
    order.status = "PAID";

    // (опционально, но правильно)
    if (!order.paypalCaptureId) {
      order.paypalCaptureId = captureId;
    }

    await order.save({ transaction });
  }
}

      // ===============================
      // REFUND COMPLETED
      // ===============================
      if (eventType === "PAYMENT.CAPTURE.REFUNDED") {
        const refund = event.resource;
        const captureId = refund.links.find(
          (l) => l.rel === "up"
        )?.href?.split("/").pop();

        const payment = await Payment.findOne({
          where: { paypalCaptureId: captureId },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (payment) {
          payment.refundedAmount =
            parseFloat(payment.refundedAmount) +
            parseFloat(refund.amount.value);

          if (payment.refundedAmount >= payment.amount) {
            payment.status = "REFUNDED";
          } else {
            payment.status = "PARTIALLY_REFUNDED";
          }

          await payment.save({ transaction });

          const order = await Order.findByPk(payment.OrderId, {
            transaction,
            lock: transaction.LOCK.UPDATE,
          });

          if (order) {
            order.status = payment.status;
            await order.save({ transaction });
          }
        }
      }

      await transaction.commit();
    } catch (dbError) {
      await transaction.rollback();
      console.error("Webhook DB error:", dbError.message);
    }

    return res.status(200).send("Webhook processed");

  } catch (error) {
    console.error(
      "WEBHOOK ERROR:",
      error.response?.data || error.message
    );
    return res.status(500).send("Webhook error");
  }
};