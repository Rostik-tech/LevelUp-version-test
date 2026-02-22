// backend/routes/admin.js

import express from "express";
import { sequelize, Product, Order, OrderItem, User } from "../models/index.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";
import { canTransition } from "../utils/orderStatus.js";

const router = express.Router();

/* =========================
   📦 ПОЛУЧИТЬ ВСЕ ТОВАРЫ
========================= */
router.get("/products", authenticateToken, isAdmin, async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Ошибка получения товаров" });
  }
});

/* =========================
   ➕ СОЗДАТЬ ТОВАР
========================= */
router.post("/products", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, description, price, image, stock } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      image,
      stock: stock ?? 0,
    });

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Ошибка создания товара" });
  }
});

/* =========================
   ✏ ОБНОВИТЬ ТОВАР
========================= */
router.put("/products/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, description, price, image, stock } = req.body;

    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.name = name ?? product.name;
    product.description = description ?? product.description;
    product.price = price ?? product.price;
    product.image = image ?? product.image;
    product.stock = stock ?? product.stock;

    await product.save();

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Ошибка обновления товара" });
  }
});

/* =========================
   ❌ УДАЛИТЬ ТОВАР
========================= */
router.delete("/products/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await product.destroy();
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: "Ошибка удаления товара" });
  }
});

/* =========================
   📦 ПОЛУЧИТЬ ВСЕ ЗАКАЗЫ
========================= */
router.get("/orders", authenticateToken, isAdmin, async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        { model: User, attributes: ["id", "username", "email"] },
        { model: OrderItem, include: [Product] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Ошибка получения заказов" });
  }
});

/* =========================
   📄 ПОЛУЧИТЬ ОДИН ЗАКАЗ
========================= */
router.get("/orders/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ["id", "username", "email"] },
        { model: OrderItem, include: [Product] },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Ошибка получения заказа" });
  }
});

/* =========================
   🔄 ИЗМЕНИТЬ СТАТУС ЗАКАЗА (PRODUCTION SAFE)
========================= */
router.patch("/orders/:id/status", authenticateToken, isAdmin, async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { status } = req.body;

    if (!status) {
      await transaction.rollback();
      return res.status(400).json({ message: "Новый статус обязателен" });
    }

    const order = await Order.findByPk(req.params.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ message: "Order not found" });
    }

    const currentStatus = order.status.toUpperCase();
    const newStatus = status.toUpperCase();

    // Уже установлен
    if (currentStatus === newStatus) {
      await transaction.commit();
      return res.json({
        message: "Статус уже установлен",
        order,
      });
    }

    // Проверка допустимого перехода
    if (!canTransition(currentStatus, newStatus)) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Недопустимый переход статуса: ${currentStatus} → ${newStatus}`,
      });
    }

    order.status = newStatus;
    await order.save({ transaction });

    await transaction.commit();

    res.json({
      message: "Статус успешно обновлён",
      order,
    });

  } catch (error) {
    await transaction.rollback();
    console.error("ADMIN STATUS ERROR:", error.message);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

/* =========================
   👥 ПОЛУЧИТЬ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ
========================= */
router.get("/users", authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "username", "email", "role", "createdAt"],
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Ошибка получения пользователей" });
  }
});

/* =========================
   🔎 НАЙТИ ПОЛЬЗОВАТЕЛЯ ПО EMAIL
========================= */
router.get("/users/search", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: "Email query is required" });
    }

    const user = await User.findOne({
      where: { email },
      attributes: ["id", "username", "email", "role", "createdAt"],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Ошибка поиска пользователя" });
  }
});

export default router;