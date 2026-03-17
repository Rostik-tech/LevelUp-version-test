// ========================================
// Cart Page - Clean UI + JWT + i18n (FIXED CURRENCY)
// ========================================

function formatPriceSafe(value) {
    if (window.formatPrice) {
        return window.formatPrice(value);
    }

    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR"
    }).format(value);
}

function getCartItems() {
    try {
        const raw = localStorage.getItem("cartItems");

        // 🔥 если ключ вообще существует → используем ТОЛЬКО его
        if (raw !== null) {
            const data = JSON.parse(raw);
            return Array.isArray(data) ? data : [];
        }

        // 🔥 fallback ТОЛЬКО если localStorage вообще нет
        if (window.cart && Array.isArray(window.cart.items)) {
            return window.cart.items;
        }

        if (Array.isArray(window.cart)) {
            return window.cart;
        }

        return [];

    } catch (e) {
        console.error("Cart parse error:", e);
        return [];
    }
}

function saveCartItems(items) {
    localStorage.setItem("cartItems", JSON.stringify(items));
}

document.addEventListener("DOMContentLoaded", async function () {
    await displayCart();

    document
        .getElementById("checkoutBtn")
        ?.addEventListener("click", handleCheckout);
});

async function displayCart() {
    const container = document.getElementById("cartItems");
    if (!container) return;

    const cartItems = getCartItems();
    
    const lang = window.currentLanguage ? window.currentLanguage() : "ru";

    if (!cartItems.length) {
        container.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <p 
                    class="empty-cart-text"
                    data-en="Your cart is empty"
                    data-ru="Ваша корзина пуста">
                    Ваша корзина пуста
                </p>
                <a 
                    href="shop.html"
                    class="btn btn-primary"
                    data-en="Start Shopping"
                    data-ru="Начать покупки">
                    Начать покупки
                </a>
            </div>
        `;
        triggerLanguageUpdate();
        return;
    }
// получаем все id товаров
const ids = cartItems.map(i => i.id).join(",");

// запрашиваем цены из backend
let products = [];

try {
    const response = await fetch(`http://localhost:5000/api/products`);

if (!response.ok) {
    throw new Error("API error");
}

const data = await response.json();
products = Array.isArray(data) ? data : [];

} catch (e) {
    console.error("Failed to load products:", e);
}
    window.cartProducts = products;
    container.innerHTML = cartItems.map(item => {

        const name = item.name || "Product";
        const product = products.find(p => String(p.id) === String(item.id));
        const price = product && product.price != null
    ? Number(product.price)
    : Number(item.price || 0);

        // 🔥 КОНВЕРТАЦИЯ + ФОРМАТ
        const formattedPrice = window.formatPriceSafe(Number(price));

const total = Number(price) * Number(item.quantity);
const formattedTotal = window.formatPriceSafe(total);

        return `
            <div class="cart-item">

                <img 
                    src="${item.image || 'https://via.placeholder.com/120x120/1a0533/FF00FF?text=Item'}"
                    class="cart-item-image"
                >

                <div class="cart-item-details">
                    <h3 class="cart-item-name">${name}</h3>

                        ${item.size ? `
                    <p class="cart-item-size">
                        Size: ${item.size}
                    </p>
                    ` : ""}

                    <p class="cart-item-price">${formattedPrice}</p>

                    <div class="quantity-control">

                       <button 
    class="qty-btn"
    onclick="changeQuantity(${item.id}, '${item.size}', -1)">
    <i class="fa-solid fa-minus"></i>
</button>

                        <span class="quantity-value">
                            ${item.quantity}
                        </span>

                        <button 
    class="qty-btn"
    onclick="changeQuantity(${item.id}, '${item.size}', 1)">
    <i class="fa-solid fa-plus"></i>
</button>

                    </div>

                    <button 
                        class="btn btn-outline remove-btn"
                        onclick="removeFromCart(${item.id}, '${item.size}')"
                        data-en="Remove"
                        data-ru="Удалить">
                        <i class="fas fa-trash"></i>
                        Удалить
                    </button>

                </div>

                <div class="cart-item-total">
                    ${formattedTotal}
                </div>

            </div>
        `;
    }).join("");

    triggerLanguageUpdate();
    updateCartSummary();
}

function updateCartSummary() {

    const cartItems = getCartItems();
const products = window.cartProducts || [];

if (!cartItems.length) return;

let subtotal = 0;

cartItems.forEach(item => {

        const product = products.find(p => String(p.id) === String(item.id));
        const price = product ? product.price : item.price;

        subtotal += Number(price) * Number(item.quantity);

    });

    const subtotalEl = document.getElementById("subtotal");
if (subtotalEl) {
    subtotalEl.textContent = window.formatPriceSafe(subtotal);
}

const totalEl = document.getElementById("total");
if (totalEl) {
    totalEl.textContent = window.formatPriceSafe(subtotal);
}

    const taxEl = document.getElementById("tax");
    if (taxEl) taxEl.textContent = window.formatPriceSafe(0);

}

function changeQuantity(productId, size, change) {
    const cartItems = getCartItems();
    if (!cartItems.length) return;

   const item = cartItems.find(
    i => i.id === productId && i.size === size
);

if (!item) return;

const newQuantity = Number(item.quantity) + change;

    if (newQuantity <= 0) {
    removeFromCart(productId, size);
}   else {
        item.quantity = newQuantity;
        saveCartItems(cartItems);
        displayCart();
        updateCartSummary();
    }
}

function removeFromCart(productId, size) {
    const cartItems = getCartItems();
    if (!cartItems.length) return;

    const confirmText = window.currentLanguage && window.currentLanguage() === "en"
        ? "Remove item from cart?"
        : "Удалить товар из корзины?";

    if (confirm(confirmText)) {
        const updatedCart = cartItems.filter(
    i => !(i.id === productId && i.size === size)
);

saveCartItems(updatedCart);
        displayCart();
        updateCartSummary();
    }
}

function handleCheckout() {
    const cartItems = getCartItems();

    if (!cartItems.length) {
        alert(
            window.currentLanguage && window.currentLanguage() === "en"
                ? "Cart is empty!"
                : "Корзина пуста!"
        );
        return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
        if (confirm("You need to login to proceed. Go to login page?")) {
            window.location.href = "login.html";
        }
        return;
    }

    window.location.href = "checkout.html";
}

function triggerLanguageUpdate() {
    if (window.updatePageLanguage) {
        window.updatePageLanguage();
    }
}
window.formatPriceSafe = formatPriceSafe;
window.changeQuantity = changeQuantity;
window.removeFromCart = removeFromCart;
window.displayCart = displayCart;
window.updateCartSummary = updateCartSummary;