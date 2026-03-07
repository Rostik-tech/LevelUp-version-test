import jwt from "jsonwebtoken";

// ================================
// JWT Authentication Middleware
// ================================
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Требуется авторизация" });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Неверный формат токена" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Токен отсутствует" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id) {
      return res.status(403).json({ message: "Некорректный токен" });
    }

    req.user = decoded;

    next();
  } catch (err) {
    return res
      .status(403)
      .json({ message: "Недействительный или просроченный токен" });
  }
};

// Named export
export const authenticateToken = authMiddleware;

// Default export
export default authMiddleware;