// ========================================
// Success Page Script
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Get order details from URL parameters or last order
    loadOrderDetails();
});

// Load Order Details
function loadOrderDetails() {
    // Try to get order ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderIdParam = urlParams.get('orderId');

    let order = null;

    if (orderIdParam) {
        // Load specific order from localStorage
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        // Try to match as both string and number
        order = orders.find(o => o.id == orderIdParam || o.id === orderIdParam);
    } else {
        // Load last order
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        if (orders.length > 0) {
            order = orders[orders.length - 1];
        }
    }

    if (order) {
        displayOrderDetails(order);
    } else {
        // Show demo order for testing purposes (when no order exists)
        const demoOrder = {
            id: Date.now().toString(),
            total: 299.99,
            paymentMethod: 'PayPal'
        };
        displayOrderDetails(demoOrder);
    }
}

// Display Order Details
function displayOrderDetails(order) {
    // Get currency
    const currency = localStorage.getItem('currency') || 'usd';
    const currencySymbol = currency === 'usd' ? '$' : '€';
    const exchangeRate = currency === 'eur' ? 0.92 : 1;

    // Format order number (handle both string and number IDs)
    const orderIdString = String(order.id);
    const orderNumber = `#ORD-${orderIdString.substring(0, 8).toUpperCase()}`;
    document.querySelector('.order-number').textContent = orderNumber;

    // Format total amount
    const totalAmount = (order.total * exchangeRate).toFixed(2);
    document.querySelector('.total-amount').textContent = `${currencySymbol}${totalAmount}`;

    // Payment method
    const paymentMethod = order.paymentMethod || 'PayPal';
    document.querySelector('.payment-method').textContent = paymentMethod;
}

// Display No Order Found
function displayNoOrder() {
    const orderDetailsDiv = document.querySelector('.order-details');
    orderDetailsDiv.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-gray);">
            <i class="fas fa-exclamation-circle" style="font-size: 48px; color: var(--primary-pink); margin-bottom: 15px;"></i>
            <p data-en="No order found" data-ru="Заказ не найден">Заказ не найден</p>
            <p data-en="Please check your orders page" data-ru="Пожалуйста, проверьте страницу заказов" style="font-size: 14px;">Пожалуйста, проверьте страницу заказов</p>
        </div>
    `;
}

// Format Currency
function formatCurrency(amount) {
    const currency = localStorage.getItem('currency') || 'usd';
    const currencySymbol = currency === 'usd' ? '$' : '€';
    const exchangeRate = currency === 'eur' ? 0.92 : 1;
    
    return `${currencySymbol}${(amount * exchangeRate).toFixed(2)}`;
}

// Update page language when loaded
document.addEventListener('languageChanged', function() {
    // Re-apply translations after language switch
    const currentLang = localStorage.getItem('language') || 'ru';
    
    // Update all elements with data-en and data-ru attributes
    document.querySelectorAll('[data-en][data-ru]').forEach(element => {
        const translation = element.getAttribute(`data-${currentLang}`);
        if (translation) {
            // Only update text content, preserve child elements
            if (element.children.length === 0) {
                element.textContent = translation;
            } else {
                // For elements with children, update only text nodes
                const firstTextNode = Array.from(element.childNodes).find(node => node.nodeType === 3);
                if (firstTextNode) {
                    firstTextNode.textContent = translation;
                }
            }
        }
    });
});
