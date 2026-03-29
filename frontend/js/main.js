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

// ========================================
// ===== ADVANCED SPACE BACKGROUND =====
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    const canvas = document.getElementById("space");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    let w, h;
    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // ⭐ ЗВЕЗДЫ
    const stars = [];
    const STAR_COUNT = 150;

    function randomColor() {
        const colors = [
            "255,255,255",
            "255,0,255",
            "0,240,255"
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            size: Math.random() * 2,
            opacity: Math.random(),
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            color: randomColor(),
            life: Math.random() * 200
        });
    }

    // ☄️ КОМЕТЫ
    const comets = [];

    function createComet() {
        comets.push({
            x: Math.random() * w,
            y: Math.random() * h * 0.5,
            length: 120 + Math.random() * 100,
            speed: 5 + Math.random() * 3,
            opacity: 1
        });
    }

    setInterval(() => {
        if (Math.random() < 0.4) createComet();
    }, 4000);

    function animate() {
        ctx.clearRect(0, 0, w, h);

        // ⭐ ЗВЕЗДЫ
        stars.forEach(star => {

            star.x += star.vx;
            star.y += star.vy;

            // 🔥 ТЕЛЕПОРТ
            star.life--;
            if (star.life <= 0) {
                star.x = Math.random() * w;
                star.y = Math.random() * h;
                star.life = 100 + Math.random() * 200;
                star.color = randomColor();
            }

            // границы
            if (star.x < 0 || star.x > w || star.y < 0 || star.y > h) {
                star.x = Math.random() * w;
                star.y = Math.random() * h;
            }

            // мигание
            star.opacity += (Math.random() - 0.5) * 0.05;
            star.opacity = Math.max(0.2, Math.min(1, star.opacity));

            // НЕОН
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);

            ctx.fillStyle = `rgba(${star.color}, ${star.opacity})`;
            ctx.shadowBlur = 12;
            ctx.shadowColor = `rgba(${star.color}, 1)`;

            ctx.fill();
        });

        // ☄️ КОМЕТЫ
        comets.forEach((c, i) => {

            const gradient = ctx.createLinearGradient(
                c.x, c.y,
                c.x - c.length, c.y + c.length
            );

            gradient.addColorStop(0, "rgba(255,255,255,1)");
            gradient.addColorStop(0.3, "rgba(255,0,255,0.8)");
            gradient.addColorStop(1, "rgba(0,240,255,0)");

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(c.x, c.y);
            ctx.lineTo(c.x - c.length, c.y + c.length);
            ctx.stroke();

            c.x += c.speed;
            c.y += c.speed;
            c.opacity -= 0.01;

            if (c.opacity <= 0) {
                comets.splice(i, 1);
            }
        });

        requestAnimationFrame(animate);
    }

    animate();
});

if (window.location.pathname.includes("login")) {
    requireGuest();
}