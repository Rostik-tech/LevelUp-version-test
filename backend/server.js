// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import authRouter from "./routes/auth.js";
import orderRouter from "./routes/orders.js";
import productRouter from "./routes/products.js";
import paymentRouter from "./routes/payments.js";
import adminRouter from "./routes/admin.js";
import usersRoutes from "./routes/users.js";

import { sequelize } from "./models/index.js";
import { authenticateToken } from "./middleware/authMiddleware.js";
import { isAdmin } from "./middleware/adminMiddleware.js";

const app = express();

/* =====================
   CORS
===================== */
app.use(cors({
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500"
  ],
  credentials: true
}));

/* =====================
   RAW body для Webhook
===================== */
app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" })
);

/* =====================
   JSON parser
===================== */
app.use(express.json());

/* =====================
   Роуты
===================== */
app.use("/api/auth", authRouter);
app.use("/api/orders", orderRouter);
app.use("/api/products", productRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/admin", adminRouter);
app.use("/api/users", usersRoutes);
/* =====================
   ТЕСТЫ АВТОРИЗАЦИИ
===================== */

// Проверка обычного пользователя
app.get("/api/test-auth", authenticateToken, (req, res) => {
  res.json({
    message: "Auth works",
    user: req.user
  });
});

// Проверка админа
app.get("/api/test-admin", authenticateToken, isAdmin, (req, res) => {
  res.json({
    message: "Admin access granted"
  });
});

/* =====================
   Запуск сервера
===================== */
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