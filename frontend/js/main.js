// ========================================
// Level Up Gaming - Main JavaScript
// JWT Version (Stable)
// ========================================

// ===== Language and Currency State =====
let currentLanguage = localStorage.getItem('language') || 'ru';
let currentCurrency = localStorage.getItem('currency') || 'usd';

const exchangeRates = {
    usd: 1,
    eur: 0.92
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function () {
    initLanguage();
    initCurrency();
    initAuth();
    initMobileMenu();
    initDropdowns();
    initStarsBackground();
});

// ========================================
// ===== Language Switching =====
// ========================================
function initLanguage() {
    const langBtn = document.getElementById('langBtn');
    const langMenu = document.getElementById('langMenu');
    const langOptions = document.querySelectorAll('.language-switcher .switcher-option');

    const currentLangEl = document.getElementById('currentLang');
    if (currentLangEl) {
        currentLangEl.textContent = currentLanguage.toUpperCase();
    }

    updatePageLanguage();

    if (langBtn && langMenu) {
        langBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            langMenu.classList.toggle('active');
        });
    }

    langOptions.forEach(function (option) {
        option.addEventListener('click', function () {
            const lang = option.dataset.lang;
            if (lang !== currentLanguage) {
                currentLanguage = lang;
                localStorage.setItem('language', lang);
                if (currentLangEl) {
                    currentLangEl.textContent = lang.toUpperCase();
                }
                updatePageLanguage();
            }
            if (langMenu) langMenu.classList.remove('active');
        });
    });
}

function updatePageLanguage() {
    const elements = document.querySelectorAll('[data-en]');

    elements.forEach(function (element) {
        const text = element.getAttribute('data-' + currentLanguage);

        if (text) {
            element.textContent = text;
        }
    });
}

// ========================================
// ===== Currency Switching =====
// ========================================
function initCurrency() {
    const currencyBtn = document.getElementById('currencyBtn');
    const currencyMenu = document.getElementById('currencyMenu');
    const currencyOptions = document.querySelectorAll('.currency-switcher .switcher-option');

    const currentCurrencyEl = document.getElementById('currentCurrency');
    if (currentCurrencyEl) {
        currentCurrencyEl.textContent = currentCurrency.toUpperCase();
    }

    updatePagePrices();

    if (currencyBtn && currencyMenu) {
        currencyBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            currencyMenu.classList.toggle('active');
        });
    }

    currencyOptions.forEach(function (option) {
    option.addEventListener('click', function () {
        const currency = option.dataset.currency;

        if (currency !== currentCurrency) {
            currentCurrency = currency;
            localStorage.setItem('currency', currency);

            if (currentCurrencyEl) {
                currentCurrencyEl.textContent = currency.toUpperCase();
            }

            updatePagePrices();

            // 🔥 ДОБАВЬ ВОТ ЭТО
            if (window.displayCart) {
                window.displayCart();
            }

            if (window.updateCartSummary) {
                window.updateCartSummary();
            }
        }

        if (currencyMenu) currencyMenu.classList.remove('active');
    });
});
}

function updatePagePrices() {
    const priceElements = document.querySelectorAll('[data-base-price]');
    priceElements.forEach(function (element) {
        let basePrice = parseFloat(
            element.dataset.basePrice ||
            element.textContent.replace(/[^0-9.]/g, '')
        );

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
    return symbol + price.toFixed(2);
}

// ========================================
// ===== Authentication (JWT) =====
// ========================================
function initAuth() {
    const authButtons = document.getElementById('authButtons');
    const profileDropdown = document.getElementById('profileDropdown');
    const logoutBtn = document.getElementById('logoutBtn');

    const token = localStorage.getItem('token');

    if (token) {
        if (authButtons) authButtons.style.display = 'none';
        if (profileDropdown) profileDropdown.style.display = 'block';

        // Получаем payload из JWT
        const payload = getTokenPayload();

        if (payload) {
            injectAdminButton(payload);
        }

    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (profileDropdown) profileDropdown.style.display = 'none';
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            logout();
        });
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

function getCurrentUser() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}

// ========================================
// ===== Mobile Menu =====
// ========================================
function initMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');

    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', function () {
            navMenu.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
        });
    }
}

