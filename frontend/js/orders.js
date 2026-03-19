//  orders.js
import { getToken } from "./auth.js";

const API_BASE = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", async () => {
    const token = getToken();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    await loadOrders();
});

async function loadOrders() {
    const ordersList = document.getElementById("ordersList");
    if (!ordersList) return;

    try {
        const response = await fetch(`${API_BASE}/orders/my`, {
            headers: {
                "Authorization": "Bearer " + getToken()
            }
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        const orders = await response.json();

        if (!orders || orders.length === 0) {
            renderEmpty(ordersList);
            return;
        }

        renderOrders(ordersList, orders);

    } catch (err) {
        console.error(err);
        ordersList.innerHTML = `<p>Ошибка загрузки заказов</p>`;
    }
}

function renderEmpty(container) {
    container.innerHTML = `
        <div class="empty-cart">
            <div class="empty-cart-icon"><i class="fas fa-box-open"></i></div>
            <p class="empty-cart-text">У вас пока нет заказов</p>
            <a href="shop.html" class="btn btn-primary">Начать покупки</a>
        </div>
    `;
}

function renderOrders(container, orders) {
    container.innerHTML = orders.map(order => {
        const date = new Date(order.createdAt).toLocaleDateString("ru-RU");

        const itemsHTML = order.OrderItems.map(item => `
            <div class="order-item">
                <span>${item.Product?.name?.ru || "Product"} x${item.quantity}</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join("");

        return `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <div class="order-id" data-en="Order" data-ru="Заказ" data-bg="Поръчки">Order #${order.id}</div>
                        <div class="order-date">${date}</div>
                    </div>
                    <div class="order-status ${order.status}">
                        ${formatStatus(order.status)}
                    </div>
                </div>
                <div class="order-items">${itemsHTML}</div>
                <div class="order-footer">
                    <span data-en="Total" data-ru="Итого" data-bg="Общо">Total:</span>
                    <span class="order-total">$${Number(order.totalPrice).toFixed(2)}</span>
                </div>
            </div>
        `;
    }).join("");
}

function formatStatus(status) {
    switch (status) {
        case "PENDING":
            return "Ожидает оплаты";
        case "PAID":
            return "Оплачен";
        case "PROCESSING":
            return "В обработке";
        case "SHIPPED":
            return "Отправлен";
        case "DELIVERED":
            return "Доставлен";
        case "CANCELLED":
            return "Отменён";
        default:
            return status;
    }
}