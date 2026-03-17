// ========================================
// Cancel Page Script
// ========================================

function getCartItems() {
    return JSON.parse(localStorage.getItem("cartItems") || "[]");
}

// Log Cancelled Payment
function logCancelledPayment() {
    const urlParams = new URLSearchParams(window.location.search);
    const reason = urlParams.get('reason') || 'user_cancelled';
    
    // Log to localStorage for analytics
    const cartItems = getCartItems();

const cancelLog = {
    timestamp: new Date().toISOString(),
    reason: reason,
    cartItems: cartItems.reduce((sum, item) => {
    return sum + Number(item.quantity);
}, 0),
    cartTotal: cartItems.reduce((sum, item) => {
        return sum + (Number(item.price) * Number(item.quantity));
    }, 0)
};
    
    // Store cancel log
    let cancelHistory;

try {
    cancelHistory = JSON.parse(localStorage.getItem('cancelHistory')) || [];
} catch {
    cancelHistory = [];
}
    cancelHistory.push(cancelLog);
    localStorage.setItem('cancelHistory', JSON.stringify(cancelHistory));
    
    console.log('Payment cancelled:', cancelLog);
}

// Check Cart Status
function checkCartStatus() {
    const cartItems = getCartItems();

    if (!cartItems.length) {
        showEmptyCartMessage();
    } else {
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
    const cartItems = getCartItems();

    if (!cartItems.length) return;

    const itemCount = cartItems.reduce((sum, item) => {
    return sum + Number(item.quantity);
}, 0);

    const totalAmount = cartItems.reduce((sum, item) => {
        return sum + (Number(item.price) * Number(item.quantity));
    }, 0);

    const infoMessage = document.querySelector('.info-message');

    if (infoMessage) {
        const formattedTotal = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR"
}).format(totalAmount);

const itemText = itemCount === 1 ? "item" : "items";

        infoMessage.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <span data-en="Your order has not been processed. ${itemCount} ${itemText} (${formattedTotal}) remain in your cart." 
                  data-ru="Ваш заказ не был обработан. ${itemCount} товар(ов) (${formattedTotal}) остались в корзине.">
                Ваш заказ не был обработан. ${itemCount} товар(ов) (${formattedTotal}) остались в корзине.
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
    logCancelledPayment();
    checkCartStatus();

    // Track buttons
    const tryAgainBtn = document.querySelector('a[href="checkout.html"]');
    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', () => {
            console.log('User clicked: Try Again');
        });
    }

    const backToCartBtn = document.querySelector('a[href="cart.html"]');
    if (backToCartBtn) {
        backToCartBtn.addEventListener('click', () => {
            console.log('User clicked: Back to Cart');
        });
    }

    const continueShoppingBtn = document.querySelector('a[href="shop.html"]');
    if (continueShoppingBtn) {
        continueShoppingBtn.addEventListener('click', () => {
            console.log('User clicked: Continue Shopping');
        });
    }
});