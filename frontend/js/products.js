// ========================================
// Product Page - Backend Connected (SAFE + Gallery)
// ========================================

const API_BASE = "http://localhost:5000/api";
const BACKEND_BASE = "http://localhost:5000";

let currentProduct = null;
let selectedSize = null;
let currentProductId = null;

document.addEventListener("DOMContentLoaded", async () => {
    await loadProduct();
    setupAddToCart();
});

// ========================
// Load Product
// ========================
async function loadProduct() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");

    if (!slug) {
        window.location.href = "shop.html";
        return;
    }

    try {
        const lang = window.currentLanguage ? window.currentLanguage() : "en";

        const response = await fetch(
        `${API_BASE}/products/slug/${slug}?lang=${lang}`
        );

        if (!response.ok) {
            console.error("Product not found");
            window.location.href = "shop.html";
            return;
        }

        const product = await response.json();
        currentProduct = product;

        currentProductId = product.id;
        loadReviews(product.id);
        setupReviewForm(product.id);

        renderProduct(product);

    } catch (err) {
        console.error("PRODUCT LOAD ERROR:", err);
        window.location.href = "shop.html";
    }
}

// ========================
// Helper for Image URLs
// ========================
function getImageUrl(path) {
    if (!path) return "frontend/images/placeholder.jpg";
    return `${BACKEND_BASE}${path}`;
}

// ========================
// Render Product
// ========================
function renderProduct(product) {

    // ===== IMAGES (Gallery) =====
    const images = (product.images && product.images.length > 0)
        ? product.images
        : [null];

    const mainImageEl = document.getElementById("productImage");
    const thumbnailsContainer = document.getElementById("imageThumbnails");

    if (mainImageEl) {
        mainImageEl.src = getImageUrl(images[0]);
    }

    if (thumbnailsContainer) {
        thumbnailsContainer.innerHTML = images.map((img, index) => `
            <img src="${getImageUrl(img)}"
                 class="thumbnail ${index === 0 ? "active" : ""}"
                 data-index="${index}">
        `).join("");

        const thumbs = document.querySelectorAll(".thumbnail");

        thumbs.forEach(thumb => {
            thumb.addEventListener("click", () => {
                thumbs.forEach(t => t.classList.remove("active"));
                thumb.classList.add("active");
                mainImageEl.src = thumb.src;
            });
        });
    }

    // ===== TITLE =====
    const lang = window.currentLanguage ? window.currentLanguage() : "en";

const title =
    product[`name_${lang}`] ||
    product.name_en ||
    "";

const description =
    product[`longDescription_${lang}`] ||
    product.longDescription ||
    product[`shortDescription_${lang}`] ||
    product.shortDescription ||
    "";

const titleEl = document.getElementById("productTitle");
if (titleEl) titleEl.textContent = title;

const descEl = document.getElementById("productDescription");
if (descEl) descEl.textContent = description;

const breadcrumbEl = document.getElementById("breadcrumbProduct");
if (breadcrumbEl) breadcrumbEl.textContent = title;

    // ===== PRICE =====
const priceEl = document.getElementById("productPrice");

if (priceEl) {

    const numericPrice = Number(product.price);

    priceEl.textContent = `€${numericPrice.toFixed(2)}`;

}

    // ===== SIZES =====
    renderSizes(product);
}

// ========================
// Render Sizes
// ========================
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
        const isOut = size.stock <= 0;

        return `
            <button 
                class="size-btn ${isOut ? "out-of-stock" : ""}"
                data-size="${size.size}"
                ${isOut ? "disabled" : ""}
            >
                <span class="size-label">${size.size}</span>
                ${isOut ? '<span class="stock-badge">OUT</span>' : ""}
            </button>
        `;
    }).join("");

    const buttons = document.querySelectorAll(".size-btn");

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            if (btn.disabled) return;

            buttons.forEach(b => b.classList.remove("active"));

            btn.classList.add("active");
            selectedSize = btn.dataset.size;
        });
    });
}

// ========================
// Add To Cart Setup
// ========================
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

// ========================
// Validate Product
// ========================
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

// ========================
// Add To Cart
// ========================
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
    name: currentProduct.name_en,
    price: Number(currentProduct.price),
    quantity: 1,
    size: selectedSize,
    image: currentProduct.images?.[0]
        ? `http://localhost:5000${currentProduct.images[0]}`
        : null
        });
    }

    cart.saveCart();
    cart.updateCartCount();

    alert("Товар добавлен в корзину");
}

// ========================
// LOAD REVIEWS
// ========================

