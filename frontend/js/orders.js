// Orders Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
    
    displayOrders();
});

function displayOrders() {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const lang = window.currentLanguage ? window.currentLanguage() : 'ru';
    
    if (orders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon"><i class="fas fa-box-open"></i></div>
                <p class="empty-cart-text">У вас пока нет заказов</p>
                <a href="shop.html" class="btn btn-primary">Начать покупки</a>
            </div>
        `;
        return;
    }
    
    ordersList.innerHTML = orders.reverse().map(order => {
        const date = new Date(order.date).toLocaleDateString('ru-RU');
        const total = window.formatPrice ? window.formatPrice(order.total) : `$${order.total.toFixed(2)}`;
        
        const itemsHTML = order.items.map(item => {
            const name = item.name?.[lang] || item.name?.ru || 'Product';
            const price = window.formatPrice ? window.formatPrice(item.price * item.quantity) : `$${(item.price * item.quantity).toFixed(2)}`;
            return `
                <div class="order-item">
                    <span>${name} x${item.quantity}</span>
                    <span>${price}</span>
                </div>
            `;
        }).join('');
        
        return `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <div class="order-id">Заказ #${order.id}</div>
                        <div class="order-date">${date}</div>
                    </div>
                    <div class="order-status ${order.status}">
                        ${order.status === 'pending' ? 'В обработке' : 'Завершен'}
                    </div>
                </div>
                <div class="order-items">${itemsHTML}</div>
                <div class="order-footer">
                    <span>Итого:</span>
                    <span class="order-total">${total}</span>
                </div>
            </div>
        `;
    }).join('');
}