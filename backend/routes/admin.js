// routes/admin.js
import express from "express";
import axios from "axios";
import { Op, QueryTypes } from "sequelize";
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
import crypto from "crypto";

const router = express.Router();

/* =====================================================
   ================= ANALYTICS =========================
===================================================== */

router.get(
  "/analytics",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const { from, to } = req.query;

      if (!from || !to) {
        return res.status(400).json({
          message: "from and to query parameters required"
        });
      }

      const fromDate = new Date(from);
      const toDate = new Date(to);

      if (isNaN(fromDate) || isNaN(toDate)) {
        return res.status(400).json({
          message: "Invalid date format"
        });
      }

      if (fromDate > toDate) {
        return res.status(400).json({
          message: "from date cannot be greater than to date"
        });
      }

      const diff = toDate.getTime() - fromDate.getTime();
      const prevFrom = new Date(fromDate.getTime() - diff);
      const prevTo = new Date(toDate.getTime() - diff);

      /* ================= CURRENT KPI ================= */

      const currentKpi = await sequelize.query(
        `
        SELECT
          COUNT(DISTINCT o.id) AS orders,
          COALESCE(SUM(p.amount),0) AS total_revenue,
          COALESCE(SUM(p."refundedAmount"),0) AS refund_amount,
          COUNT(DISTINCT o."UserId") AS customers
        FROM "Orders" o
        JOIN "Payments" p ON p."OrderId" = o.id
        WHERE o."createdAt" BETWEEN :from AND :to
        AND p.status IN ('COMPLETED','PARTIALLY_REFUNDED','REFUNDED')
        `,
        {
          replacements: { from: fromDate, to: toDate },
          type: QueryTypes.SELECT
        }
      );

      const prevKpi = await sequelize.query(
        `
        SELECT
          COUNT(DISTINCT o.id) AS orders,
          COALESCE(SUM(p.amount),0) AS total_revenue
        FROM "Orders" o
        JOIN "Payments" p ON p."OrderId" = o.id
        WHERE o."createdAt" BETWEEN :from AND :to
        AND p.status IN ('COMPLETED','PARTIALLY_REFUNDED','REFUNDED')
        `,
        {
          replacements: { from: prevFrom, to: prevTo },
          type: QueryTypes.SELECT
        }
      );

      const current = currentKpi[0] || {};
      const previous = prevKpi[0] || {};

      const totalRevenue = Number(current.total_revenue) || 0;
      const refundAmount = Number(current.refund_amount) || 0;
      const orders = Number(current.orders) || 0;
      const customers = Number(current.customers) || 0;

      const previousRevenue = Number(previous.total_revenue) || 0;
      const previousOrders = Number(previous.orders) || 0;

      const netRevenue = totalRevenue - refundAmount;

      const refundRate =
        totalRevenue > 0
          ? Number(((refundAmount / totalRevenue) * 100).toFixed(2))
          : 0;

      const avgOrderValue =
        orders > 0
          ? Number((totalRevenue / orders).toFixed(2))
          : 0;

      const revenueGrowth =
        previousRevenue > 0
          ? Number((((totalRevenue - previousRevenue) / previousRevenue) * 100).toFixed(2))
          : 0;

      const ordersGrowth =
        previousOrders > 0
          ? Number((((orders - previousOrders) / previousOrders) * 100).toFixed(2))
          : 0;

      /* ================= DAILY ================= */

      const dailyData = await sequelize.query(
        `
        SELECT
          DATE(o."createdAt") AS date,
          SUM(p.amount) AS revenue,
          COUNT(o.id) AS orders
        FROM "Orders" o
        JOIN "Payments" p ON p."OrderId" = o.id
        WHERE o."createdAt" BETWEEN :from AND :to
        AND p.status IN ('COMPLETED','PARTIALLY_REFUNDED','REFUNDED')
        GROUP BY DATE(o."createdAt")
        ORDER BY date ASC
        `,
        {
          replacements: { from: fromDate, to: toDate },
          type: QueryTypes.SELECT
        }
      );

      /* ================= TOP PRODUCTS ================= */

      const topProducts = await sequelize.query(
        `
        SELECT
          pr.id,
          pr.name,
          SUM(oi.quantity) AS units,
          SUM(oi.quantity * oi.price) AS revenue
        FROM "OrderItems" oi
        JOIN "Orders" o ON o.id = oi."OrderId"
        JOIN "Products" pr ON pr.id = oi."ProductId"
        WHERE o."createdAt" BETWEEN :from AND :to
        AND o.status IN ('PAID','PROCESSING','SHIPPED','DELIVERED','PARTIALLY_REFUNDED','REFUNDED')
        GROUP BY pr.id
        ORDER BY revenue DESC
        LIMIT 10
        `,
        {
          replacements: { from: fromDate, to: toDate },
          type: QueryTypes.SELECT
        }
      );

      return res.json({
        totalRevenue,
        refundAmount,
        netRevenue,
        refundRate,
        orders,
        customers,
        avgOrderValue,
        dailyData,
        topProducts,
        comparison: {
          previousRevenue,
          previousOrders,
          revenueGrowth,
          ordersGrowth
        }
      });

    } catch (error) {
      console.error("ANALYTICS ERROR:", error);
      return res.status(500).json({
        message: "Analytics error"
      });
    }
  }
);

/* =====================================================
   ================= PAYPAL CONFIG =====================
===================================================== */

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

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

/* =====================================================
   ================= PRODUCTS ==========================
===================================================== */

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

/* =====================================================
   ================= ORDERS ============================
===================================================== */

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

/* =====================================================
   ================= STATUS UPDATE =====================
===================================================== */

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

/* =====================================================
   ================= USERS =============================
===================================================== */

router.get("/users", authenticateToken, isAdmin, async (req, res) => {
  const users = await User.findAll({
    attributes: ["id", "username", "email", "role", "createdAt"],
  });

  res.json(users);
});

/* =====================================================
   ================= REFUND ============================
===================================================== */

router.post(
  "/orders/:id/refund",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { amount, reason } = req.body;

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

      await payment.reload({
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      const currentRefunded = parseFloat(payment.refundedAmount);
      const totalAmount = parseFloat(payment.amount);
      const remaining = totalAmount - currentRefunded;

      if (remaining <= 0) {
        await transaction.rollback();
        return res.status(400).json({ message: "Nothing left to refund" });
      }

      const refundAmount = amount ? parseFloat(amount) : remaining;

      if (isNaN(refundAmount) || refundAmount <= 0 || refundAmount > remaining) {
        await transaction.rollback();
        return res.status(400).json({ message: "Invalid refund amount" });
      }

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
      console.error("REFUND ERROR:", error.response?.data || error.message);
      return res.status(500).json({ message: "Refund failed" });
    }
  }
);

export default router;