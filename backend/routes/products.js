import express from "express";
import { Product } from "../models/index.js";

const router = express.Router();

/* ============================
   CREATE PRODUCT
============================ */
router.post("/", async (req, res) => {
  try {
    const data = { ...req.body };

    // Автоматический пересчёт stock из sizes
    if (data.sizes && Array.isArray(data.sizes)) {
      data.stock = data.sizes.reduce(
        (total, item) => total + (item.stock || 0),
        0
      );
    }

    const product = await Product.create(data);

    res.status(201).json({
      message: "Product created successfully",
      product
    });

  } catch (err) {

    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "Slug already exists"
      });
    }

    if (err.name === "SequelizeValidationError") {
      return res.status(400).json({
        message: err.errors.map(e => e.message)
      });
    }

    res.status(500).json({ message: "Server error" });
  }
});


/* ============================
   GET ALL ACTIVE PRODUCTS
============================ */
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
    res.status(500).json({ message: "Server error" });
  }
});


/* ============================
   GET PRODUCT BY SLUG
============================ */
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
    res.status(500).json({ message: "Server error" });
  }
});


/* ============================
   UPDATE PRODUCT
============================ */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Если обновляются sizes — пересчитываем stock
    if (data.sizes && Array.isArray(data.sizes)) {
      data.stock = data.sizes.reduce(
        (total, item) => total + (item.stock || 0),
        0
      );
    }

    await product.update(data);

    res.json({
      message: "Product updated successfully",
      product
    });

  } catch (err) {

    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "Slug already exists"
      });
    }

    if (err.name === "SequelizeValidationError") {
      return res.status(400).json({
        message: err.errors.map(e => e.message)
      });
    }

    res.status(500).json({ message: "Server error" });
  }
});


/* ============================
   TOGGLE ACTIVE STATUS
============================ */
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
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