// ========================================
// ===== Dropdown =====
// ========================================
function initDropdowns() {
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');

    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });

        document.addEventListener('click', function (e) {
            if (!e.target.closest('.profile-dropdown')) {
                profileDropdown.classList.remove('active');
            }
        });
    }
}

// ========================================
// ===== Stars Background =====
// ========================================
function initStarsBackground() {
    const starsBackground = document.getElementById('starsBackground');
    if (!starsBackground) return;

    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.position = 'absolute';
        particle.style.width = '2px';
        particle.style.height = '2px';
        particle.style.background = '#FF00FF';
        particle.style.borderRadius = '50%';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.opacity = Math.random();

        starsBackground.appendChild(particle);
    }
}

// ========================================
// ===== Cart =====
// ========================================
class ShoppingCart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cart')) || [];
        this.updateCartCount();
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.items));
    }

    getTotal() {
    return this.items.reduce(function (t, i) {
        return t + Number(i.price) * Number(i.quantity);
    }, 0);
    }

    getItemCount() {
        return this.items.reduce(function (c, i) {
            return c + i.quantity;
        }, 0);
    }

    updateCartCount() {
        const el = document.getElementById('cartCount');
        if (el) {
            const count = this.getItemCount();
            el.textContent = count;
            el.style.display = count > 0 ? 'flex' : 'none';
        }
    }
}

window.cart = new ShoppingCart();
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.formatPrice = formatPrice;
window.convertPrice = convertPrice;
window.currentLanguage = function () { return currentLanguage; };
window.currentCurrency = function () { return currentCurrency; };
// ========================================
// ===== Access Control Layer =====
// ========================================

function getTokenPayload() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch {
        return null;
    }
}

function requireGuest() {
    if (localStorage.getItem('token')) {
        window.location.href = 'index.html';
    }
}

function requireUser() {
    if (!localStorage.getItem('token')) {
        window.location.href = 'login.html';
    }
}

function requireAdmin() {
    const payload = getTokenPayload();
    const role = payload?.role?.toString().trim().toUpperCase();

    if (!role || role !== 'ADMIN') {
        window.location.href = 'index.html';
    }
}

window.requireGuest = requireGuest;
window.requireUser = requireUser;
window.requireAdmin = requireAdmin;
window.updatePageLanguage = updatePageLanguage;

// ========================================
// Inject Admin Button (Role Based UI)
// ========================================

function injectAdminButton(user) {
  if (!user || user.role !== "ADMIN") return;

  const dropdownMenu = document.getElementById("dropdownMenu");
  if (!dropdownMenu) return;

  // Чтобы не вставлять дважды
  if (document.getElementById("adminPanelBtn")) return;

  const divider = document.createElement("div");
  divider.className = "dropdown-divider";

  const adminLink = document.createElement("a");
  adminLink.href = "admin.html";
  adminLink.className = "dropdown-item";
  adminLink.id = "adminPanelBtn";
  adminLink.innerHTML = `
    <i class="fas fa-shield-alt"></i>
    <span>Admin Panel</span>
  `;

  // Вставляем сверху dropdown
  dropdownMenu.insertBefore(divider, dropdownMenu.firstChild);
  dropdownMenu.insertBefore(adminLink, divider);
}

document.querySelectorAll('a[href="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
});

document.addEventListener("DOMContentLoaded", function () {

const banner = document.getElementById("cookieBanner");
const accept = document.getElementById("acceptCookies");
const decline = document.getElementById("declineCookies");

const consent = localStorage.getItem("cookieConsent");

if (consent === null) {
banner.style.display = "block";
}

accept.addEventListener("click", function () {
localStorage.setItem("cookieConsent", "accepted");
banner.style.display = "none";
});

decline.addEventListener("click", function () {
localStorage.setItem("cookieConsent", "declined");
banner.style.display = "none";
});

});