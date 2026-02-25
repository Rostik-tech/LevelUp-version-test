// backend/routes/auth.js

import express from "express";
import { register, login, me } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
   📝 REGISTER
========================= */
router.post("/register", register);

/* =========================
   🔐 LOGIN
========================= */
router.post("/login", login);

/* =========================
   👤 CURRENT USER
========================= */
router.get("/me", authenticateToken, me);

export default router;