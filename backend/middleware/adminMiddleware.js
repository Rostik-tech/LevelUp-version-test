// backend/middleware/adminMiddleware.js

export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role?.trim().toUpperCase() !== "ADMIN") {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }

  next();
};