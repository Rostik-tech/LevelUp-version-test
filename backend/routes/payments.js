// routes/payments.js
import express from "express";
import {
  createOrder,
  captureOrder,
  paypalWebhook
} from "../controllers/paymentController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Создание PayPal order (только авторизованный пользователь)
router.post("/create", authenticateToken, createOrder);

// Capture (только авторизованный пользователь)
router.post("/capture/:id", authenticateToken, captureOrder);

// Webhook от PayPal (без JWT!)
router.post("/webhook", paypalWebhook);

export default router;