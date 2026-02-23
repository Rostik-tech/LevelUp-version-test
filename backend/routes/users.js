// routes/users.js
import express from "express";
import { User } from "../models/index.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==============================
// GET CURRENT USER
// ==============================
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "username", "email", "role"],
    });

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    res.json(user);
  } catch (error) {
    console.error("GET /users/me ERROR:", error.message);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

export default router;