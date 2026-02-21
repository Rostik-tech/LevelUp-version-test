// routes/payments.js
import express from "express";
import {
  createOrder,
  captureOrder,
  paypalWebhook
} from "../controllers/paymentController.js";

const router = express.Router();

// Создание заказа PayPal
router.post("/create", createOrder);

// Подтверждение оплаты
router.post("/capture/:id", captureOrder);

// 🔥 Webhook от PayPal
router.post("/webhook", paypalWebhook);

export default router;