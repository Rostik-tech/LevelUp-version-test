import express from "express";
import { createOrder, captureOrder } from "../controllers/paymentController.js";

const router = express.Router();

// Создание заказа PayPal
router.post("/create", createOrder);

// Подтверждение оплаты
router.post("/capture/:id", captureOrder);

export default router;
