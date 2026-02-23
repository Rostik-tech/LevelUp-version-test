// ========================================
// Shop Page - Backend Connected
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
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image || 'images/placeholder.jpg'}"
                 alt="${product.name}"
                 class="product-image">

            <h3 class="product-name">${product.name}</h3>
            <p class="product-description">${product.description || ""}</p>

            <div class="product-footer">
                <span class="product-price">$${Number(product.price).toFixed(2)}</span>
                <button onclick="addToCart(${product.id}, '${product.name}', ${product.price}, '${product.image}')"
                        class="btn btn-primary"
                        data-en="Add to Cart"
                        data-ru="В корзину">
                    В корзину
                </button>
            </div>
        </div>
    `).join("");

    triggerLanguageUpdate();
}

function addToCart(id, name, price, image) {
    const cart = window.cart;
    if (!cart) return;

    const existing = cart.items.find(i => i.id === id);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.items.push({
            id,
            name: { ru: name, en: name },
            price,
            quantity: 1,
            image
        });
    }

    cart.saveCart();
    cart.updateCartCount();

    alert("Товар добавлен в корзину");
}

function triggerLanguageUpdate() {
    if (window.updatePageLanguage) {
        window.updatePageLanguage();
    }
}

window.addToCart = addToCart;