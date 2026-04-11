//backend/middleware/rateLimiter.js
import rateLimit from "express-rate-limit";

// 🔐 строгий limiter для auth
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Слишком много попыток входа",
  },
});

// 🛒 мягкий limiter для заказов
export const orderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 2000, // большой лимит под нагрузку
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Слишком много запросов на заказы",
  },
});