// utils/orderStatus.js

export const allowedTransitions = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const canTransition = (currentStatus, newStatus) => {
  if (!currentStatus || !newStatus) return false;

  const current = currentStatus.toUpperCase();
  const next = newStatus.toUpperCase();

  return allowedTransitions[current]?.includes(next) || false;
};