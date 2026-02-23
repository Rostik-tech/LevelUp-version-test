// ========================================
// Cancel Page Script
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Log that payment was canceled
    logCancelledPayment();
    
    // Check if cart still has items
    checkCartStatus();
});

// Log Cancelled Payment
function logCancelledPayment() {
    const urlParams = new URLSearchParams(window.location.search);
    const reason = urlParams.get('reason') || 'user_cancelled';
    
    // Log to localStorage for analytics
    const cancelLog = {
        timestamp: new Date().toISOString(),
        reason: reason,
        cartItems: window.cart ? window.cart.items.length : 0,
        cartTotal: window.cart ? window.cart.getTotal() : 0
    };
    
    // Store cancel log
    const cancelHistory = JSON.parse(localStorage.getItem('cancelHistory') || '[]');
    cancelHistory.push(cancelLog);
    localStorage.setItem('cancelHistory', JSON.stringify(cancelHistory));
    
    console.log('Payment cancelled:', cancelLog);
}

// Check Cart Status
function checkCartStatus() {
    const cart = window.cart;
    
    if (!cart || cart.items.length === 0) {
        // Cart is empty - show different message
        showEmptyCartMessage();
    } else {
        // Cart has items - show normal cancel message
        updateCartInfo();
    }
}

// Show Empty Cart Message
function showEmptyCartMessage() {
    const infoMessage = document.querySelector('.info-message');
    if (infoMessage) {
        infoMessage.innerHTML = `
            <i class="fas fa-shopping-cart"></i>
            <span data-en="Your cart is empty. Browse our products to start shopping!" data-ru="Ваша корзина пуста. Просмотрите наши товары, чтобы начать покупки!">
                Ваша корзина пуста. Просмотрите наши товары, чтобы начать покупки!
            </span>
        `;
    }
    
    // Hide "Back to Cart" button
    const backToCartBtn = document.querySelector('a[href="cart.html"]');
    if (backToCartBtn) {
        backToCartBtn.style.display = 'none';
    }
    
    // Hide "Try Again" button
    const tryAgainBtn = document.querySelector('a[href="checkout.html"]');
    if (tryAgainBtn) {
        tryAgainBtn.style.display = 'none';
    }
}

// Update Cart Info
function updateCartInfo() {
    const cart = window.cart;
    if (!cart) return;
    
    const itemCount = cart.items.length;
    const totalAmount = cart.getTotal();
    const currency = localStorage.getItem('currency') || 'usd';
    const currencySymbol = currency === 'usd' ? '$' : '€';
    const exchangeRate = currency === 'eur' ? 0.92 : 1;
    
    // Update info message with cart details
    const infoMessage = document.querySelector('.info-message');
    if (infoMessage) {
        const formattedTotal = (totalAmount * exchangeRate).toFixed(2);
        infoMessage.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <span data-en="Your order has not been processed. ${itemCount} items (${currencySymbol}${formattedTotal}) remain in your cart." 
                  data-ru="Ваш заказ не был обработан. ${itemCount} товар(ов) (${currencySymbol}${formattedTotal}) остались в корзине.">
                Ваш заказ не был обработан. ${itemCount} товар(ов) (${currencySymbol}${formattedTotal}) остались в корзине.
            </span>
        `;
    }
}

// Get Cancellation Reason
function getCancellationReason() {
    const urlParams = new URLSearchParams(window.location.search);
    const reason = urlParams.get('reason');
    
    const reasons = {
        'user_cancelled': {
            en: 'You cancelled the payment',
            ru: 'Вы отменили оплату'
        },
        'payment_failed': {
            en: 'Payment failed',
            ru: 'Оплата не прошла'
        },
        'insufficient_funds': {
            en: 'Insufficient funds',
            ru: 'Недостаточно средств'
        },
        'card_declined': {
            en: 'Card was declined',
            ru: 'Карта была отклонена'
        },
        'timeout': {
            en: 'Payment timeout',
            ru: 'Время оплаты истекло'
        }
    };
    
    const currentLang = localStorage.getItem('language') || 'ru';
    
    if (reason && reasons[reason]) {
        return reasons[reason][currentLang];
    }
    
    return currentLang === 'en' ? 'Payment was cancelled' : 'Оплата была отменена';
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
    
    // Re-check cart status to update messages
    checkCartStatus();
});

// Add event listeners to buttons
document.addEventListener('DOMContentLoaded', function() {
    // Track button clicks for analytics
    const tryAgainBtn = document.querySelector('a[href="checkout.html"]');
    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', function() {
            console.log('User clicked: Try Again');
        });
    }
    
    const backToCartBtn = document.querySelector('a[href="cart.html"]');
    if (backToCartBtn) {
        backToCartBtn.addEventListener('click', function() {
            console.log('User clicked: Back to Cart');
        });
    }
    
    const continueShoppingBtn = document.querySelector('a[href="shop.html"]');
    if (continueShoppingBtn) {
        continueShoppingBtn.addEventListener('click', function() {
            console.log('User clicked: Continue Shopping');
        });
    }
});