async function loadReviews(productId){

    try{

        const response = await fetch(`${API_BASE}/reviews/product/${productId}`);
        const reviews = await response.json();

        renderReviews(reviews);

    }catch(err){

        console.error("REVIEWS LOAD ERROR:", err);

    }

}

// ========================
// RENDER REVIEWS
// ========================

function renderReviews(reviews){

    const container = document.getElementById("reviewsList");
    const noReviews = document.getElementById("noReviews");

    if(!container) return;

    // ========================
    // CALCULATE RATING
    // ========================

    const totalReviews = reviews.length;

    let ratingSum = 0;

    reviews.forEach(r => {
        ratingSum += r.rating;
    });

    const averageRating = totalReviews > 0
        ? (ratingSum / totalReviews).toFixed(1)
        : 0;

    // update header rating

    const headerRating = document.getElementById("headerRating");
    const headerReviewsCount = document.getElementById("headerReviewsCount");

    if(headerRating) headerRating.textContent = averageRating;
    if(headerReviewsCount) headerReviewsCount.textContent = totalReviews;

    // update summary rating

    const avgRating = document.getElementById("avgRating");
    const totalReviewsEl = document.getElementById("totalReviews");

    if(avgRating) avgRating.textContent = averageRating;
    if(totalReviewsEl) totalReviewsEl.textContent = totalReviews;

    // update stars display

    const stars = document.getElementById("summaryStars");

    if(stars){

        const fullStars = Math.round(averageRating);

        stars.textContent =
            "★".repeat(fullStars) +
            "☆".repeat(5 - fullStars);

    }

    // ========================
// RATING DISTRIBUTION
// ========================

const ratingsCount = {
    5:0,
    4:0,
    3:0,
    2:0,
    1:0
};

reviews.forEach(r => {
    ratingsCount[r.rating]++;
});

for(let i = 1; i <= 5; i++){

    const count = ratingsCount[i];
    const percent = totalReviews > 0
        ? (count / totalReviews) * 100
        : 0;

    const bar = document.getElementById(`bar${i}`);
    const countEl = document.getElementById(`count${i}`);

    if(bar) bar.style.width = percent + "%";
    if(countEl) countEl.textContent = count;

}

    // ========================
    // NO REVIEWS
    // ========================

    if(!reviews || reviews.length === 0){

        if(noReviews) noReviews.style.display = "block";
        container.innerHTML = "";
        return;

    }

    if(noReviews) noReviews.style.display = "none";

    // ========================
// RENDER REVIEWS LIST
// ========================

container.innerHTML = reviews.map(r => {

    const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);

    return `

        <div class="review-card">

            <div class="review-header">
                <strong>${r.User?.username || "User"}</strong>
                <span class="review-stars">${stars}</span>
            </div>

            <p class="review-text">
                ${r.comment}
            </p>

            <span class="review-date">
                ${new Date(r.createdAt).toLocaleDateString()}
            </span>

        </div>

    `;

}).join("");
}

// ========================
// REVIEW FORM
// ========================

function setupReviewForm(productId){

    const form = document.getElementById("reviewFormElement");
    if(!form) return;

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const rating = document.getElementById("ratingInput").value;
        const comment = document.getElementById("reviewText").value;

        if (rating == 0) {
    alert("Пожалуйста, выберите рейтинг");
    return;
}

        try{

            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE}/reviews/product/${productId}`,{

                method:"POST",

                headers:{
                    "Content-Type":"application/json",
                    "Authorization":`Bearer ${token}`
                },

                body:JSON.stringify({
                    rating,
                    comment
                })

            });

            const data = await response.json();

            if(!response.ok){
                alert(data.message || "Ошибка отправки отзыва");
                return;
            }

            alert("Отзыв отправлен");

            form.reset();

            loadReviews(productId);

            document.getElementById("ratingInput").value = 0;

            document.querySelectorAll(".star-rating-selector i").forEach(s => {
             s.classList.remove("active");
            });

        }catch(err){

            console.error("REVIEW ERROR:", err);
            alert("Ошибка отправки отзыва");

        }

    });

}

// ========================
// STAR RATING SELECTOR
// ========================

document.querySelectorAll(".star-rating-selector i").forEach(star => {

    star.addEventListener("click", () => {

        const rating = star.dataset.rating;

        document.getElementById("ratingInput").value = rating;

        document.querySelectorAll(".star-rating-selector i").forEach(s => {
            s.classList.remove("active");
        });

        for (let i = 0; i < rating; i++) {
            document.querySelectorAll(".star-rating-selector i")[i].classList.add("active");
        }

    });

});

window.loadProduct = loadProduct;