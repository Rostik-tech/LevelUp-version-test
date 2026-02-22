// ========================================
// Level Up Gaming - Main JavaScript
// ========================================

// Language and Currency State
let currentLanguage = localStorage.getItem('language') || 'ru';
let currentCurrency = localStorage.getItem('currency') || 'usd';
let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

// Currency exchange rates (USD as base)
const exchangeRates = {
    usd: 1,
    eur: 0.92
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    initLanguage();
    initCurrency();
    initAuth();
    initMobileMenu();
    initDropdowns();
    initStarsBackground();
});

// ===== Language Switching =====
function initLanguage() {
    const langBtn = document.getElementById('langBtn');
    const langMenu = document.getElementById('langMenu');
    const langOptions = document.querySelectorAll('.language-switcher .switcher-option');
    
    // Update display
    document.getElementById('currentLang').textContent = currentLanguage.toUpperCase();
    updatePageLanguage();
    
    // Toggle menu
    if (langBtn) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langMenu.classList.toggle('active');
            document.querySelector('.language-switcher').classList.toggle('active');
        });
    }
    
    // Language selection
    langOptions.forEach(option => {
        option.addEventListener('click', () => {
            const lang = option.dataset.lang;
            if (lang !== currentLanguage) {
                currentLanguage = lang;
                localStorage.setItem('language', lang);
                document.getElementById('currentLang').textContent = lang.toUpperCase();
                updatePageLanguage();
            }
            document.querySelector('.language-switcher').classList.remove('active');
        });
    });
    
    // Close menu on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.language-switcher')) {
            document.querySelector('.language-switcher')?.classList.remove('active');
        }
    });
}

function updatePageLanguage() {
    const elements = document.querySelectorAll('[data-en][data-ru]');
    elements.forEach(element => {
        const text = element.getAttribute(`data-${currentLanguage}`);
        if (text) {
            // Simply update text content
            element.textContent = text;
        }
    });
}

// ===== Currency Switching =====
function initCurrency() {
    const currencyBtn = document.getElementById('currencyBtn');
    const currencyMenu = document.getElementById('currencyMenu');
    const currencyOptions = document.querySelectorAll('.currency-switcher .switcher-option');
    
    // Update display
    document.getElementById('currentCurrency').textContent = currentCurrency.toUpperCase();
    updatePagePrices();
    
    // Toggle menu
    if (currencyBtn) {
        currencyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currencyMenu.classList.toggle('active');
            document.querySelector('.currency-switcher').classList.toggle('active');
        });
    }
    
    // Currency selection
    currencyOptions.forEach(option => {
        option.addEventListener('click', () => {
            const currency = option.dataset.currency;
            if (currency !== currentCurrency) {
                currentCurrency = currency;
                localStorage.setItem('currency', currency);
                document.getElementById('currentCurrency').textContent = currency.toUpperCase();
                updatePagePrices();
            }
            document.querySelector('.currency-switcher').classList.remove('active');
        });
    });
    
    // Close menu on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.currency-switcher')) {
            document.querySelector('.currency-switcher')?.classList.remove('active');
        }
    });
}

function updatePagePrices() {
    const priceElements = document.querySelectorAll('.product-price, .price, [data-price]');
    priceElements.forEach(element => {
        const basePrice = parseFloat(element.dataset.basePrice || element.textContent.replace(/[^0-9.]/g, ''));
        if (!element.dataset.basePrice) {
            element.dataset.basePrice = basePrice;
        }
        const convertedPrice = convertPrice(basePrice);
        element.textContent = formatPrice(convertedPrice);
    });
}

function convertPrice(priceInUSD) {
    return priceInUSD * exchangeRates[currentCurrency];
}

function formatPrice(price) {
    const symbol = currentCurrency === 'usd' ? '$' : '€';
    return `${symbol}${price.toFixed(2)}`;
}

