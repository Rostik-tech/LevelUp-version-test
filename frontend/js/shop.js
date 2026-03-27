// shop.js
// ========================================
// Shop Page - Backend Connected (Slug Version)
// ========================================

const API_BASE = "/api";


let allProducts = [];
let activeRarity = "ALL";

document.addEventListener("DOMContentLoaded", async () => {

    initFilters();
    await loadProducts();

});

async function loadProducts() {
    const container = document.getElementById("productsContainer");
    if (!container) return;

    try {
        const lang = window.currentLanguage ? window.currentLanguage() : "en";
        
        const response = await fetch(
        `${API_BASE}/products?lang=${lang}`
        );

        const products = await response.json();

        allProducts = Array.isArray(products) ? products : [];

        if (!products || products.length === 0) {
            container.innerHTML = `
                <p data-en="No products available"
                   data-ru="Нет доступных товаров">
                   Нет доступных товаров
                </p>
            `;
            triggerLanguageUpdate();
            return;
        }

        applyFilter();

    } catch (err) {
        console.error("SHOP LOAD ERROR:", err);
        container.innerHTML = "<p>Ошибка загрузки товаров</p>";
    }
}

function applyFilter() {

    const container = document.getElementById("productsContainer");
    if (!container) return;

    let filteredProducts = allProducts;

    if (activeRarity !== "ALL") {
        filteredProducts = allProducts.filter(
    product => (product.rarity || "").toUpperCase() === activeRarity
);
    }

    renderProducts(container, filteredProducts);
}

function getImageUrl(path) {
  if (!path) return "images/placeholder.jpg";
  return path;
}

function renderProducts(container, products) {
    container.innerHTML = products.map(product => {

        const image = (product.images && product.images.length > 0)
    ? getImageUrl(product.images[0])
    : "images/placeholder.jpg";

        return `
        <div class="product-card"
             onclick="goToProduct('${product.slug}')">
             

            <div class="product-image-wrapper">
            <div class="product-rarity rarity-${product.rarity}">
${product.rarity}
</div>
    <img src="${image}"
         alt="${product.name}"
         class="product-image">
</div>

            <h3 class="product-name">${product.name}</h3>
            <p class="product-description">
                ${product.shortDescription || ""}
            </p>

            <div class="product-footer">
                <span class="product-price">
                    ${window.formatPrice(product.price)}
                </span>

                <button class="btn btn-primary"
                        onclick="event.stopPropagation(); goToProduct('${product.slug}')"
                        data-en="View Details"
                        data-ru="Подробнее">
                    Подробнее
                </button>
            </div>
        </div>
        `;
    }).join("");

    triggerLanguageUpdate();
}

function goToProduct(slug) {
    window.location.href = `/product?slug=${slug}`;
}

function triggerLanguageUpdate() {
    if (window.updatePageLanguage) {
        window.updatePageLanguage();
    }
}

window.goToProduct = goToProduct;

function initFilters(){

    const buttons = document.querySelectorAll(".filter-btn");

    buttons.forEach(btn => {

        btn.addEventListener("click", () => {

            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            activeRarity = btn.dataset.rarity;

            applyFilter();
        });

    });

}

window.loadProducts = loadProducts;