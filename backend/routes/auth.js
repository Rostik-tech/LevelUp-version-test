// backend/routes/auth.js

import express from "express";
import { register, login, me } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

/* =========================
   📝 REGISTER
========================= */
router.post("/register", authLimiter, register);

/* =========================
   🔐 LOGIN
========================= */
router.post("/login", authLimiter, login);

/* =========================
   👤 CURRENT USER
========================= */
router.get("/me", authenticateToken, me);

export default router;