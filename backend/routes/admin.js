//backend/routes/admin.js
import express from "express";
import axios from "axios";
import { Op } from "sequelize";
import {
  sequelize,
  Product,
  Order,
  OrderItem,
  User,
  Payment,
  Refund
} from "../models/index.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";
import { canTransition } from "../utils/orderStatus.js";

const router = express.Router();

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

/* =========================
   PAYPAL ACCESS TOKEN
========================= */
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

/* =========================
   PRODUCTS
========================= */
router.get("/products", authenticateToken, isAdmin, async (req, res) => {
  const products = await Product.findAll();
  res.json(products);
});

router.post("/products", authenticateToken, isAdmin, async (req, res) => {
  const product = await Product.create(req.body);
  res.json(product);
});

router.put("/products/:id", authenticateToken, isAdmin, async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ message: "Not found" });

  await product.update(req.body);
  res.json(product);
});

router.delete("/products/:id", authenticateToken, isAdmin, async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ message: "Not found" });

  await product.destroy();
  res.json({ message: "Deleted" });
});

/* =========================
   ORDERS
========================= */
router.get("/orders", authenticateToken, isAdmin, async (req, res) => {
  const orders = await Order.findAll({
    include: [
      { model: User, attributes: ["id", "username", "email"] },
      { model: OrderItem, include: [Product] },
      { model: Payment }
    ],
    order: [["createdAt", "DESC"]],
  });

  res.json(orders);
});

router.get("/orders/:id", authenticateToken, isAdmin, async (req, res) => {
  const order = await Order.findByPk(req.params.id, {
    include: [
      { model: User },
      { model: OrderItem, include: [Product] },
      { model: Payment }
    ],
  });

  if (!order) return res.status(404).json({ message: "Not found" });
  res.json(order);
});

/* =========================
   ORDER STATUS
========================= */
router.patch("/orders/:id/status", authenticateToken, isAdmin, async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { status } = req.body;

    const order = await Order.findByPk(req.params.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ message: "Not found" });
    }

    if (!canTransition(order.status, status)) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invalid status transition" });
    }

    order.status = status.toUpperCase();
    await order.save({ transaction });

    await transaction.commit();
    res.json(order);

  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ message: "Error updating status" });
  }
});

/* =========================
   USERS
========================= */
router.get("/users", authenticateToken, isAdmin, async (req, res) => {
  const users = await User.findAll({
    attributes: ["id", "username", "email", "role", "createdAt"],
  });

  res.json(users);
});

/* =========================
   REFUND
========================= */
import crypto from "crypto";

/* =========================
   REFUND (ENTERPRISE LEVEL)
========================= */
router.post(
  "/orders/:id/refund",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { amount, reason } = req.body;

      // 🔒 1. Lock Order
      const order = await Order.findByPk(req.params.id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!order) {
        await transaction.rollback();
        return res.status(404).json({ message: "Order not found" });
      }

      if (!["PAID", "PARTIALLY_REFUNDED"].includes(order.status)) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Refund allowed only for paid orders",
        });
      }

      // 🔒 2. Lock correct Payment
      const payment = await Payment.findOne({
        where: {
          OrderId: order.id,
          paypalCaptureId: { [Op.ne]: null },
        },
        order: [["createdAt", "DESC"]],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!payment) {
        await transaction.rollback();
        return res.status(400).json({ message: "Capture not found" });
      }

      // 🔥 3. Fresh recalculation AFTER LOCK
      await payment.reload({
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      const currentRefunded = parseFloat(payment.refundedAmount);
      const totalAmount = parseFloat(payment.amount);
      const remaining = totalAmount - currentRefunded;

      if (remaining <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Nothing left to refund",
        });
      }

      const refundAmount = amount
        ? parseFloat(amount)
        : remaining;

      if (
        isNaN(refundAmount) ||
        refundAmount <= 0 ||
        refundAmount > remaining
      ) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Invalid refund amount",
        });
      }

      // 🔥 4. Reserve money BEFORE PayPal call
      payment.refundedAmount = currentRefunded + refundAmount;

      if (payment.refundedAmount >= totalAmount) {
        payment.status = "REFUNDED";
        order.status = "REFUNDED";
      } else {
        payment.status = "PARTIALLY_REFUNDED";
        order.status = "PARTIALLY_REFUNDED";
      }

      await payment.save({ transaction });
      await order.save({ transaction });

      // 🔐 Stable idempotency key (NO Date.now)
      const idempotencyKey = crypto
        .createHash("sha256")
        .update(`${payment.id}-${refundAmount}-${currentRefunded}`)
        .digest("hex");

      const accessToken = await getAccessToken();

      const paypalResponse = await axios.post(
        `${PAYPAL_BASE}/v2/payments/captures/${payment.paypalCaptureId}/refund`,
        {
          amount: {
            value: refundAmount.toFixed(2),
            currency_code: "USD",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "PayPal-Request-Id": idempotencyKey,
          },
        }
      );

      const paypalData = paypalResponse.data;

      if (!paypalData || paypalData.status !== "COMPLETED") {
        throw new Error("PayPal refund not completed");
      }

      // 🔥 5. Save refund record
      await Refund.create(
        {
          PaymentId: payment.id,
          amount: refundAmount,
          currency: "USD",
          paypalRefundId: paypalData.id,
          idempotencyKey,
          rawResponse: paypalData,
          status: paypalData.status,
          adminId: req.user.id,
          reason: reason || null,
        },
        { transaction }
      );

      await transaction.commit();

      return res.json({
        message: "Refund successful",
        refundedAmount: refundAmount,
      });

    } catch (error) {
      await transaction.rollback();

      console.error(
        "REFUND ERROR:",
        error.response?.data || error.message
      );

      return res.status(500).json({
        message: "Refund failed",
      });
    }
  }
);
export default router;