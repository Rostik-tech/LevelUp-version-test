// pages/Cart.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import {
  createPaypalOrder,
  capturePaypalOrder,
} from "../api/paymentApi.js";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [backendOrderId, setBackendOrderId] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(storedCart);
  }, []);

  const totalAmount = cart
    .reduce((sum, item) => sum + item.price * item.quantity, 0)
    .toFixed(2);

  // 🔹 Создание Order в БД (только один раз)
  const createOrderInBackend = async () => {
    if (backendOrderId) return backendOrderId;

    const res = await axios.post(
      "/api/orders",
      {
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const newOrderId = res.data.order.id;
    console.log("🟡 Backend order created:", newOrderId);

    setBackendOrderId(newOrderId);
    return newOrderId;
  };

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <h1>Корзина</h1>
        <p>Корзина пуста</p>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Корзина</h1>

      {cart.map((item) => (
        <div key={item.id}>
          <h3>{item.name}</h3>
          <p>Цена: ${item.price}</p>
          <p>Количество: {item.quantity}</p>
        </div>
      ))}

      <h2>Итого: ${totalAmount}</h2>

      {!token && <p>Нужно авторизоваться, чтобы оплатить</p>}

      {token && (
        <PayPalScriptProvider
          options={{
            "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID,
            currency: "USD",
          }}
        >
          <PayPalButtons
            style={{ layout: "vertical" }}

            // 1️⃣ Создаём Order в БД → 2️⃣ Создаём PayPal Order
            createOrder={async () => {
              const orderId = await createOrderInBackend();
              const paypalOrderId = await createPaypalOrder(orderId);

              console.log("🟢 PayPal order created:", paypalOrderId);
              return paypalOrderId;
            }}

            // 3️⃣ Capture
            onApprove={async (data) => {
              console.log("🔥 onApprove:", data.orderID);

              const result = await capturePaypalOrder(data.orderID);

              console.log("🟢 Capture result:", result);

              if (result.message === "Оплата подтверждена") {
                alert("Оплата прошла успешно!");

                localStorage.removeItem("cart");
                setCart([]);
                setBackendOrderId(null);
              }
            }}

            onError={(err) => {
              console.error("❌ PayPal Error:", err);
              alert("Ошибка при оплате");
            }}
          />
        </PayPalScriptProvider>
      )}
    </div>
  );
}