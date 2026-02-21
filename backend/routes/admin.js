import express from "express";
import { Product } from "../models/index.js";
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

export default router;