// Checkout Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
        if (confirm('Вам нужно войти для оформления заказа. Перейти на страницу входа?')) {
            window.location.href = 'login.html';
        } else {
            window.location.href = 'cart.html';
        }
        return;
    }
    
    // Check if cart is empty
    const cart = window.cart;
    if (!cart || cart.items.length === 0) {
        showEmptyCheckout();
        return;
    }
    
    // Load order summary
    displayOrderSummary();
    updateOrderTotals();
    
    // Pre-fill user data if available
    prefillUserData();
    
    // Handle form submission
    document.getElementById('checkoutForm').addEventListener('submit', handleCheckout);
});

function displayOrderSummary() {
    const summaryItems = document.getElementById('summaryItems');
    if (!summaryItems) return;
    
    const cart = window.cart;
    const lang = window.currentLanguage ? window.currentLanguage() : 'ru';
    
    summaryItems.innerHTML = cart.items.map(item => {
        const name = item.name?.[lang] || item.name?.ru || 'Product';
        const price = window.formatPrice ? window.formatPrice(item.price) : `$${item.price.toFixed(2)}`;
        const totalPrice = window.formatPrice ? window.formatPrice(item.price * item.quantity) : `$${(item.price * item.quantity).toFixed(2)}`;
        
        return `
            <div class="summary-item">
                <img src="${item.image}" alt="${name}" class="summary-item-image" onerror="this.src='https://via.placeholder.com/60x60/1a0533/FF00FF?text=Item'">
                <div class="summary-item-details">
                    <div class="summary-item-name">${name}</div>
                    <div class="summary-item-quantity">
                        <span data-en="Quantity" data-ru="Количество">Количество</span>: ${item.quantity} × ${price}
                    </div>
                </div>
                <div class="summary-item-price">${totalPrice}</div>
            </div>
        `;
    }).join('');
}

function updateOrderTotals() {
    const cart = window.cart;
    if (!cart) return;
    
    const subtotal = cart.getTotal();
    const tax = subtotal * 0.1; // 10% tax
    const shipping = 0; // Free shipping
    const total = subtotal + tax + shipping;
    
    const formatPrice = window.formatPrice || ((p) => `$${p.toFixed(2)}`);
    
    document.getElementById('subtotalAmount').textContent = formatPrice(subtotal);
    document.getElementById('taxAmount').textContent = formatPrice(tax);
    document.getElementById('totalAmount').textContent = formatPrice(total);
}

function prefillUserData() {
    const user = window.getCurrentUser ? window.getCurrentUser() : null;
    
    if (user) {
        const fullNameInput = document.getElementById('fullName');
        if (fullNameInput && user.fullName) {
            fullNameInput.value = user.fullName;
        }
    }
}

function handleCheckout(e) {
    e.preventDefault();
    
    const cart = window.cart;
    if (!cart || cart.items.length === 0) {
        alert('Корзина пуста!');
        window.location.href = 'cart.html';
        return;
    }
    
    // Collect form data
    const formData = {
        fullName: document.getElementById('fullName').value,
        phone: document.getElementById('phone').value,
        country: document.getElementById('country').value,
        city: document.getElementById('city').value,
        address: document.getElementById('address').value,
        postalCode: document.getElementById('postalCode').value,
        apartment: document.getElementById('apartment').value,
        orderNotes: document.getElementById('orderNotes').value
    };
    
    // Validate form data
    if (!formData.fullName || !formData.phone || !formData.country || 
        !formData.city || !formData.address || !formData.postalCode) {
        alert('Пожалуйста, заполните все обязательные поля!');
        return;
    }
    
    // Create order
    const order = {
        id: Date.now(),
        items: cart.items,
        subtotal: cart.getTotal(),
        tax: cart.getTotal() * 0.1,
        shipping: 0,
        total: cart.getTotal() + (cart.getTotal() * 0.1),
        shippingInfo: formData,
        date: new Date().toISOString(),
        status: 'pending',
        paymentMethod: 'PayPal'
    };
    
    // Save order to localStorage
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Clear cart
    cart.clearCart();
    
    // Show success message
    alert(`Заказ #${order.id} успешно оформлен!\n\nПеренаправление на PayPal для оплаты...\n\n(В реальном приложении здесь будет интеграция с PayPal API)`);
    
    // Redirect to orders page
    setTimeout(() => {
        window.location.href = 'orders.html';
    }, 2000);
}

function showEmptyCheckout() {
    const checkoutLayout = document.querySelector('.checkout-layout');
    if (checkoutLayout) {
        checkoutLayout.innerHTML = `
            <div class="empty-checkout" style="grid-column: 1 / -1;">
                <div class="empty-checkout-icon">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <p class="empty-checkout-text" data-en="Your cart is empty" data-ru="Ваша корзина пуста">Ваша корзина пуста</p>
                <a href="shop.html" class="btn btn-primary" data-en="Start Shopping" data-ru="Начать покупки">Начать покупки</a>
            </div>
        `;
    }
}

// Phone number formatting
document.getElementById('phone')?.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length > 0) {
        if (value.startsWith('7') || value.startsWith('8')) {
            // Russian format: +7 (999) 123-45-67
            if (value.startsWith('8')) {
                value = '7' + value.substring(1);
            }
            
            let formatted = '+7';
            if (value.length > 1) {
                formatted += ' (' + value.substring(1, 4);
            }
            if (value.length >= 5) {
                formatted += ') ' + value.substring(4, 7);
            }
            if (value.length >= 8) {
                formatted += '-' + value.substring(7, 9);
            }
            if (value.length >= 10) {
                formatted += '-' + value.substring(9, 11);
            }
            
            e.target.value = formatted;
        } else {
            e.target.value = '+' + value;
        }
    }
});

// Postal code validation (only numbers)
document.getElementById('postalCode')?.addEventListener('input', function(e) {
    e.target.value = e.target.value.replace(/\D/g, '');
});