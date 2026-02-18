// backend/routes/products.js
import express from "express";
import { Product } from "../models/index.js";

const router = express.Router();

// Создание продукта
router.post("/", async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.json({ message: "Продукт создан", product });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Получение всех продуктов
router.get("/", async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;

