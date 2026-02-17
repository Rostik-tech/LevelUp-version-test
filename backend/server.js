// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Тестовый маршрут
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Маршрут для проверки работы API
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working" });
});

// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

