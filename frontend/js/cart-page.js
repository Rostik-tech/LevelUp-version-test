// ========================================
// Cart Page - JWT Version + i18n Support
// ========================================

document.addEventListener("DOMContentLoaded", function () {
    displayCart();
    updateCartSummary();

    document
        .getElementById("checkoutBtn")
        ?.addEventListener("click", handleCheckout);
});

function displayCart() {
    const cartItemsContainer = document.getElementById("cartItems");
    if (!cartItemsContainer) return;

    const cart = window.cart;
    const lang = window.currentLanguage ? window.currentLanguage() : "ru";

    if (!cart || cart.items.length === 0) {
        cartItemsContainer.innerHTML = `
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

    cartItemsContainer.innerHTML = cart.items
        .map((item) => {
            const name =
                item.name?.[lang] || item.name?.ru || "Product";

            const price = window.formatPrice
                ? window.formatPrice(item.price)
                : `$${item.price}`;

            const total = window.formatPrice
                ? window.formatPrice(item.price * item.quantity)
                : `$${(item.price * item.quantity).toFixed(2)}`;

            return `
                <div class="cart-item" data-item-id="${item.id}">
                    <img src="${item.image}" alt="${name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h3>${name}</h3>
                        <p>${price}</p>

                        <div class="quantity-control">
                            <button onclick="changeQuantity(${item.id}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="changeQuantity(${item.id}, 1)">+</button>
                        </div>

                        <button 
                            onclick="removeFromCart(${item.id})"
                            data-en="Remove"
                            data-ru="Удалить">
                            Удалить
                        </button>
                    </div>

                    <div class="cart-item-total">
                        ${total}
                    </div>
                </div>
            `;
        })
        .join("");

    triggerLanguageUpdate();
}

function updateCartSummary() {
    const cart = window.cart;
    if (!cart) return;

    const subtotal = cart.getTotal();
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    const formatPrice =
        window.formatPrice || ((p) => `$${p.toFixed(2)}`);

    document.getElementById("subtotal").textContent =
        formatPrice(subtotal);

    document.getElementById("tax").textContent =
        formatPrice(tax);

    document.getElementById("total").textContent =
        formatPrice(total);
}

function changeQuantity(productId, change) {
    const cart = window.cart;
    if (!cart) return;

    const item = cart.items.find((i) => i.id === productId);
    if (!item) return;

    const newQuantity = item.quantity + change;

    if (newQuantity <= 0) {
        removeFromCart(productId);
    } else {
        item.quantity = newQuantity;
        cart.saveCart();
        cart.updateCartCount();
        displayCart();
        updateCartSummary();
    }
}

function removeFromCart(productId) {
    const cart = window.cart;
    if (!cart) return;

    if (confirm("Удалить товар из корзины?")) {
        cart.items = cart.items.filter((i) => i.id !== productId);
        cart.saveCart();
        cart.updateCartCount();
        displayCart();
        updateCartSummary();
    }
}

function handleCheckout() {
    const cart = window.cart;

    if (!cart || cart.items.length === 0) {
        alert("Корзина пуста!");
        return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
        if (
            confirm(
                "You need to login to proceed. Go to login page?"
            )
        ) {
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

window.changeQuantity = changeQuantity;
window.removeFromCart = removeFromCart;