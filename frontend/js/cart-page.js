// ========================================
// Cart Page - Clean UI + JWT + i18n (FIXED CURRENCY)
// ========================================


document.addEventListener("DOMContentLoaded", async function () {
    await displayCart();

    document
        .getElementById("checkoutBtn")
        ?.addEventListener("click", handleCheckout);
});

async function displayCart() {
    const container = document.getElementById("cartItems");
    if (!container) return;

    const cart = window.cart;
    

    if (!cart || cart.items.length === 0) {
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
const ids = cart.items.map(i => i.id).filter(Boolean).join(",");

if (!ids) {
    console.warn("No product IDs found");
    return;
}

// запрашиваем цены из backend

const response = await fetch(`/api/products?ids=${ids}`);
if (!response.ok) {
    throw new Error("Failed to load cart products");
}

const products = await response.json();
    window.cartProducts = products;
    container.innerHTML = cart.items.map(item => {

        const name = item.name || "Product";
        const product = products.find(p => p.id === item.id);
        const price = product ? product.price : item.price;

        // 🔥 ФОРМАТ
        const formattedPrice = window.formatPrice(Number(price));

const total = Number(price) * Number(item.quantity);
const formattedTotal = window.formatPrice(total);

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

    const cart = window.cart;
    const products = window.cartProducts || [];

    if (!cart) return;

    let subtotal = 0;

    cart.items.forEach(item => {

        const product = products.find(p => p.id === item.id);
        const price = product ? product.price : item.price;

        subtotal += Number(price) * Number(item.quantity);

    });

    document.getElementById("subtotal").textContent =
        window.formatPrice(subtotal);

    document.getElementById("total").textContent =
        window.formatPrice(subtotal);

    const taxEl = document.getElementById("tax");
    if (taxEl) taxEl.textContent = window.formatPrice(0);

}

function changeQuantity(productId, size, change) {
    const cart = window.cart;
    if (!cart) return;

    const item = cart.items.find(
    i => i.id === productId && i.size === size
    );
    if (!item) return;

    const newQuantity = item.quantity + change;

    if (newQuantity <= 0) {
    removeFromCart(productId, size);

    } else {
        item.quantity = newQuantity;
        cart.saveCart();
        cart.updateCartCount();
        displayCart();
        updateCartSummary();
    }
}

function removeFromCart(productId, size) {
    const cart = window.cart;
    if (!cart) return;

    const confirmText = window.currentLanguage && window.currentLanguage() === "en"
        ? "Remove item from cart?"
        : "Удалить товар из корзины?";

    if (confirm(confirmText)) {
        cart.items = cart.items.filter(
        i => !(i.id === productId && i.size === size)
        );
        cart.saveCart();
        cart.updateCartCount();
        displayCart();
        updateCartSummary();
    }
}

function handleCheckout() {
    const cart = window.cart;

    if (!cart || cart.items.length === 0) {
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

    // 🔥 ДОБАВЬ ЭТО
    const products = window.cartProducts || [];

    let items = cart.items.map(item => {
        const product = products.find(p => p.id === item.id);
        const price = product ? Number(product.price) : Number(item.price);

        return {
            ...item,
            price: Number(price) // уже в нужной валюте
        };
    });

    let total = 0;
    items.forEach(i => {
        total += i.price * i.quantity;
    });

    const checkoutData = {
        items,
        total,
        
    };

    localStorage.setItem("checkoutData", JSON.stringify(checkoutData));

    // 👉 переход
    window.location.href = "checkout.html";
}

function triggerLanguageUpdate() {
    if (window.updatePageLanguage) {
        window.updatePageLanguage();
    }
}

window.changeQuantity = changeQuantity;
window.removeFromCart = removeFromCart;
window.displayCart = displayCart;
window.updateCartSummary = updateCartSummary;