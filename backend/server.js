// backend/server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRouter from "./routes/auth.js";
import orderRouter from "./routes/orders.js";
import productRouter from "./routes/products.js";
import paymentRouter from "./routes/payments.js";
import adminRouter from "./routes/admin.js";
import usersRoutes from "./routes/users.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import reviewRoutes from "./routes/reviews.js";
import contactRoutes from "./routes/contact.js";


import { sequelize } from "./models/index.js";
import { authenticateToken } from "./middleware/authMiddleware.js";
import { isAdmin } from "./middleware/adminMiddleware.js";
import errorHandler from "./middleware/errorMiddleware.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("UPLOADS PATH:", path.join(__dirname, "uploads"));
dotenv.config();

const app = express();

/* =====================
   Static Files
===================== */


/* =====================
   Security Middleware
===================== */
app.use(
  "/uploads",
  helmet({
    crossOriginResourcePolicy: false,
  })
);

/* =====================
   Rate Limiting
===================== */

// Общий лимит
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "Too many requests. Please try again later."
});

// Строгий лимит для auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many login attempts."
});

// Строгий лимит для admin
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many admin requests."
});

app.use(generalLimiter);

app.use(cors({
  origin: true,
  credentials: true
}));
/* =====================
   CORS (Production Safe)
===================== */


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


app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =====================
   FRONTEND STATIC
===================== */
app.use(express.static(path.join(rootDir, "frontend")));

/* =====================
   Routes
===================== */
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/orders", orderRouter);
app.use("/api/products", productRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/admin", authenticateToken, isAdmin, adminLimiter, adminRouter);
app.use("/api/users", usersRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/contact", contactRoutes);
app.set('trust proxy', 1);

/* =====================
   FRONTEND ROUTES
===================== */

app.get("/", (req, res) => {
  res.sendFile(path.join(rootDir, "frontend", "index.html"));
});

app.get("/shop", (req, res) => {
  res.sendFile(path.join(rootDir, "frontend", "shop.html"));
});

app.get("/product", (req, res) => {
  res.sendFile(path.join(rootDir, "frontend", "product.html"));
});


/* =====================
   Auth Test Endpoints
===================== */
app.get("/api/test-auth", authenticateToken, (req, res) => 
    { res.json({ message: "Auth works", user: req.user });
});
app.get("/api/test-admin", authenticateToken, isAdmin, (req, res) => {
  res.json({ message: "Admin access granted" });
});

/* =====================
   UNIVERSAL PAGE ROUTE
===================== */
app.use((req, res, next) => {
  const requestedPath = req.path;

  // 🔥 ДОБАВЬ ЭТО
  if (requestedPath.startsWith("/uploads")) return next();

  if (requestedPath.startsWith("/api")) return next();

  if (requestedPath.includes(".")) return next();

  let filePath;

  if (requestedPath === "/") {
    filePath = path.join(rootDir, "frontend", "index.html");
  } else {
    filePath = path.join(rootDir, "frontend", requestedPath + ".html");
  }

  res.sendFile(filePath, (err) => {
    if (err) next();
  });
});
/* =====================
   404 Handler
===================== */
app.use((req, res, next) => {
  const error = new Error("Route not found");
  error.statusCode = 404;
  next(error);
});
app.use(errorHandler);

/* =====================
   Database & Server Start
===================== */
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("Database connected");

    // 👇 ДОБАВЬ ВОТ ЭТО
    
    console.log("Database synced");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("Server startup error:", err);
    process.exit(1);
  }
};

startServer();