// pages/Cart.jsx
import { useEffect, useState } from "react";
import { createPaypalOrder, capturePaypalOrder } from "../api/paymentApi.js";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

export default function Cart() {
  const [cart, setCart] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(storedCart);
  }, []);

  // Общая сумма корзины
  const totalAmount = cart
    .reduce((sum, item) => sum + item.price * item.quantity, 0)
    .toFixed(2);

  return (
    <div className="cart-page">
      <h1>Корзина</h1>

      {cart.length === 0 && <p>Корзина пуста</p>}

      {cart.map((item) => (
        <div key={item.id}>
          <h3>{item.name}</h3>
          <p>Цена: ${item.price}</p>
          <p>Количество: {item.quantity}</p>
        </div>
      ))}

      {cart.length > 0 && (
        <>
          <h2>Итого: ${totalAmount}</h2>

          {token ? (
            <PayPalScriptProvider
              options={{
                "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID,
                currency: "USD",
              }}
            >
              <PayPalButtons
                style={{ layout: "vertical", color: "blue", shape: "rect" }}
                createOrder={async () => {
                  const orderId = await createPaypalOrder(totalAmount);
                  return orderId;
                }}
                onApprove={async (data) => {
                  const res = await capturePaypalOrder(data.orderID);
                  console.log("Результат оплаты:", res);
                  if (res.status === "COMPLETED") {
                    alert("Оплата прошла успешно!");
                    localStorage.removeItem("cart");
                    setCart([]);
                  }
                }}
                onError={(err) => {
                  console.error("Ошибка PayPal:", err);
                  alert("Произошла ошибка при оплате PayPal");
                }}
              />
            </PayPalScriptProvider>
          ) : (
            <p>Нужно авторизоваться, чтобы оплатить</p>
          )}
        </>
      )}
    </div>
  );
}
