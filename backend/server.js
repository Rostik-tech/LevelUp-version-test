// backend/server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";

import authRouter from "./routes/auth.js";
import orderRouter from "./routes/orders.js";
import productRouter from "./routes/products.js";
import paymentRouter from "./routes/payments.js";
import adminRouter from "./routes/admin.js";
import usersRoutes from "./routes/users.js";

import { sequelize } from "./models/index.js";
import { authenticateToken } from "./middleware/authMiddleware.js";
import { isAdmin } from "./middleware/adminMiddleware.js";

dotenv.config();

const app = express();

/* =====================
   Security Middleware
===================== */
app.use(helmet());

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
   RAW body для PayPal Webhook
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
   Routes
===================== */
app.use("/api/auth", authRouter);
app.use("/api/orders", orderRouter);
app.use("/api/products", productRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/admin", adminRouter);
app.use("/api/users", usersRoutes);

/* =====================
   Auth Test Endpoints
===================== */
app.get("/api/test-auth", authenticateToken, (req, res) => {
  res.json({
    message: "Auth works",
    user: req.user
  });
});

app.get("/api/test-admin", authenticateToken, isAdmin, (req, res) => {
  res.json({
    message: "Admin access granted"
  });
});

/* =====================
   Global Error Handler
===================== */
app.use((err, req, res, next) => {
  console.error("UNHANDLED ERROR:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

/* =====================
   Database & Server Start
===================== */
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: true });
      console.log("DB synced (development mode)");
    } else {
      await sequelize.authenticate();
      console.log("DB connected (production mode)");
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("Server startup error:", err);
    process.exit(1);
  }
};

startServer();