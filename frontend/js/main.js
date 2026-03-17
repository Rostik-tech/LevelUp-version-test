
// ========================================
// Level Up Gaming - Main JavaScript
// JWT Version (EUR Only)
// ========================================

// ===== Language State =====
let currentLanguage = localStorage.getItem("language") || "ru";

// ===== INIT =====
document.addEventListener("DOMContentLoaded", function () {
  initLanguage();
  initAuth();
  initMobileMenu();
  initDropdowns();
  initStarsBackground();

  // 🔥 ДОБАВИТЬ
  if (window.cart && window.cart.updateCartCount) {
    window.cart.updateCartCount();
  }
});

// ========================================
// ===== Language Switching =====
// ========================================
function initLanguage() {
  const langBtn = document.getElementById("langBtn");
  const langMenu = document.getElementById("langMenu");
  const langOptions = document.querySelectorAll(
    ".language-switcher .switcher-option"
  );

  const currentLangEl = document.getElementById("currentLang");

  if (currentLangEl) {
    currentLangEl.textContent = currentLanguage.toUpperCase();
  }

  updatePageLanguage();

  if (langBtn && langMenu) {
    langBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      langMenu.classList.toggle("active");
    });
  }

  langOptions.forEach(function (option) {
    option.addEventListener("click", function () {
      const lang = option.dataset.lang;

      if (lang !== currentLanguage) {
        currentLanguage = lang;
        localStorage.setItem("language", lang);

        if (currentLangEl) {
          currentLangEl.textContent = lang.toUpperCase();
        }

        updatePageLanguage();

        if (window.loadProducts) window.loadProducts();
        if (window.loadProduct) window.loadProduct();
        if (window.displayCart) window.displayCart();
      }

      if (langMenu) langMenu.classList.remove("active");
    });
  });
}

function updatePageLanguage() {
  const elements = document.querySelectorAll("[data-en]");

  elements.forEach(function (element) {
    const text = element.getAttribute("data-" + currentLanguage);

    if (text) {
      element.textContent = text;
    }
  });
}

// ========================================
// ===== Price Formatter (EUR ONLY)
// ========================================
function formatPrice(price) {
  return "€" + (Number(price) || 0).toFixed(2);
}

// ========================================
// ===== Authentication (JWT)
// ========================================
function initAuth() {
  const authButtons = document.getElementById("authButtons");
  const profileDropdown = document.getElementById("profileDropdown");
  const logoutBtn = document.getElementById("logoutBtn");

  const token = localStorage.getItem("token");

  if (token) {
    if (authButtons) authButtons.style.display = "none";
    if (profileDropdown) profileDropdown.style.display = "block";

    const payload = getTokenPayload();
    if (payload) injectAdminButton(payload);
  } else {
    if (authButtons) authButtons.style.display = "flex";
    if (profileDropdown) profileDropdown.style.display = "none";
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      logout();
    });
  }
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}

function getCurrentUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
}

// ========================================
// ===== Mobile Menu
// ========================================
function initMobileMenu() {
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  const navMenu = document.getElementById("navMenu");

  if (mobileMenuToggle && navMenu) {
    mobileMenuToggle.addEventListener("click", function () {
      navMenu.classList.toggle("active");
      mobileMenuToggle.classList.toggle("active");
    });
  }
}

// ========================================
// ===== Dropdown
// ========================================
function initDropdowns() {
  const profileBtn = document.getElementById("profileBtn");
  const profileDropdown = document.getElementById("profileDropdown");

  if (profileBtn && profileDropdown) {
    profileBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      profileDropdown.classList.toggle("active");
    });

    document.addEventListener("click", function (e) {
      if (!e.target.closest(".profile-dropdown")) {
        profileDropdown.classList.remove("active");
      }
    });
  }
}

// ========================================
// ===== Stars Background
// ========================================
function initStarsBackground() {
  const starsBackground = document.getElementById("starsBackground");
  if (!starsBackground) return;

  for (let i = 0; i < 30; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";

    particle.style.position = "absolute";
    particle.style.width = "2px";
    particle.style.height = "2px";
    particle.style.background = "#FF00FF";
    particle.style.borderRadius = "50%";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.top = Math.random() * 100 + "%";
    particle.style.opacity = Math.random();

    starsBackground.appendChild(particle);
  }
}

// ========================================
// ===== Cart System
// ========================================
class ShoppingCart {
  constructor() {
  this.items = JSON.parse(localStorage.getItem("cartItems") || "[]");
  this.updateCartCount();
}

  saveCart() {
  localStorage.setItem("cartItems", JSON.stringify(this.items));
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
    const cart = JSON.parse(localStorage.getItem("cartItems") || "[]");

    const total = cart.reduce((sum, item) => {
        return sum + Number(item.quantity || 0);
    }, 0);

    const badge = document.querySelector(".cart-count");

    if (badge) {
        badge.textContent = total;
    }
}
}

// ========================================
// ===== Access Control Layer
// ========================================
function getTokenPayload() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

function requireGuest() {
  if (localStorage.getItem("token")) {
    window.location.href = "index.html";
  }
}

function requireUser() {
  if (!localStorage.getItem("token")) {
    window.location.href = "login.html";
  }
}

function requireAdmin() {
  const payload = getTokenPayload();
  const role = payload?.role?.toString().trim().toUpperCase();

  if (!role || role !== "ADMIN") {
    window.location.href = "index.html";
  }
}

// ========================================
// ===== Admin Panel Injection
// ========================================
function injectAdminButton(user) {
  if (!user || user.role !== "ADMIN") return;

  const dropdownMenu = document.getElementById("dropdownMenu");
  if (!dropdownMenu) return;

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

  dropdownMenu.insertBefore(divider, dropdownMenu.firstChild);
  dropdownMenu.insertBefore(adminLink, divider);
}

// ========================================
// ===== Cookie Banner
// ========================================
document.addEventListener("DOMContentLoaded", function () {
  const banner = document.getElementById("cookieBanner");
  const accept = document.getElementById("acceptCookies");
  const decline = document.getElementById("declineCookies");

  const consent = localStorage.getItem("cookieConsent");

  if (consent === null && banner) {
    banner.style.display = "block";
  }

  if (accept) {
    accept.addEventListener("click", function () {
      localStorage.setItem("cookieConsent", "accepted");
      banner.style.display = "none";
    });
  }

  if (decline) {
    decline.addEventListener("click", function () {
      localStorage.setItem("cookieConsent", "declined");
      banner.style.display = "none";
    });
  }
});

// ========================================
// ===== Global Exports
// ========================================
window.cart = new ShoppingCart();
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.formatPrice = formatPrice;
window.currentLanguage = function () {
  return currentLanguage;
};
window.requireGuest = requireGuest;
window.requireUser = requireUser;
window.requireAdmin = requireAdmin;
window.updatePageLanguage = updatePageLanguage;
window.addEventListener("storage", () => {
  if (window.cart && window.cart.updateCartCount) {
    window.cart.updateCartCount();
  }
});