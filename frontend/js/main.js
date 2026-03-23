// ========================================
// Level Up Gaming - Main JavaScript
// JWT Version (Stable)
// ========================================

// ===== Language State =====
let currentLanguage = localStorage.getItem('language') || 'ru';


// ===== INIT =====
document.addEventListener('DOMContentLoaded', function () {
    initLanguage();
    initAuth();
    initMobileMenu();
    initDropdowns();
    initStarsBackground();
});
const API_URL = "https://levelup-version-test-production.up.railway.app/api";

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem("token");

    const headers = {
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...options.headers
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        let data = null;
        const contentType = res.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
            data = await res.json();
        }

        if (!res.ok) {
            throw new Error(data?.message || "API error");
        }

        return data;

    } catch (err) {
        console.error("API ERROR:", err.message);
        throw err;
    }
}

async function login(email, password) {
    try {
        const data = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password })
        });

        localStorage.setItem("token", data.token);

        window.location.href = "index.html";

    } catch (err) {
        alert(err.message);
    }
}

apiRequest("/test-auth")
    .then(data => console.log("AUTH OK:", data))
    .catch(err => console.log("AUTH ERROR:", err.message));
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

    // 🔥 обновляем данные страницы
    if (window.loadProducts) {
        window.loadProducts();
    }

    if (window.loadProduct) {
        window.loadProduct();
    }
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

    document.dispatchEvent(new Event("languageChanged"));
   
}





// ========================================
// ===== Authentication (JWT) =====
// ========================================
function initAuth() {
    const authButtons = document.getElementById('authButtons');
    const authButtonsMobile = document.getElementById('authButtonsMobile');
    const profileDropdown = document.getElementById('profileDropdown');
    const mobileProfile = document.getElementById('mobileProfile');
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutBtnMobile = document.getElementById('logoutBtnMobile');

    const token = localStorage.getItem('token');

    if (token) {

    if (authButtons) authButtons.classList.add('hidden');
    if (authButtonsMobile) authButtonsMobile.classList.add('hidden');

    if (profileDropdown) profileDropdown.classList.remove('hidden');
    if (mobileProfile) mobileProfile.style.display = 'block';

    const user = getCurrentUser();
    injectAdminButton(user);

} else {

    if (authButtons) authButtons.classList.remove('hidden');
    if (authButtonsMobile) authButtonsMobile.classList.remove('hidden');

    if (profileDropdown) profileDropdown.classList.add('hidden');
    if (mobileProfile) mobileProfile.style.display = 'none';

}

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            logout();
        });
    }

    if (logoutBtnMobile) {
        logoutBtnMobile.addEventListener('click', function (e) {
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
    const toggle = document.getElementById('mobileMenuToggle');
    const menu = document.getElementById('navMenu');
    const overlay = document.getElementById('menuOverlay');

    if (!toggle || !menu) return;

    toggle.addEventListener('click', function () {
        menu.classList.toggle('active');
        toggle.classList.toggle('active');

        if (overlay) {
            overlay.classList.toggle('active');
        }
    });

    // закрытие по клику вне меню
    if (overlay) {
        overlay.addEventListener('click', function () {
            menu.classList.remove('active');
            toggle.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    // закрытие при клике на ссылку
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('active');
            toggle.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
        });
    });
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

function formatPrice(price) {
    return `$${Number(price).toFixed(2)}`;
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
window.currentLanguage = function () { return currentLanguage; };

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

const mobileMenuClose = document.getElementById('mobileMenuClose');
const navMenu = document.getElementById('navMenu');

if (mobileMenuClose && navMenu) {
    mobileMenuClose.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
}
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

apiRequest("/products")
    .then(data => console.log("PRODUCTS:", data))
    .catch(err => console.error("ERROR:", err));