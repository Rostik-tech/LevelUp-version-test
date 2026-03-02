// ========================================
// Product Page - Backend Connected (SAFE)
// ========================================

const API_BASE = "http://localhost:5000/api";

let currentProduct = null;
let selectedSize = null;

document.addEventListener("DOMContentLoaded", async () => {
    await loadProduct();
    setupAddToCart();
});

async function loadProduct() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");

    if (!slug) {
        window.location.href = "shop.html";
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/products/slug/${slug}`);

        if (!response.ok) {
            console.error("Product not found");
            window.location.href = "shop.html";
            return;
        }

        const product = await response.json();
        currentProduct = product;

        renderProduct(product);

    } catch (err) {
        console.error("PRODUCT LOAD ERROR:", err);
        window.location.href = "shop.html";
    }
}

function renderProduct(product) {
    const image = (product.images && product.images.length > 0)
        ? product.images[0]
        : "images/placeholder.jpg";

    const imageEl = document.getElementById("productImage");
    if (imageEl) imageEl.src = image;

    const titleEl = document.getElementById("productTitle");
    if (titleEl) titleEl.textContent = product.name;

    const descEl = document.getElementById("productDescription");
    if (descEl) {
        descEl.textContent =
            product.longDescription || product.shortDescription || "";
    }

    const breadcrumbEl = document.getElementById("breadcrumbProduct");
    if (breadcrumbEl) breadcrumbEl.textContent = product.name;

    const price = Number(product.price).toFixed(2);
    const priceEl = document.getElementById("productPrice");

if (priceEl) {
    const numericPrice = Number(product.price);

    priceEl.dataset.basePrice = numericPrice;

    if (window.convertPrice && window.formatPrice) {
        const converted = window.convertPrice(numericPrice);
        priceEl.textContent = window.formatPrice(converted);
    } else {
        priceEl.textContent = `$${numericPrice.toFixed(2)}`;
    }
}

    renderSizes(product);
}

function renderSizes(product) {
    const sizesContainer = document.getElementById("productSizes");
    const sizeOptions = document.getElementById("sizeOptions");

    if (!sizesContainer || !sizeOptions) return;

    if (!product.sizes || product.sizes.length === 0) {
        sizesContainer.style.display = "none";
        return;
    }

    sizesContainer.style.display = "block";

    sizeOptions.innerHTML = product.sizes.map(size => {
        const disabled = size.stock <= 0 ? "disabled" : "";
        const outOfStock = size.stock <= 0 ? " (Out of stock)" : "";

        return `
            <button class="size-btn"
                    data-size="${size.size}"
                    ${disabled}>
                ${size.size}${outOfStock}
            </button>
        `;
    }).join("");

    document.querySelectorAll(".size-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            if (btn.disabled) return;

            document.querySelectorAll(".size-btn")
                .forEach(b => b.classList.remove("active"));

            btn.classList.add("active");
            selectedSize = btn.dataset.size;
        });
    });
}

function setupAddToCart() {
    const btn = document.getElementById("addToCartBtn");
    if (!btn) return;

    btn.addEventListener("click", async () => {
        if (!currentProduct) return;

        if (currentProduct.sizes && currentProduct.sizes.length > 0) {
            if (!selectedSize) {
                alert("Выберите размер");
                return;
            }
        }

        const valid = await validateProduct();
        if (!valid) return;

        addToCart();
    });
}

async function validateProduct() {
    try {
        const response = await fetch(
            `${API_BASE}/products/${currentProduct.id}/validate`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    size: selectedSize,
                    quantity: 1
                })
            }
        );

        const data = await response.json();

        if (!data.valid) {
            alert(data.message || "Недостаточно товара");
            return false;
        }

        return true;

    } catch (err) {
        console.error("VALIDATE ERROR:", err);
        alert("Ошибка проверки товара");
        return false;
    }
}

function addToCart() {
    const cart = window.cart;
    if (!cart) return;

    const existing = cart.items.find(i =>
        i.id === currentProduct.id &&
        i.size === selectedSize
    );

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.items.push({
            id: currentProduct.id,
            name: {
                ru: currentProduct.name,
                en: currentProduct.name
            },
            price: Number(currentProduct.price),
            quantity: 1,
            size: selectedSize,
            image: currentProduct.images?.[0] || null
        });
    }

    cart.saveCart();
    cart.updateCartCount();

    alert("Товар добавлен в корзину");
}