// Profile Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
    
    loadUserProfile();
    loadUserStats();
    
    document.getElementById('profileForm')?.addEventListener('submit', handleProfileUpdate);
});

function loadUserProfile() {
    const user = window.getCurrentUser ? window.getCurrentUser() : null;
    
    if (user) {
        document.getElementById('profileName').textContent = user.fullName || 'Пользователь';
        document.getElementById('profileEmail').textContent = user.email || 'user@example.com';
        document.getElementById('fullNameInput').value = user.fullName || '';
        document.getElementById('emailInput').value = user.email || '';
    }
}

function loadUserStats() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('totalSpent').textContent = window.formatPrice ? window.formatPrice(totalSpent) : `$${totalSpent.toFixed(2)}`;
}

function handleProfileUpdate(e) {
    e.preventDefault();
    
    const user = window.getCurrentUser ? window.getCurrentUser() : {};
    user.fullName = document.getElementById('fullNameInput').value;
    user.email = document.getElementById('emailInput').value;
    
    localStorage.setItem('user', JSON.stringify(user));
    
    alert('Профиль успешно обновлен!');
    loadUserProfile();
}