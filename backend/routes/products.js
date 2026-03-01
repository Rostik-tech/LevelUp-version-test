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
    const products = await Product.findAll({
      where: { isActive: true },
      attributes: [
        "id",
        "name",
        "slug",
        "price",
        "currency",
        "shortDescription",
        "images"
      ],
      order: [["createdAt", "DESC"]]
    });

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Получение продукта по slug
router.get("/slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({
      where: { slug, isActive: true }
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Деактивация / активация продукта
router.patch("/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.json({
      message: "Product status updated",
      isActive: product.isActive
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
export default router;

