// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import authRouter from "./routes/auth.js";
import orderRouter from "./routes/orders.js";
import productRouter from "./routes/products.js";
import paymentRouter from "./routes/payments.js";
import adminRouter from "./routes/admin.js";

import { sequelize } from "./models/index.js";
import { authenticateToken } from "./middleware/authMiddleware.js";
import { isAdmin } from "./middleware/adminMiddleware.js";

const app = express();

app.use(cors());

// 🔥 ВАЖНО: Webhook должен получать RAW body
app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" })
);

// 🔥 Остальные роуты получают обычный JSON
app.use(express.json());

// =====================
// Роуты
// =====================
app.use("/api/auth", authRouter);
app.use("/api/orders", orderRouter);
app.use("/api/products", productRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/admin", adminRouter);

app.get("/api/test-admin", authenticateToken, isAdmin, (req, res) => {
  res.json({ message: "Admin access granted" });
});

// =====================
// Запуск сервера
// =====================
const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true })
  .then(() => {
    console.log("База данных синхронизирована");
    app.listen(PORT, () =>
      console.log(`Сервер запущен на порту ${PORT}`)
    );
  })
  .catch((err) =>
    console.log("Ошибка синхронизации базы:", err)
  );