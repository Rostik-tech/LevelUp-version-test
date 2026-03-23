// orders.js
import { getToken } from "./auth.js";

const API_BASE = "https://www.levelup-gaming.store/api";

let currentOrders = [];

document.addEventListener("DOMContentLoaded", async () => {
    const token = getToken();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    await loadOrders();
});

// 🔥 РЕРЕНДЕР ПРИ СМЕНЕ ЯЗЫКА
document.addEventListener("languageChanged", () => {
    const container = document.getElementById("ordersList");
    if (!container || !currentOrders.length) return;

    renderOrders(container, currentOrders);
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

        currentOrders = orders; // 🔥 сохраняем
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
    const lang = window.currentLanguage ? window.currentLanguage() : "en";

    const localeMap = {
        en: "en-US",
        ru: "ru-RU",
        bg: "bg-BG"
    };

    container.innerHTML = orders.map(order => {

        const date = new Date(order.createdAt).toLocaleDateString(localeMap[lang]);

        const itemsHTML = order.OrderItems.map(item => `
            <div class="order-item">
                <span>${item.Product?.name_en || "Product"} x${item.quantity}</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join("");

        return `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <div class="order-id" data-en="Order" data-ru="Заказ" data-bg="Поръчка">Order #${order.id}</div>
                        <div class="order-date">${date}</div>
                    </div>
                    <div class="order-status ${order.status}">
                        ${formatStatus(order.status, lang)}
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

    // 🔥 чтобы data-en/data-ru обновились тоже
    if (window.updatePageLanguage) {
        window.updatePageLanguage();
    }
}

function formatStatus(status, lang) {
    const map = {
        PENDING: {
            en: "Pending",
            ru: "Ожидает оплаты",
            bg: "Изчаква плащане"
        },
        PAID: {
            en: "Paid",
            ru: "Оплачен",
            bg: "Платено"
        },
        PROCESSING: {
            en: "Processing",
            ru: "В обработке",
            bg: "В обработка"
        },
        SHIPPED: {
            en: "Shipped",
            ru: "Отправлен",
            bg: "Изпратен"
        },
        DELIVERED: {
            en: "Delivered",
            ru: "Доставлен",
            bg: "Доставен"
        },
        CANCELLED: {
            en: "Cancelled",
            ru: "Отменён",
            bg: "Отменен"
        }
    };

    return map[status]?.[lang] || status;
}