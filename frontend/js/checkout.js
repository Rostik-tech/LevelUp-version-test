import { getToken } from "./auth.js";

const API_BASE = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", () => {
    const token = getToken();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const cart = window.cart;

    if (!cart || cart.items.length === 0) {
        showEmptyCheckout();
        return;
    }

    displayOrderSummary();
    updateOrderTotals();

    document
        .getElementById("checkoutForm")
        .addEventListener("submit", handleCheckout);
});

function displayOrderSummary() {
    const summaryItems = document.getElementById("summaryItems");
    const cart = window.cart;

    summaryItems.innerHTML = cart.items.map(item => `
        <div class="summary-item">
            <div class="summary-item-name">${item.name.ru}</div>
            <div>${item.quantity} × $${item.price.toFixed(2)}</div>
        </div>
    `).join("");
}

function updateOrderTotals() {
    const cart = window.cart;

    const subtotal = cart.getTotal();
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    document.getElementById("subtotalAmount").textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById("taxAmount").textContent = `$${tax.toFixed(2)}`;
    document.getElementById("totalAmount").textContent = `$${total.toFixed(2)}`;
}

async function handleCheckout(e) {
    e.preventDefault();

    const cart = window.cart;
    const token = getToken();

    const shippingData = {
        shippingFullName: document.getElementById("fullName").value,
        shippingPhone: document.getElementById("phone").value,
        shippingCountry: document.getElementById("country").value,
        shippingCity: document.getElementById("city").value,
        shippingAddress: document.getElementById("address").value,
        shippingPostalCode: document.getElementById("postalCode").value,
        shippingApartment: document.getElementById("apartment").value
    };

    try {
        // 1️⃣ Создаём Order в нашей БД
        const orderResponse = await fetch(`${API_BASE}/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                items: cart.items.map(item => ({
                    productId: item.id,
                    quantity: item.quantity
                })),
                ...shippingData
            })
        });

        const orderData = await orderResponse.json();

        if (!orderResponse.ok) {
            alert(orderData.message || "Ошибка создания заказа");
            return;
        }

        const orderId = orderData.order.id;

        // 2️⃣ Создаём PayPal order
        const paymentResponse = await fetch(`${API_BASE}/payments/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({ orderId })
        });

        const paymentData = await paymentResponse.json();

        if (!paymentResponse.ok) {
            alert(paymentData.message || "Ошибка создания PayPal заказа");
            return;
        }

        // 3️⃣ Находим approval link
        const approvalLink = paymentData.links.find(
            link => link.rel === "approve"
        )?.href;

        if (!approvalLink) {
            alert("Не удалось получить ссылку оплаты");
            return;
        }

        // 4️⃣ Сохраняем orderId для capture после возврата
        localStorage.setItem("currentOrderId", orderId);

        // 5️⃣ Redirect на PayPal
        window.location.href = approvalLink;

    } catch (err) {
        console.error(err);
        alert("Ошибка соединения с сервером");
    }
}

function showEmptyCheckout() {
    const checkoutLayout = document.querySelector(".checkout-layout");
    checkoutLayout.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center;">
            <h2>Корзина пуста</h2>
            <a href="shop.html" class="btn btn-primary">Перейти в магазин</a>
        </div>
    `;
}