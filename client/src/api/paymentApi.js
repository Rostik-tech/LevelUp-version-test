// api/paymentApi.js
import axios from "axios";

// ⚠️ НЕ сохраняем token вне функций — он должен браться каждый раз
const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// ============================
// 1. Создание Order в БД
// ============================
export const createOrderInBackend = async (orderData) => {
  try {
    const res = await axios.post(
      "/api/orders",
      orderData, // теперь отправляем весь объект
      getAuthConfig()
    );

    return res.data.order.id;
  } catch (error) {
    console.error(
      "❌ Ошибка создания Order:",
      error.response?.data || error.message
    );
    throw error;
  }
};
// ============================
// 2. Создание PayPal Order
// ============================
export const createPaypalOrder = async (orderId) => {
  try {
    const res = await axios.post(
      "/api/payments/create",
      { orderId },
      getAuthConfig()
    );

    return res.data.id; // PayPal Order ID
  } catch (error) {
    console.error("❌ Ошибка создания PayPal заказа:", error.response?.data || error.message);
    throw error;
  }
};

// ============================
// 3. Capture
// ============================
export const capturePaypalOrder = async (paypalOrderId) => {
  try {
    const res = await axios.post(
      `/api/payments/capture/${paypalOrderId}`,
      {},
      getAuthConfig()
    );

    return res.data;
  } catch (error) {
    console.error("❌ Ошибка capture:", error.response?.data || error.message);
    throw error;
  }
};