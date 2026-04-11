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

// 🛒 мягкий limiter для заказов (под нагрузку)
export const orderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 10000, // 🔥 увеличили лимит (было 2000)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Слишком много запросов на заказы",
  },
});