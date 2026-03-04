// routes/admin.js
import express from "express";
import axios from "axios";
import { Op, QueryTypes } from "sequelize";
import { upload } from "../middleware/uploadMiddleware.js";
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
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const offset = (pageNumber - 1) * limitNumber;

    const where = {};

    // Search по name / slug / brand
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { slug: { [Op.iLike]: `%${search}%` } },
        { brand: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Фильтр по активности
    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const { rows, count } = await Product.findAndCountAll({
      where,
      limit: limitNumber,
      offset,
      order: [["createdAt", "DESC"]]
    });

    return res.json({
      success: true,
      data: rows,
      meta: {
        total: count,
        page: pageNumber,
        pages: Math.ceil(count / limitNumber)
      }
    });

  } catch (err) {
    console.error("ADMIN PRODUCTS ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


router.post(
  "/products",
  authenticateToken,
  isAdmin,
  upload.array("images", 5),
  async (req, res) => {
  try {
    const data = { ...req.body };

    // Парсим sizes если приходит строкой
if (data.sizes && typeof data.sizes === "string") {
  try {
    data.sizes = JSON.parse(data.sizes);
  } catch (err) {
    return res.status(400).json({ message: "Invalid sizes format" });
  }
}

    if (req.files && req.files.length > 0) {
  data.images = req.files.map(
    file => `/uploads/products/${file.filename}`
  );
}

    // пересчёт stock
    if (data.sizes && Array.isArray(data.sizes)) {
      data.stock = data.sizes.reduce(
        (total, item) => total + (item.stock || 0),
        0
      );
    }

    const product = await Product.create(data);

    return res.status(201).json({
      success: true,
      data: product
    });

  } catch (err) {
    console.error("CREATE PRODUCT ERROR:", err);
    return res.status(500).json({ message: "Error creating product" });
  }
});


router.put(
  "/products/:id",
  authenticateToken,
  isAdmin,
  upload.array("images", 5),
  async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Not found" });

    const data = { ...req.body };

    // Парсим sizes если приходит строкой
if (data.sizes && typeof data.sizes === "string") {
  try {
    data.sizes = JSON.parse(data.sizes);
  } catch (err) {
    return res.status(400).json({ message: "Invalid sizes format" });
  }
}

    if (req.files && req.files.length > 0) {
  data.images = req.files.map(
    file => `/uploads/products/${file.filename}`
  );
}

    if (data.sizes && Array.isArray(data.sizes)) {
      data.stock = data.sizes.reduce(
        (total, item) => total + (item.stock || 0),
        0
      );
    }

    await product.update(data);

    return res.json({
      success: true,
      data: product
    });

  } catch (err) {
    console.error("UPDATE PRODUCT ERROR:", err);
    return res.status(500).json({ message: "Error updating product" });
  }
});


router.delete("/products/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Not found" });

    product.isActive = false;
    product.stock = 0;

    await product.save();

    return res.json({
      success: true,
      message: "Product archived"
    });

  } catch (err) {
    console.error("DELETE PRODUCT ERROR:", err);
    return res.status(500).json({ message: "Error archiving product" });
  }
});

/* =====================================================
   ================= ORDER STATS =======================
===================================================== */

