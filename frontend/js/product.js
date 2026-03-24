//product.js
// ========================================
// Products Data and Display
// ========================================

// Sample Products Data
const productsData = [
    {
        id: 1,
        name: {
            en: 'Pro Gaming Mouse',
            ru: 'Игровая мышь Pro'
        },
        description: {
            en: 'High-precision optical sensor with RGB lighting',
            ru: 'Высокоточный оптический сенсор с RGB подсветкой'
        },
        price: 79.99,
        image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&h=500&fit=crop',
        category: 'mice'
    },
    {
        id: 2,
        name: {
            en: 'Mechanical Keyboard RGB',
            ru: 'Механическая клавиатура RGB'
        },
        description: {
            en: 'Cherry MX switches with customizable RGB backlighting',
            ru: 'Переключатели Cherry MX с настраиваемой RGB подсветкой'
        },
        price: 149.99,
        image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&h=500&fit=crop',
        category: 'keyboards'
    },
    {
        id: 3,
        name: {
            en: 'Gaming Headset Pro',
            ru: 'Игровая гарнитура Pro'
        },
        description: {
            en: '7.1 surround sound with noise-canceling microphone',
            ru: '7.1 объемный звук с микрофоном с шумоподавлением'
        },
        price: 129.99,
        image: 'https://images.unsplash.com/photo-1599669454699-248893623440?w=500&h=500&fit=crop',
        category: 'headsets'
    },
    {
        id: 4,
        name: {
            en: 'Gaming Chair Elite',
            ru: 'Игровое кресло Elite'
        },
        description: {
            en: 'Ergonomic design with lumbar support and adjustable armrests',
            ru: 'Эргономичный дизайн с поясничной поддержкой и регулируемыми подлокотниками'
        },
        price: 299.99,
        image: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=500&h=500&fit=crop',
        category: 'chairs'
    },
    {
        id: 5,
        name: {
            en: 'RGB Mouse Pad XXL',
            ru: 'RGB коврик для мыши XXL'
        },
        description: {
            en: 'Extra large gaming mouse pad with RGB edge lighting',
            ru: 'Большой игровой коврик для мыши с RGB подсветкой по краям'
        },
        price: 39.99,
        image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=500&h=500&fit=crop',
        category: 'accessories'
    },
    {
        id: 6,
        name: {
            en: 'Webcam 4K Ultra HD',
            ru: 'Веб-камера 4K Ultra HD'
        },
        description: {
            en: 'Professional 4K streaming camera with auto-focus',
            ru: 'Профессиональная камера для стриминга 4K с автофокусом'
        },
        price: 159.99,
        image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=500&h=500&fit=crop',
        category: 'streaming'
    },
    {
        id: 7,
        name: {
            en: 'Controller Pro Elite',
            ru: 'Контроллер Pro Elite'
        },
        description: {
            en: 'Wireless gaming controller with programmable buttons',
            ru: 'Беспроводной игровой контроллер с программируемыми кнопками'
        },
        price: 89.99,
        image: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=500&h=500&fit=crop',
        category: 'controllers'
    },
    {
        id: 8,
        name: {
            en: 'Gaming Monitor 27" 144Hz',
            ru: 'Игровой монитор 27" 144Hz'
        },
        description: {
            en: 'QHD curved display with 1ms response time',
            ru: 'Изогнутый QHD дисплей со временем отклика 1 мс'
        },
        price: 399.99,
        image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&h=500&fit=crop',
        category: 'monitors'
    }
];

// Display products on homepage
function displayFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;
    
    // Show first 4 products
    const featuredProducts = productsData.slice(0, 4);
    
    container.innerHTML = featuredProducts.map(product => createProductCard(product)).join('');
    
    // Add event listeners to "Add to Cart" buttons
    container.querySelectorAll('.product-add-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.productId);
            const product = productsData.find(p => p.id === productId);
            if (product && window.cart) {
                window.cart.addItem(product);
            }
        });
    });
}

// Display all products on shop page
function displayAllProducts(filterCategory = 'all') {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    let products = productsData;
    
    // Filter by category
    if (filterCategory !== 'all') {
        products = products.filter(p => p.category === filterCategory);
    }
    
    container.innerHTML = products.map(product => createProductCard(product)).join('');
    
    // Add event listeners
    container.querySelectorAll('.product-add-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.productId);
            const product = productsData.find(p => p.id === productId);
            if (product && window.cart) {
                window.cart.addItem(product);
            }
        });
    });
}

// Create product card HTML
function createProductCard(product) {
    const lang = window.currentLanguage ? window.currentLanguage() : 'ru';
    const name = product.name[lang] || product.name.ru;
    const description = product.description[lang] || product.description.ru;
    const price = window.formatPrice ? window.formatPrice(product.price) : `$${product.price}`;
    
    return `
        <div class="product-card" data-product-id="${product.id}">
            <img src="${product.image}" alt="${name}" class="product-image" onerror="this.src='https://via.placeholder.com/500x500/1a0533/FF00FF?text=Gaming+Gear'">
            <h3 class="product-name">${name}</h3>
            <p class="product-description">${description}</p>
            <div class="product-footer">
                <span class="product-price" data-base-price="${product.price}">${price}</span>
                <button class="product-add-btn" data-product-id="${product.id}">
                    <i class="fas fa-cart-plus"></i>
                    <span data-en="Add" data-ru="Купить">${lang === 'en' ? 'Add' : 'Купить'}</span>
                </button>
            </div>
        </div>
    `;
}

// Get product by ID
function getProductById(id) {
    return productsData.find(product => product.id === parseInt(id));
}

// Initialize products on page load
document.addEventListener('DOMContentLoaded', function() {
    // Display featured products on homepage
    if (document.getElementById('featuredProducts')) {
        displayFeaturedProducts();
    }
    
    // Display all products on shop page
    if (document.getElementById('productsContainer')) {
        displayAllProducts();
        
        // Category filter functionality
        const categoryFilters = document.querySelectorAll('.category-filter');
        categoryFilters.forEach(filter => {
            filter.addEventListener('click', (e) => {
                categoryFilters.forEach(f => f.classList.remove('active'));
                e.target.classList.add('active');
                const category = e.target.dataset.category;
                displayAllProducts(category);
            });
        });
    }
});

// Export for use in other scripts
window.productsData = productsData;
window.getProductById = getProductById;
window.displayFeaturedProducts = displayFeaturedProducts;
window.displayAllProducts = displayAllProducts;