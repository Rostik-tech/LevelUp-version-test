// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();
import authRouter from "./routes/auth.js";
import orderRouter from "./routes/orders.js";
import productRouter from "./routes/products.js";
import paymentRouter from "./routes/payments.js";

import { sequelize } from "./models/index.js";



const app = express();

app.use(cors());
app.use(bodyParser.json());

// Роуты
app.use("/api/auth", authRouter);
app.use("/api/orders", orderRouter);
app.use("/api/products", productRouter);
app.use("/api/payments", paymentRouter);

// Запуск сервера
const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true })
  .then(() => {
    console.log("База данных синхронизирована");
    app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
  })
  .catch(err => console.log("Ошибка синхронизации базы:", err));
