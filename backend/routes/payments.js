// backend/routes/payments.js
import express from "express";
import { Payment } from "../models/index.js";

const router = express.Router();

// Создание платежа
router.post("/", async (req, res) => {
  try {
    const payment = await Payment.create(req.body);
    res.json({ message: "Платеж создан", payment });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Получение всех платежей
router.get("/", async (req, res) => {
  try {
    const payments = await Payment.findAll();
    res.json(payments);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
