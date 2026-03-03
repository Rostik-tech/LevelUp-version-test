// utils/orderStatus.js

/* =====================================================
   ORDER STATUS TRANSITIONS (BUSINESS LOGIC)
===================================================== */

/*
  Основной поток:

  PENDING → PAID → PROCESSING → SHIPPED → DELIVERED

  Отмены:
  PENDING → CANCELLED
  PAID → CANCELLED
  PROCESSING → CANCELLED

  REFUND-статусы НЕ меняются вручную.
  Они устанавливаются только через refund-логику.
*/

export const allowedTransitions = {
  PENDING: ["PAID", "CANCELLED"],

  PAID: ["PROCESSING", "CANCELLED"],

  PROCESSING: ["SHIPPED", "CANCELLED"],

  SHIPPED: ["DELIVERED"],

  DELIVERED: [],

  CANCELLED: [],

  PARTIALLY_REFUNDED: [],

  REFUNDED: []
};

/* =====================================================
   VALIDATION FUNCTION
===================================================== */

export const canTransition = (currentStatus, newStatus) => {
  if (!currentStatus || !newStatus) return false;

  const current = currentStatus.toUpperCase();
  const next = newStatus.toUpperCase();

  // Если статус не существует
  if (!allowedTransitions[current]) return false;

  // Нельзя вручную ставить refund-статусы
  if (next === "PARTIALLY_REFUNDED" || next === "REFUNDED") {
    return false;
  }

  return allowedTransitions[current].includes(next);
};