import { getToken } from "./auth.js";

const API_BASE = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", () => {
    const token = getToken();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const paypalToken = urlParams.get("token");

    // 🔥 Если вернулись с PayPal — сразу capture
    if (paypalToken) {
        handleCapture(paypalToken);
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


// ================================
// Render order summary
// ================================
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

            return `
                <div class="summary-item">
                    <div class="summary-item-name">
                        ${name}
                    </div>
                    <div>
                        ${item.quantity} × $${item.price.toFixed(2)}
                    </div>
                </div>
            `;
        })
        .join("");
}


// ================================
// Totals calculation
// ================================
function updateOrderTotals() {
    const cart = window.cart;
    if (!cart) return;

    const subtotal = cart.getTotal();
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

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


// ================================
// Submit checkout
// ================================
async function handleCheckout(e) {
    e.preventDefault();

    const cart = window.cart;
    const token = getToken();
    const button = document.getElementById("paypalButton");

    if (!cart || cart.items.length === 0) {
        alert("Корзина пуста");
        return;
    }

    // 🔥 Disable кнопки во время запроса
    button.disabled = true;
    button.innerHTML = "Обработка...";

    const shippingData = {
        shippingFullName: document.getElementById("fullName").value,
        shippingPhone: document.getElementById("phone").value,
        shippingCountry: document.getElementById("country").value,
        shippingCity: document.getElementById("city").value,
        shippingAddress: document.getElementById("address").value,
        shippingPostalCode: document.getElementById("postalCode").value,
        shippingApartment: document.getElementById("apartment").value,
        orderNotes: document.getElementById("orderNotes").value
    };

    try {
        // 1️⃣ Create Order
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
            button.disabled = false;
            button.innerHTML = "Оплатить через PayPal";
            alert(orderData.message || "Ошибка создания заказа");
            return;
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
            button.disabled = false;
            button.innerHTML = "Оплатить через PayPal";
            alert(
                paymentData.message ||
                "Ошибка создания PayPal заказа"
            );
            return;
        }

        const approvalLink = paymentData.links.find(
            (link) => link.rel === "approve"
        )?.href;

        if (!approvalLink) {
            button.disabled = false;
            button.innerHTML = "Оплатить через PayPal";
            alert("Не удалось получить ссылку оплаты");
            return;
        }

        localStorage.setItem("currentOrderId", orderId);

        window.location.href = approvalLink;

    } catch (err) {
        console.error(err);
        button.disabled = false;
        button.innerHTML = "Оплатить через PayPal";
        alert("Ошибка соединения с сервером");
    }
}


// ================================
// Capture after PayPal return
// ================================
async function handleCapture(paypalOrderId) {
    const token = getToken();

    try {
        const response = await fetch(
            `${API_BASE}/payments/capture/${paypalOrderId}`,
            {
                method: "POST",
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Ошибка подтверждения оплаты");
            return;
        }

        if (window.cart) {
            window.cart.clear();
        }

        localStorage.removeItem("currentOrderId");

        // 🔥 Убираем token из URL
        window.history.replaceState({}, document.title, "checkout.html");

        window.location.href = "success.html";

    } catch (err) {
        console.error(err);
        alert("Ошибка подтверждения оплаты");
    }
}


// ================================
// Empty state
// ================================
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