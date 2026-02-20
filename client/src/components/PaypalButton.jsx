// components/PaypalButton.jsx
import { useEffect } from "react";
import { createPaypalOrder, capturePaypalOrder } from "../api/paymentApi.js";

const PaypalButton = ({ amount }) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.PAYPAL_CLIENT_ID}&currency=USD`;
    script.addEventListener("load", () => {
      window.paypal.Buttons({
        createOrder: async () => {
          const orderId = await createPaypalOrder(amount);
          return orderId;
        },
        onApprove: async (data) => {
          const result = await capturePaypalOrder(data.orderID);
          console.log("Payment result:", result);
          alert("Оплата прошла успешно!");
        },
      }).render("#paypal-button-container");
    });
    document.body.appendChild(script);
  }, [amount]);

  return <div id="paypal-button-container"></div>;
};

export default PaypalButton;
