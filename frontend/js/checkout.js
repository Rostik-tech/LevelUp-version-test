import { getToken } from "./auth.js";

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

    const shippingData = {
        fullName: document.getElementById("fullName").value,
        phone: document.getElementById("phone").value,
        country: document.getElementById("country").value,
        city: document.getElementById("city").value,
        address: document.getElementById("address").value,
        postalCode: document.getElementById("postalCode").value,
        apartment: document.getElementById("apartment").value,
        orderNotes: document.getElementById("orderNotes").value
    };

    try {
        const response = await fetch("http://localhost:5000/api/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + getToken()
            },
            body: JSON.stringify({
                items: cart.items,
                shippingAddress: shippingData
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Ошибка создания заказа");
            return;
        }

        // Сохраняем ID заказа для PayPal
        localStorage.setItem("currentOrderId", data.id);

        alert("Заказ создан. Переход к оплате...");

        // Здесь позже будет PayPal create
        window.location.reload();

    } catch (err) {
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