// checkout.js
import { apiRequest } from "./admin-api.js";
import { getToken } from "./auth.js";

const checkoutData = JSON.parse(localStorage.getItem("checkoutData"));

document.addEventListener("DOMContentLoaded", () => {
    const token = getToken();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    if (!checkoutData || checkoutData.items.length === 0) {
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
    if (!summaryItems || !checkoutData) return;

    const lang = window.currentLanguage
        ? window.currentLanguage()
        : "ru";

    summaryItems.innerHTML = checkoutData.items
        .map((item) => {
            const name =
                item.name?.[lang] ||
                item.name?.ru ||
                item.name ||
                "Product";

            const formatted = window.formatPrice(item.price);

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
    if (!checkoutData) return;

    const subtotal = checkoutData.total;
    const total = subtotal;

    document.getElementById("subtotalAmount").textContent =
        window.formatPrice(subtotal);

    document.getElementById("totalAmount").textContent =
        window.formatPrice(total);
}

// ========================================
// Checkout Submit
// ========================================

async function handleCheckout(e) {
    e.preventDefault();

    const token = getToken();
    const button = document.getElementById("paypalButton");

    if (!button) return;

    if (!checkoutData || checkoutData.items.length === 0) {
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

    // ✅ базовая валидация
    if (!shippingData.shippingFullName || !shippingData.shippingAddress) {
        alert("Заполни обязательные поля");
        button.disabled = false;
        button.innerHTML = "Оплатить через PayPal";
        return;
    }

    try {
        // 1️⃣ Create Order
        const orderData = await apiRequest("/orders", {
            method: "POST",
            body: JSON.stringify({
                items: checkoutData.items.map((item) => ({
                    productId: item.id,
                    quantity: item.quantity
                })),
                ...shippingData
            })
        });

        console.log("ORDER DATA:", orderData);

        const orderId = orderData?.order?.id || orderData?.id;

        if (!orderId) {
            throw new Error("Order ID не получен");
        }

        // 2️⃣ Create Payment
        const paymentData = await apiRequest("/payments/create", {
            method: "POST",
            body: JSON.stringify({ orderId })
        });

        console.log("PAYMENT DATA:", paymentData);

        const approvalLink =
            paymentData.approvalUrl ||
            paymentData.links?.find(link => link.rel === "approve")?.href;

        if (!approvalLink) {
            throw new Error("Ссылка оплаты не получена");
        }

        // 🚀 Redirect to PayPal
        window.location.href = approvalLink;

    } catch (err) {
        console.error(err);
        alert(err.message || "Ошибка оформления заказа");

        button.disabled = false;
        button.innerHTML = "Оплатить через PayPal";
        return;
    }
}

// ========================================
// Empty
// ========================================

function showEmptyCheckout() {
    const checkoutLayout = document.querySelector(".checkout-layout");

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