router.get("/orders/stats", authenticateToken, isAdmin, async (req, res) => {
  try {
    const now = new Date();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalOrders = await Order.count();

    const pendingOrders = await Order.count({
      where: { status: "PENDING" }
    });

    const paidOrders = await Order.findAll({
      where: { status: "PAID" },
      attributes: ["totalPrice", "refundedAmount"]
    });

    const totalRevenue = paidOrders.reduce(
      (sum, order) => sum + parseFloat(order.totalPrice),
      0
    );

    const totalRefunded = paidOrders.reduce(
      (sum, order) => sum + parseFloat(order.refundedAmount || 0),
      0
    );

    const revenueTodayOrders = await Order.findAll({
      where: {
        status: "PAID",
        createdAt: { [Op.gte]: startOfToday }
      },
      attributes: ["totalPrice"]
    });

    const revenueToday = revenueTodayOrders.reduce(
      (sum, order) => sum + parseFloat(order.totalPrice),
      0
    );

    const revenueMonthOrders = await Order.findAll({
      where: {
        status: "PAID",
        createdAt: { [Op.gte]: startOfMonth }
      },
      attributes: ["totalPrice"]
    });

    const revenueThisMonth = revenueMonthOrders.reduce(
      (sum, order) => sum + parseFloat(order.totalPrice),
      0
    );

    return res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalRefunded: Number(totalRefunded.toFixed(2)),
        revenueToday: Number(revenueToday.toFixed(2)),
        revenueThisMonth: Number(revenueThisMonth.toFixed(2))
      }
    });

  } catch (err) {
    console.error("ORDER STATS ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   ================= ORDERS ============================
===================================================== */

router.get("/orders", authenticateToken, isAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      from,
      to,
      country,
      minTotal,
      maxTotal,
      sort
    } = req.query;

    const pageNumber = Math.max(parseInt(page) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
    const offset = (pageNumber - 1) * limitNumber;

    const where = {};
    let userWhere = null;

    /* ================= STATUS FILTER ================= */

    if (status) {
      where.status = status.toUpperCase();
    }

    /* ================= DATE FILTER ================= */

    if (from || to) {
      where.createdAt = {};

      if (from) {
        where.createdAt[Op.gte] = new Date(from);
      }

      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = toDate;
      }
    }

    /* ================= COUNTRY FILTER ================= */

    if (country) {
      where.shippingCountry = country;
    }

    /* ================= TOTAL FILTER ================= */

    if (minTotal || maxTotal) {
      where.totalPrice = {};

      if (minTotal) {
        where.totalPrice[Op.gte] = parseFloat(minTotal);
      }

      if (maxTotal) {
        where.totalPrice[Op.lte] = parseFloat(maxTotal);
      }
    }

    /* ================= SEARCH ================= */

    if (search) {
      if (!isNaN(search)) {
        where.id = parseInt(search);
      } else {
        userWhere = {
          [Op.or]: [
            { email: { [Op.iLike]: `%${search}%` } },
            { username: { [Op.iLike]: `%${search}%` } }
          ]
        };
      }
    }

    /* ================= SORTING ================= */

    let order = [["createdAt", "DESC"]];

    switch (sort) {
      case "price_asc":
        order = [["totalPrice", "ASC"]];
        break;
      case "price_desc":
        order = [["totalPrice", "DESC"]];
        break;
      case "date_asc":
        order = [["createdAt", "ASC"]];
        break;
      case "date_desc":
        order = [["createdAt", "DESC"]];
        break;
    }

    /* ================= QUERY ================= */

    const { rows, count } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: User,
          attributes: ["id", "username", "email"],
          where: userWhere || undefined,
          required: !!userWhere
        },
        {
          model: OrderItem,
          include: [Product]
        },
        {
          model: Payment
        }
      ],
      limit: limitNumber,
      offset,
      order,
      distinct: true
    });

    return res.json({
      success: true,
      data: rows,
      meta: {
        total: count,
        page: pageNumber,
        pages: count === 0 ? 0 : Math.ceil(count / limitNumber)
      }
    });

  } catch (err) {
    console.error("ADMIN ORDERS ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


router.get("/orders/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User },
        { model: OrderItem, include: [Product] },
        { model: Payment }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.json({
      success: true,
      data: order
    });

  } catch (err) {
    console.error("GET ORDER ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


/* =====================================================
   ================= STATUS UPDATE =====================
===================================================== */

router.patch("/orders/:id/status", authenticateToken, isAdmin, async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { status } = req.body;

    if (!status) {
      await transaction.rollback();
      return res.status(400).json({ message: "Status is required" });
    }

    const order = await Order.findByPk(req.params.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ message: "Order not found" });
    }

    const normalizedStatus = status.toUpperCase();

    if (!canTransition(order.status, normalizedStatus)) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invalid status transition" });
    }

    order.status = normalizedStatus;
    await order.save({ transaction });

    await transaction.commit();

    return res.json({
      success: true,
      message: "Status updated",
      data: order
    });

  } catch (err) {
    await transaction.rollback();
    console.error("STATUS UPDATE ERROR:", err);
    return res.status(500).json({ message: "Error updating status" });
  }
});


