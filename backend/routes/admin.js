import express from "express";
import { Product, Order, OrderItem, User } from "../models/index.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

/* =========================
   📦 ПОЛУЧИТЬ ВСЕ ТОВАРЫ
========================= */
router.get("/products", authenticateToken, isAdmin, async (req, res) => {
  const products = await Product.findAll();
  res.json(products);
});

/* =========================
   ➕ СОЗДАТЬ ТОВАР
========================= */
router.post("/products", authenticateToken, isAdmin, async (req, res) => {
  const { name, description, price, image } = req.body;

  const product = await Product.create({
    name,
    description,
    price,
    image
  });

  res.json(product);
});

/* =========================
   ✏ ОБНОВИТЬ ТОВАР
========================= */
router.put("/products/:id", authenticateToken, isAdmin, async (req, res) => {
  const { name, description, price, image } = req.body;

  const product = await Product.findByPk(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  product.name = name ?? product.name;
  product.description = description ?? product.description;
  product.price = price ?? product.price;
  product.image = image ?? product.image;

  await product.save();

  res.json(product);
});

/* =========================
   ❌ УДАЛИТЬ ТОВАР
========================= */
router.delete("/products/:id", authenticateToken, isAdmin, async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  await product.destroy();
  res.json({ message: "Product deleted" });
});

/* =========================
   📦 ПОЛУЧИТЬ ВСЕ ЗАКАЗЫ
========================= */
router.get("/orders", authenticateToken, isAdmin, async (req, res) => {
  const orders = await Order.findAll({
    include: [
      { model: User, attributes: ["id", "username", "email"] },
      { model: OrderItem, include: [Product] }
    ],
    order: [["createdAt", "DESC"]]
  });

  res.json(orders);
});

/* =========================
   📄 ПОЛУЧИТЬ ОДИН ЗАКАЗ
========================= */
router.get("/orders/:id", authenticateToken, isAdmin, async (req, res) => {
  const order = await Order.findByPk(req.params.id, {
    include: [
      { model: User, attributes: ["id", "username", "email"] },
      { model: OrderItem, include: [Product] }
    ]
  });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  res.json(order);
});

/* =========================
   🔄 ИЗМЕНИТЬ СТАТУС ЗАКАЗА
========================= */
router.put("/orders/:id", authenticateToken, isAdmin, async (req, res) => {
  const { status } = req.body;

  const order = await Order.findByPk(req.params.id);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  order.status = status;
  await order.save();

  res.json(order);
});

/* =========================
   👥 ПОЛУЧИТЬ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ
========================= */
router.get("/users", authenticateToken, isAdmin, async (req, res) => {
  const users = await User.findAll({
    attributes: ["id", "username", "email", "role", "createdAt"]
  });

  res.json(users);
});

/* =========================
   🔎 НАЙТИ ПОЛЬЗОВАТЕЛЯ ПО EMAIL
========================= */
router.get("/users/search", authenticateToken, isAdmin, async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: "Email query is required" });
  }

  const user = await User.findOne({
    where: { email },
    attributes: ["id", "username", "email", "role", "createdAt"]
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(user);
});

export default router;