// src/api/api.js
const API_URL = "http://localhost:5000/api"; // адрес твоего бэкенда

// Регистрация
export const registerUser = async (userData) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return res.json();
};

// Логин
export const loginUser = async (loginData) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(loginData),
  });
  return res.json();
};

// Получение продуктов
export const fetchProducts = async () => {
  const res = await fetch(`${API_URL}/products`);
  return res.json();
};

// Создание заказа
export const createOrder = async (orderData, token) => {
  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}` 
    },
    body: JSON.stringify(orderData),
  });
  return res.json();
};

// Оплата
export const makePayment = async (paymentData, token) => {
  const res = await fetch(`${API_URL}/payments`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}` 
    },
    body: JSON.stringify(paymentData),
  });
  return res.json();
};


