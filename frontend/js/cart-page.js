// Cart Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    displayCart();
    updateCartSummary();
    
    document.getElementById('checkoutBtn')?.addEventListener('click', handleCheckout);
});

function displayCart() {
    const cartItemsContainer = document.getElementById('cartItems');
    if (!cartItemsContainer) return;
    
    const cart = window.cart;
    const lang = window.currentLanguage ? window.currentLanguage() : 'ru';
    
    if (!cart || cart.items.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <p class="empty-cart-text" data-en="Your cart is empty" data-ru="Ваша корзина пуста">Ваша корзина пуста</p>
                <a href="shop.html" class="btn btn-primary" data-en="Start Shopping" data-ru="Начать покупки">Начать покупки</a>
            </div>
        `;
        return;
    }
    
    cartItemsContainer.innerHTML = cart.items.map(item => {
        const name = item.name?.[lang] || item.name?.ru || 'Product';
        const price = window.formatPrice ? window.formatPrice(item.price) : `$${item.price}`;
        const total = window.formatPrice ? window.formatPrice(item.price * item.quantity) : `$${(item.price * item.quantity).toFixed(2)}`;
        
        return `
            <div class="cart-item" data-item-id="${item.id}">
                <img src="${item.image}" alt="${name}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/120x120/1a0533/FF00FF?text=Item'">
                <div class="cart-item-details">
                    <h3 class="cart-item-name">${name}</h3>
                    <p class="cart-item-price">${price}</p>
                    <div class="cart-item-actions">
                        <div class="quantity-control">
                            <button class="quantity-btn" onclick="changeQuantity(${item.id}, -1)">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="quantity-value">${item.quantity}</span>
                            <button class="quantity-btn" onclick="changeQuantity(${item.id}, 1)">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <button class="remove-btn" onclick="removeFromCart(${item.id})">
                            <i class="fas fa-trash"></i>
                            <span data-en="Remove" data-ru="Удалить">Удалить</span>
                        </button>
                    </div>
                </div>
                <div class="cart-item-total">
                    <span class="item-total-price">${total}</span>
                </div>
            </div>
        `;
    }).join('');
}

function updateCartSummary() {
    const cart = window.cart;
    if (!cart) return;
    
    const subtotal = cart.getTotal();
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;
    
    const formatPrice = window.formatPrice || ((p) => `$${p.toFixed(2)}`);
    
    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    document.getElementById('tax').textContent = formatPrice(tax);
    document.getElementById('total').textContent = formatPrice(total);
}

function changeQuantity(productId, change) {
    const cart = window.cart;
    if (!cart) return;
    
    const item = cart.items.find(i => i.id === productId);
    if (!item) return;
    
    const newQuantity = item.quantity + change;
    
    if (newQuantity <= 0) {
        removeFromCart(productId);
    } else {
        cart.updateQuantity(productId, newQuantity);
        displayCart();
        updateCartSummary();
    }
}

function removeFromCart(productId) {
    const cart = window.cart;
    if (!cart) return;
    
    if (confirm('Удалить товар из корзины?')) {
        cart.removeItem(productId);
        displayCart();
        updateCartSummary();
    }
}

function handleCheckout() {
    const cart = window.cart;
    if (!cart || cart.items.length === 0) {
        alert('Корзина пуста!');
        return;
    }
    
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn) {
        if (confirm('Вам нужно войти для оформления заказа. Перейти на страницу входа?')) {
            window.location.href = 'login.html';
        }
        return;
    }
    
    // Redirect to checkout page
    window.location.href = 'checkout.html';
}

// Export functions for global use
window.changeQuantity = changeQuantity;
window.removeFromCart = removeFromCart;