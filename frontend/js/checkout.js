//  checkout.js
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

    const form = document.getElementById("checkoutForm");
    if (form) {
        form.addEventListener("submit", handleCheckout);
    }
});


// ========================================
// Render summary
// ========================================

function displayOrderSummary() {
    const summaryItems = document.getElementById("summaryItems");
    const cart = window.cart;
    if (!summaryItems || !cart) return;

    const lang = window.currentLanguage
        ? window.currentLanguage()
        : "ru";

    summaryItems.innerHTML = cart.items
        .map((item) => {
            const name =
                item.name?.[lang] ||
                item.name?.ru ||
                item.name ||
                "Product";

            const price = item.price;

const formatted = window.formatPrice
    ? window.formatPrice(price)
    : `$${price.toFixed(2)}`;

return `
    <div class="summary-item">
        <div class="summary-item-name">
            ${name}
        </div>
        <div>
            ${item.quantity} × ${formatted}
        </div>
    </div>
`;
        })
        .join("");
}


// ========================================
// Totals
// ========================================

function updateOrderTotals() {

    const cart = window.cart;
    if (!cart) return;

    const subtotal = cart.getTotal();

    const total = subtotal;

    const format = window.formatPrice
        ? window.formatPrice
        : (p) => `$${p.toFixed(2)}`;

    document.getElementById("subtotalAmount").textContent =
        format(subtotal);

    document.getElementById("taxAmount").textContent =
        format(tax);

    document.getElementById("totalAmount").textContent =
        format(total);

}


// ========================================
// Checkout Submit
// ========================================

async function handleCheckout(e) {
    e.preventDefault();

    const cart = window.cart;
    const token = getToken();
    const button = document.getElementById("paypalButton");

    if (!cart || cart.items.length === 0) {
        alert("Корзина пуста");
        return;
    }

    button.disabled = true;
    button.innerHTML = "Обработка...";

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
        // 1️⃣ Create Order in DB
        const orderResponse = await fetch(`${API_BASE}/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify({
                items: cart.items.map((item) => ({
                    productId: item.id,
                    quantity: item.quantity
                })),
                ...shippingData
            })
        });

        const orderData = await orderResponse.json();

        if (!orderResponse.ok) {
            throw new Error(orderData.message);
        }

        const orderId = orderData.order.id;

        // 2️⃣ Create PayPal order
        const paymentResponse = await fetch(
            `${API_BASE}/payments/create`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token
                },
                body: JSON.stringify({ orderId })
            }
        );

        const paymentData = await paymentResponse.json();

        if (!paymentResponse.ok) {
            throw new Error(paymentData.message);
        }

        const approvalLink = paymentData.links.find(
            (link) => link.rel === "approve"
        )?.href;

        if (!approvalLink) {
            throw new Error("Ссылка оплаты не получена");
        }

        // ❗ Никакого capture тут больше нет
        window.location.href = approvalLink;

    } catch (err) {
        console.error(err);
        alert(err.message || "Ошибка оформления заказа");
        button.disabled = false;
        button.innerHTML = "Оплатить через PayPal";
    }
}


// ========================================
// Empty
// ========================================

function showEmptyCheckout() {
    const checkoutLayout =
        document.querySelector(".checkout-layout");

    if (!checkoutLayout) return;

    checkoutLayout.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center;">
            <h2>Корзина пуста</h2>
            <a href="shop.html" class="btn btn-primary">
                Перейти в магазин
            </a>
        </div>
    `;
}