// backend/controllers/authController.js

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

/* =========================
   📝 REGISTER
========================= */
export const register = async (req, res) => {
  try {

    console.log("REGISTER BODY:", req.body); // 👈 ДОБАВЬ

    const { username, email, password, fullName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Все поля обязательны" });
    }

    const existing = await User.findOne({ where: { email } });

    if (existing) {
      return res.status(400).json({ message: "Пользователь уже существует" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: "USER"
    });
    console.log("CREATED USER:", user); // 👈 ДОБАВЬ



    return res.status(201).json({
      message: "Пользователь создан",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err.message);
    return res.status(500).json({ message: "Ошибка регистрации" });
  }
};

/* =========================
   🔐 LOGIN
========================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email и пароль обязательны" });
    }

    const user = await User.findOne({ where: { email } });

        console.log("USER FROM DB:", user);
        console.log("INPUT EMAIL:", email);
        console.log("INPUT PASSWORD:", password);
    if (!user) {
      return res.status(400).json({ message: "Пользователь не найден" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    console.log("PASSWORD MATCH:", isMatch);
    console.log("HASH IN DB:", user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Неверный пароль" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Успешный вход",
      token
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err.message);
    return res.status(500).json({ message: "Ошибка входа" });
  }
};

/* =========================
   👤 GET CURRENT USER
========================= */
export const me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "username", "email", "role", "createdAt"]
    });

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    return res.json(user);

  } catch (err) {
    console.error("ME ERROR:", err.message);
    return res.status(500).json({ message: "Ошибка получения пользователя" });
  }
};