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
  max: 10000, // 🔥 под нагрузку

  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req) => {
    // 🔥 фикс для proxy + k6
    return req.headers["x-forwarded-for"] || req.ip;
  },

  handler: (req, res) => {
    console.log("🚫 RATE LIMIT TRIGGERED:", {
      ip: req.ip,
      forwarded: req.headers["x-forwarded-for"],
    });

    res.status(429).json({
      message: "Too many requests",
    });
  },
});