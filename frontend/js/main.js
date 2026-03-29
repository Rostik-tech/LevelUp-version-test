// ========================================
// Level Up Gaming - Main JavaScript
// JWT Version (Stable)
// ========================================

// ===== Language State =====
let currentLanguage = localStorage.getItem('language') || 'ru';
import { apiRequest } from "./admin-api.js";

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function () {
    initLanguage();
    initAuth();
    initMobileMenu();
    initDropdowns();
});
const API_URL = "/api";



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

// ========================================
// ===== CANVAS SPACE BACKGROUND =====
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    const canvas = document.getElementById("space");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    let stars = [];
    let shootingStars = [];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    resize();

    function createStars(count) {
        stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2,
                opacity: Math.random(),
            });
        }
    }

    function createShootingStar() {
        shootingStars.push({
            x: Math.random() * canvas.width,
            y: 0,
            length: Math.random() * 80 + 50,
            speed: Math.random() * 10 + 6,
            opacity: 1,
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // ⭐ звезды
        stars.forEach(star => {
            star.opacity += (Math.random() - 0.5) * 0.05;

            if (star.opacity < 0.1) star.opacity = 0.1;
            if (star.opacity > 1) star.opacity = 1;

            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${star.opacity})`;
            ctx.fill();
        });

        // 🚀 кометы
        shootingStars.forEach((s, i) => {
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - s.length, s.y + s.length);
            ctx.strokeStyle = `rgba(255,255,255,${s.opacity})`;
            ctx.lineWidth = 2;
            ctx.stroke();

            s.x += s.speed;
            s.y += s.speed;
            s.opacity -= 0.01;

            if (s.opacity <= 0) {
                shootingStars.splice(i, 1);
            }
        });

        if (Math.random() < 0.01) {
            createShootingStar();
        }

        requestAnimationFrame(draw);
    }

    createStars(500); // можешь увеличить до 800-1200
    draw();
});
if (window.location.pathname.includes("login")) {
    requireGuest();
}