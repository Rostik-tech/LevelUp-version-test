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
// ===== ULTRA SPACE BACKGROUND (PRO) =====
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

    // ⭐ ЗВЕЗДЫ С ГЛУБИНОЙ
    const stars = [];
    const STAR_COUNT = 200;

    function randomColor() {
        const colors = [
            "255,255,255",
            "255,0,255",
            "0,240,255"
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    for (let i = 0; i < STAR_COUNT; i++) {
        const depth = Math.random(); // глубина

        stars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            size: Math.random() * 2 + depth,
            opacity: Math.random(),
            vx: (Math.random() - 0.5) * depth,
            vy: (Math.random() - 0.5) * depth,
            color: randomColor(),
            life: 100 + Math.random() * 300,
            depth: depth
        });
    }

    // ☄️ КОМЕТЫ
    const comets = [];
    // ✨ ЧАСТИЦЫ КОМЕТ
    const particles = [];

    function createComet(superMode = false) {

        // разные углы
        const angle = (Math.random() * Math.PI) / 3 + Math.PI / 6;

        const speed = superMode ? 10 : 5 + Math.random() * 3;

        comets.push({
    x: Math.random() * w * 0.5,
    y: Math.random() * h * 0.3,

    

    speedX: Math.cos(angle) * speed,
    speedY: Math.sin(angle) * speed,

    

    // 🔥 НОВОЕ (ядро + частицы)
    headSize: superMode ? 10 : 4,
    particleRate: superMode ? 8 : 2,
    width: superMode ? 5 : 2,
    glow: superMode ? 40 : 15,
    length: superMode ? 400 : 120 + Math.random() * 100
});
    }

    // 🔥 СПАВН БЕЗ НАКОПЛЕНИЯ
    let lastCometTime = 0;
    const cometDelay = 6000;

    function trySpawnComet(time) {
        if (time - lastCometTime > cometDelay + Math.random() * 5000) {

            // шанс на супер-комету
            if (Math.random() < 0.05) {
                createComet(true);
            } else {
                createComet(false);
            }

            lastCometTime = time;
        }
    }

    // ✨ СОЗДАНИЕ ЧАСТИЦ
function spawnParticles(c) {
    for (let i = 0; i < c.particleRate; i++) {

        particles.push({
            x: c.x,
            y: c.y,

            vx: (Math.random() - 0.5) * 1 - c.speedX * 0.1,
            vy: (Math.random() - 0.5) * 1 - c.speedY * 0.1,

            life: 40 + Math.random() * 20,
            size: Math.random() * 2 + 0.5
        });
    }
}


    function animate(time = 0) {
        ctx.clearRect(0, 0, w, h);

        trySpawnComet(time);

        // ⭐ ЗВЕЗДЫ
        stars.forEach(star => {

            star.x += star.vx;
            star.y += star.vy;

            // телепорт
            star.life--;
            if (star.life <= 0) {
                star.x = Math.random() * w;
                star.y = Math.random() * h;
                star.life = 100 + Math.random() * 300;
                star.color = randomColor();
            }

            if (star.x < 0 || star.x > w || star.y < 0 || star.y > h) {
                star.x = Math.random() * w;
                star.y = Math.random() * h;
            }

            // мягкое мерцание
            star.opacity += (Math.random() - 0.5) * 0.03;
            star.opacity = Math.max(0.2, Math.min(1, star.opacity));

            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);

            ctx.fillStyle = `rgba(${star.color}, ${star.opacity})`;
            ctx.shadowBlur = 10 + star.depth * 10;
            ctx.shadowColor = `rgba(${star.color},1)`;

            ctx.fill();
        });

        // ☄️ КОМЕТЫ
        comets.forEach((c, i) => {
            spawnParticles(c);

            const angle = Math.atan2(c.speedY, c.speedX);

            const tailX = c.x - Math.cos(angle) * c.length;
            const tailY = c.y - Math.sin(angle) * c.length;

            

            // 🌫 ДЫМНЫЙ ХВОСТ (мягкий)
for (let i = 0; i < c.length; i += 4) {

    const t = i / c.length;

    const x = c.x - Math.cos(angle) * i;
    const y = c.y - Math.sin(angle) * i;

    const size = c.width * (1 - t) * 6;

    const alpha = (1 - t) * 0.15;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);

    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(255,255,255,0.5)";

    ctx.fill();
}
// ✨ GLOW КАК В ИГРАХ (слои)

// внешний glow
ctx.beginPath();
ctx.arc(c.x, c.y, c.headSize * 3, 0, Math.PI * 2);
ctx.fillStyle = "rgba(255,255,255,0.08)";
ctx.fill();

// средний glow
ctx.beginPath();
ctx.arc(c.x, c.y, c.headSize * 2, 0, Math.PI * 2);
ctx.fillStyle = "rgba(255,255,255,0.15)";
ctx.fill();

// ядро
ctx.beginPath();
ctx.arc(c.x, c.y, c.headSize, 0, Math.PI * 2);
ctx.fillStyle = "rgba(255,255,255,1)";
ctx.shadowBlur = 30;
ctx.shadowColor = "rgba(255,255,255,1)";
ctx.fill();

            c.x += c.speedX;
            c.y += c.speedY;

            // удаление только за экраном
            if (
                c.x > w + 300 ||
                c.y > h + 300 ||
                c.x < -300 ||
                c.y < -300
            ) {
                comets.splice(i, 1);
            }
            
        });

        // ✨ ОТРИСОВКА ЧАСТИЦ
particles.forEach((p, i) => {

    p.x += p.vx;
    p.y += p.vy;
    p.life--;

    const alpha = p.life / 60;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(255,255,255,1)";

    ctx.fill();

    if (p.life <= 0) {
        particles.splice(i, 1);
    }
});

if (particles.length > 1000) {
    particles.splice(0, 200);
}

        requestAnimationFrame(animate);
    }

    animate();
});

if (window.location.pathname.includes("login")) {
    requireGuest();
}