// routes/products.js

import express from "express";
import { Product } from "../models/index.js";
import {
  createProduct,
  getProducts,
  getProductById,
  validateProductSize
} from "../controllers/productController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

/* ============================
   CREATE PRODUCT
============================ */
router.post(
  "/",
  authenticateToken,
  isAdmin,
  createProduct
);

/* ============================
   GET ALL ACTIVE PRODUCTS
============================ */
router.get("/", getProducts);

/* ============================
   GET PRODUCT BY SLUG
   ⚠ ДОЛЖЕН БЫТЬ ВЫШЕ /:id
============================ */
router.get("/slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({
      where: { slug, isActive: true }
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    return res.json(product);

  } catch (err) {
    console.error("GET PRODUCT BY SLUG ERROR:", err.message);
    return res.status(500).json({
      message: "Server error"
    });
  }
});

/* ============================
   GET PRODUCT BY ID
============================ */
router.get("/:id", getProductById);

/* ============================
   VALIDATE PRODUCT SIZE
============================ */
router.post("/:id/validate", validateProductSize);

/* ============================
   UPDATE PRODUCT
============================ */
router.patch(
  "/:id",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const data = { ...req.body };

      const product = await Product.findByPk(id);

      if (!product) {
        return res.status(404).json({
          message: "Product not found"
        });
      }

      // Пересчёт общего stock если обновляются sizes
      if (data.sizes && Array.isArray(data.sizes)) {
        data.stock = data.sizes.reduce(
          (total, item) => total + (item.stock || 0),
          0
        );
      }

      await product.update(data);

      return res.json({
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

      console.error("UPDATE PRODUCT ERROR:", err.message);

      return res.status(500).json({
        message: "Server error"
      });
    }
  }
);

/* ============================
   TOGGLE ACTIVE STATUS
============================ */
router.patch(
  "/:id/toggle",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id);

      if (!product) {
        return res.status(404).json({
          message: "Product not found"
        });
      }

      product.isActive = !product.isActive;
      await product.save();

      return res.json({
        message: "Product status updated",
        isActive: product.isActive
      });

    } catch (err) {
      console.error("TOGGLE PRODUCT ERROR:", err.message);
      return res.status(500).json({
        message: "Server error"
      });
    }
  }
);

export default router;