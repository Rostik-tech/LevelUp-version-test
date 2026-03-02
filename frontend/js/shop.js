// ========================================
// Shop Page - Backend Connected (Slug Version)
// ========================================

const API_BASE = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", async () => {
    await loadProducts();
});

async function loadProducts() {
    const container = document.getElementById("productsContainer");
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE}/products`);
        const products = await response.json();

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

        renderProducts(container, products);

    } catch (err) {
        console.error("SHOP LOAD ERROR:", err);
        container.innerHTML = "<p>Ошибка загрузки товаров</p>";
    }
}

function renderProducts(container, products) {
    container.innerHTML = products.map(product => {

        const image = (product.images && product.images.length > 0)
            ? product.images[0]
            : "images/placeholder.jpg";

        return `
        <div class="product-card"
             onclick="goToProduct('${product.slug}')">

            <img src="${image}"
                 alt="${product.name}"
                 class="product-image">

            <h3 class="product-name">${product.name}</h3>
            <p class="product-description">
                ${product.shortDescription || ""}
            </p>

            <div class="product-footer">
                <span class="product-price">
                    $${Number(product.price).toFixed(2)}
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
    window.location.href = `product.html?slug=${slug}`;
}

function triggerLanguageUpdate() {
    if (window.updatePageLanguage) {
        window.updatePageLanguage();
    }
}

window.goToProduct = goToProduct;