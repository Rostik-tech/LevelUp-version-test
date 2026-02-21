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

  const [shipping, setShipping] = useState({
    shippingFullName: "",
    shippingPhone: "",
    shippingCountry: "",
    shippingCity: "",
    shippingAddress: "",
    shippingPostalCode: "",
    shippingApartment: "",
  });

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(storedCart);
  }, []);

  const handleChange = (e) => {
    setShipping({
      ...shipping,
      [e.target.name]: e.target.value,
    });
  };

  const totalAmount = cart
    .reduce((sum, item) => sum + item.price * item.quantity, 0)
    .toFixed(2);

  const createOrderInBackend = async () => {
    if (backendOrderId) return backendOrderId;

    // Базовая проверка
    if (
      !shipping.shippingFullName ||
      !shipping.shippingPhone ||
      !shipping.shippingCountry ||
      !shipping.shippingCity ||
      !shipping.shippingAddress ||
      !shipping.shippingPostalCode
    ) {
      alert("Заполните все обязательные поля доставки");
      throw new Error("Shipping not filled");
    }

    const res = await axios.post(
      "/api/orders",
      {
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        ...shipping,
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

      <h2>Данные доставки</h2>

      <input
        name="shippingFullName"
        placeholder="ФИО"
        value={shipping.shippingFullName}
        onChange={handleChange}
      />
      <input
        name="shippingPhone"
        placeholder="Телефон"
        value={shipping.shippingPhone}
        onChange={handleChange}
      />
      <input
        name="shippingCountry"
        placeholder="Страна"
        value={shipping.shippingCountry}
        onChange={handleChange}
      />
      <input
        name="shippingCity"
        placeholder="Город"
        value={shipping.shippingCity}
        onChange={handleChange}
      />
      <input
        name="shippingAddress"
        placeholder="Адрес"
        value={shipping.shippingAddress}
        onChange={handleChange}
      />
      <input
        name="shippingPostalCode"
        placeholder="Почтовый индекс"
        value={shipping.shippingPostalCode}
        onChange={handleChange}
      />
      <input
        name="shippingApartment"
        placeholder="Квартира (необязательно)"
        value={shipping.shippingApartment}
        onChange={handleChange}
      />

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
            createOrder={async () => {
              const orderId = await createOrderInBackend();
              const paypalOrderId = await createPaypalOrder(orderId);
              return paypalOrderId;
            }}
            onApprove={async (data) => {
              const result = await capturePaypalOrder(data.orderID);

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