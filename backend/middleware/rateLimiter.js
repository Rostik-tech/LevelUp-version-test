import rateLimit from 'express-rate-limit';

export const orderLimiter = rateLimit({
  windowMs: 1000, // 1 секунда
  max: 30, // максимум 30 запросов в секунду
  standardHeaders: true,
  legacyHeaders: false,
});