// backend/routes/orders.js
import express from "express";
import { sequelize, Order, OrderItem, Product } from "../models/index.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { Op } from "sequelize";
import { orderLimiter } from '../middleware/rateLimiter.js';
import { createOrder } from '../controllers/orderController.js';

const router = express.Router();

router.post(
  "/",
  orderLimiter,
  authenticateToken,
  createOrder
);


// ========================================
// МОИ ЗАКАЗЫ
// ========================================
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { UserId: req.user.id },
      include: [
        {
          model: OrderItem,
          include: [Product],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========================================
// АДМИН: ВСЕ ЗАКАЗЫ
// ========================================
router.get("/", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Доступ запрещён" });
    }

    const orders = await Order.findAll({
      include: [
        {
          model: OrderItem,
          include: [Product],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;