// ===== Authentication =====
function initAuth() {
    const authButtons = document.getElementById('authButtons');
    const profileDropdown = document.getElementById('profileDropdown');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Update UI based on login state
    if (isLoggedIn) {
        if (authButtons) authButtons.style.display = 'none';
        if (profileDropdown) profileDropdown.style.display = 'block';
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (profileDropdown) profileDropdown.style.display = 'none';
    }
    
    // Logout handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

function login(userData) {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('user', JSON.stringify(userData));
    isLoggedIn = true;
    window.location.href = 'index.html';
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    isLoggedIn = false;
    window.location.href = 'index.html';
}

function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// ===== Mobile Menu =====
function initMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            });
        });
    }
}

// ===== Dropdowns =====
function initDropdowns() {
    const profileBtn = document.getElementById('profileBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const profileDropdown = document.getElementById('profileDropdown');
    
    if (profileBtn && dropdownMenu) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.profile-dropdown')) {
                profileDropdown?.classList.remove('active');
            }
        });
    }
}

// ===== Animated Stars Background =====
function initStarsBackground() {
    const starsBackground = document.getElementById('starsBackground');
    if (!starsBackground) return;
    
    // Create floating particles
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random properties
        const size = Math.random() * 3 + 1;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 5;
        
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${Math.random() > 0.5 ? '#FF00FF' : '#00F0FF'};
            border-radius: 50%;
            left: ${x}%;
            top: ${y}%;
            opacity: ${Math.random() * 0.5 + 0.3};
            animation: float ${duration}s ease-in-out ${delay}s infinite;
            box-shadow: 0 0 ${size * 3}px currentColor;
        `;
        
        starsBackground.appendChild(particle);
    }
    
    // Add float animation if not exists
    if (!document.querySelector('#floatAnimation')) {
        const style = document.createElement('style');
        style.id = 'floatAnimation';
        style.textContent = `
            @keyframes float {
                0%, 100% {
                    transform: translate(0, 0) scale(1);
                }
                25% {
                    transform: translate(10px, -15px) scale(1.1);
                }
                50% {
                    transform: translate(-5px, -25px) scale(0.9);
                }
                75% {
                    transform: translate(-15px, -10px) scale(1.05);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// ===== Shopping Cart =====
class ShoppingCart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cart')) || [];
        this.updateCartCount();
    }
    
    addItem(product, quantity = 1) {
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                ...product,
                quantity: quantity
            });
        }
        
        this.saveCart();
        this.updateCartCount();
        this.showNotification(`Товар добавлен в корзину!`);
    }
    
    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartCount();
    }
    
    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            item.quantity = quantity;
            if (item.quantity <= 0) {
                this.removeItem(productId);
            } else {
                this.saveCart();
            }
        }
    }
    
    clearCart() {
        this.items = [];
        this.saveCart();
        this.updateCartCount();
    }
    
    getTotal() {
        return this.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }
    
    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }
    
    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.items));
    }
    
    updateCartCount() {
        const cartCountElement = document.getElementById('cartCount');
        if (cartCountElement) {
            const count = this.getItemCount();
            cartCountElement.textContent = count;
            cartCountElement.style.display = count > 0 ? 'flex' : 'none';
        }
    }
    
    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 16px 24px;
            background: linear-gradient(135deg, #FF00FF, #C700FF);
            color: white;
            border-radius: 8px;
            box-shadow: 0 0 20px rgba(255, 0, 255, 0.5);
            z-index: 10000;
            font-family: 'Rajdhani', sans-serif;
            font-weight: 600;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Add notification animations
if (!document.querySelector('#notificationAnimation')) {
    const style = document.createElement('style');
    style.id = 'notificationAnimation';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize global cart instance
window.cart = new ShoppingCart();

// Export functions for use in other scripts
window.login = login;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.convertPrice = convertPrice;
window.formatPrice = formatPrice;
window.currentLanguage = () => currentLanguage;
window.currentCurrency = () => currentCurrency;