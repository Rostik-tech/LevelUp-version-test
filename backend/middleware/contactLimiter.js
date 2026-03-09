import rateLimit from "express-rate-limit";

export const contactLimiter = rateLimit({
  windowMs: 20 * 60 * 1000, // 20 минут
  max: 5, // максимум 5 сообщений
  message: {
    message: "Too many messages sent. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false
});