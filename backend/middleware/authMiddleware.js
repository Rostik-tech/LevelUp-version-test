// backend/middleware/authMiddleware.js
import jwt from "jsonwebtoken";

// ================================
// JWT Authentication Middleware
// ================================
export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Проверка наличия header
    if (!authHeader) {
      return res.status(401).json({ message: "Требуется авторизация" });
    }

    // Проверка формата Bearer
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Неверный формат токена" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Токен отсутствует" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ВАЖНО: убедимся что id есть
    if (!decoded.id) {
      return res.status(403).json({ message: "Некорректный токен" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Недействительный или просроченный токен" });
  }
};