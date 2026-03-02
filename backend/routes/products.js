import express from "express";
import {
  getProducts,
  getProductById,
  getProductBySlug,
  validateProductSize
} from "../controllers/productController.js";

const router = express.Router();

/* ============================
   GET ALL ACTIVE PRODUCTS
============================ */
router.get("/", getProducts);

/* ============================
   GET PRODUCT BY SLUG
   ⚠ ДОЛЖЕН БЫТЬ ВЫШЕ /:id
============================ */
router.get("/slug/:slug", getProductBySlug);

/* ============================
   GET PRODUCT BY ID
============================ */
router.get("/:id", getProductById);

/* ============================
   VALIDATE PRODUCT SIZE
============================ */
router.post("/:id/validate", validateProductSize);

export default router;