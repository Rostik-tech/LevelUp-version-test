// src/pages/Cart.jsx
import { useState } from "react";
import { createOrder, makePayment } from "../api/api.js";

export default function Cart() {
  const [orderData, setOrderData] = useState({ products: [], total: 0 });
  const [paymentMethod, setPaymentMethod] = useState("card");

  const token = localStorage.getItem("token");

  const handleOrder = async () => {
    const res = await createOrder(orderData, token);
    console.log(res);
    if (res.id) {
      alert("Заказ создан успешно!");
    } else {
      alert(res.message);
    }
  };

  const handlePayment = async () => {
    const res = await makePayment({ orderId: orderData.id, method: paymentMethod }, token);
    console.log(res);
    if (res.id) {
      alert("Оплата прошла успешно!");
    } else {
      alert(res.message);
    }
  };

  return (
    <div>
      <h1>Корзина</h1>
      <button onClick={handleOrder}>Создать заказ</button>
      <div>
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          <option value="card">Карта</option>
          <option value="cash">Наличные</option>
        </select>
        <button onClick={handlePayment}>Оплатить</button>
      </div>
    </div>
  );
}
