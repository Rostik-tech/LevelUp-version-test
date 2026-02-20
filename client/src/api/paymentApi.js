// api/paymentApi.js
import axios from "axios";

// Создание заказа на сервере
export const createPaypalOrder = async (amount) => {
  try {
    const res = await axios.post("/api/payments/create", { amount });
    return res.data.id; // вернёт PayPal Order ID
  } catch (error) {
    console.error("Ошибка создания заказа:", error.response || error.message);
    throw error;
  }
};

// Подтверждение оплаты на сервере
export const capturePaypalOrder = async (orderId) => {
  try {
    const res = await axios.post(`/api/payments/capture/${orderId}`);
    return res.data; // статус и детали order
  } catch (error) {
    console.error("Ошибка подтверждения оплаты:", error.response || error.message);
    throw error;
  }
};