/* =====================================================
   ================= USERS =============================
===================================================== */

router.get("/users", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;

    const pageNumber = Math.max(parseInt(page) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
    const offset = (pageNumber - 1) * limitNumber;

    const where = {};

    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (role) {
      where.role = role.toUpperCase();
    }

    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: ["id", "username", "email", "role", "createdAt"],
      limit: limitNumber,
      offset,
      order: [["createdAt", "DESC"]]
    });

    return res.json({
      success: true,
      data: rows,
      meta: {
        total: count,
        page: pageNumber,
        pages: count === 0 ? 0 : Math.ceil(count / limitNumber)
      }
    });

  } catch (err) {
    console.error("ADMIN USERS ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   ================= REFUND =========================
===================================================== */

router.post("/orders/:id/refund", authenticateToken, isAdmin, async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const orderId = req.params.id;
    const { amount, reason } = req.body || {};

    const refundAmount = parseFloat(amount);

    if (!refundAmount || refundAmount <= 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invalid refund amount" });
    }

    // 🔒 1. Lock Order
    const order = await Order.findByPk(orderId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ message: "Order not found" });
    }

    // 🔒 2. Lock Payment отдельно (без include!)
    const payment = await Payment.findOne({
      where: { OrderId: order.id },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!payment || !payment.paypalCaptureId) {
      await transaction.rollback();
      return res.status(400).json({ message: "Payment not refundable" });
    }

    const paymentAmount = parseFloat(payment.amount);
    const alreadyRefunded = parseFloat(payment.refundedAmount || 0);

    const remaining = paymentAmount - alreadyRefunded;

    if (refundAmount > remaining) {
      await transaction.rollback();
      return res.status(400).json({ message: "Refund exceeds remaining amount" });
    }

    // 🔑 3. PayPal refund call
    const accessToken = await getAccessToken();

    const paypalResponse = await axios.post(
      `${PAYPAL_BASE}/v2/payments/captures/${payment.paypalCaptureId}/refund`,
      {
        amount: {
          currency_code: payment.currency || "USD",
          value: refundAmount.toFixed(2),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const refundData = paypalResponse.data;
    const idempotencyKey = crypto.randomUUID();

    // 🧾 4. Create Refund record
    await Refund.create(
      {
        amount: refundAmount,
        currency: payment.currency || "USD",
        idempotencyKey,
        paypalRefundId: refundData.id,
        rawResponse: refundData,
        status: "COMPLETED",
        adminId: req.user.id,
        PaymentId: payment.id,
        reason: reason || null
      },
      { transaction }
    );

    // 🔄 5. Update Payment
    payment.refundedAmount = alreadyRefunded + refundAmount;
    order.refundedAmount = parseFloat(order.refundedAmount || 0) + refundAmount;

    if (payment.refundedAmount >= paymentAmount) {
      payment.status = "REFUNDED";
      order.status = "REFUNDED";
    } else {
      payment.status = "PARTIALLY_REFUNDED";
      order.status = "PARTIALLY_REFUNDED";
    }

    await payment.save({ transaction });
    await order.save({ transaction });

    await transaction.commit();

    return res.json({
      success: true,
      message: "Refund processed",
    });

  } catch (err) {
    await transaction.rollback();
    console.error("ADMIN REFUND ERROR:", err.response?.data || err.message);
    return res.status(500).json({ message: "Refund failed" });
  }
});
export default router;