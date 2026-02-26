// ========================================
// Admin Analytics Script
// ========================================

let revenueChart = null;
let currentDateRange = {
    from: null,
    to: null,
    days: 30
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check admin access
    checkAdminAccess();
    
    // Set default date range (last 30 days)
    setDateRange(30);
    
    // Load analytics data
    loadAnalytics();
    
    // Setup event listeners
    setupEventListeners();
});

// Check Admin Access
function checkAdminAccess() {
    const adminPassword = localStorage.getItem('adminPassword');
    
    if (adminPassword !== 'admin123') {
        const password = prompt('Введите пароль администратора:');
        
        if (password === 'admin123') {
            localStorage.setItem('adminPassword', password);
        } else {
            alert('Неверный пароль! Доступ запрещен.');
            window.location.href = 'index.html';
        }
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Apply Filter button
    document.getElementById('applyFilter').addEventListener('click', applyCustomFilter);
    
    // Quick filter buttons
    document.querySelectorAll('.btn-quick').forEach(btn => {
        btn.addEventListener('click', function() {
            const days = parseInt(this.dataset.days);
            setDateRange(days);
            
            // Update active state
            document.querySelectorAll('.btn-quick').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            loadAnalytics();
        });
    });
    
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', loadAnalytics);
    
    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportData);
}

// Set Date Range
function setDateRange(days) {
    const today = new Date();
    const fromDate = new Date();
    fromDate.setDate(today.getDate() - days);
    
    currentDateRange.from = fromDate;
    currentDateRange.to = today;
    currentDateRange.days = days;
    
    // Update date inputs
    document.getElementById('dateFrom').valueAsDate = fromDate;
    document.getElementById('dateTo').valueAsDate = today;
}

// Apply Custom Filter
function applyCustomFilter() {
    const fromInput = document.getElementById('dateFrom').value;
    const toInput = document.getElementById('dateTo').value;
    
    if (!fromInput || !toInput) {
        alert('Пожалуйста, выберите обе даты');
        return;
    }
    
    currentDateRange.from = new Date(fromInput);
    currentDateRange.to = new Date(toInput);
    currentDateRange.days = Math.ceil((currentDateRange.to - currentDateRange.from) / (1000 * 60 * 60 * 24));
    
    // Remove active state from quick filters
    document.querySelectorAll('.btn-quick').forEach(b => b.classList.remove('active'));
    
    loadAnalytics();
}

// Load Analytics Data
function loadAnalytics() {
    showLoader();
    
    // Simulate API call
    setTimeout(() => {
        try {
            const data = generateAnalyticsData();
            
            if (!data || data.orders.length === 0) {
                showError();
                return;
            }
            
            displayKPIs(data);
            displayChart(data);
            displayTopProducts(data);
            
            hideLoader();
        } catch (error) {
            console.error('Error loading analytics:', error);
            showError();
        }
    }, 1000);
}

// Generate Analytics Data (Demo)
function generateAnalyticsData() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    
    // Filter orders by date range
    const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= currentDateRange.from && orderDate <= currentDateRange.to;
    });
    
    // Calculate metrics
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const refundedOrders = filteredOrders.filter(o => o.status === 'refunded');
    const refundAmount = refundedOrders.reduce((sum, order) => sum + order.total, 0);
    const netRevenue = totalRevenue - refundAmount;
    const refundRate = filteredOrders.length > 0 ? (refundedOrders.length / filteredOrders.length * 100) : 0;
    const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;
    
    // Get unique customers
    const uniqueCustomers = new Set(filteredOrders.map(o => o.userId || 'guest')).size;
    
    // Generate daily data for chart
    const dailyData = generateDailyData(filteredOrders);
    
    // Get top products
    const topProducts = getTopProducts(filteredOrders);
    
    return {
        totalRevenue,
        netRevenue,
        orders: filteredOrders.length,
        refundRate: refundRate.toFixed(1),
        avgOrderValue,
        customers: uniqueCustomers,
        dailyData,
        topProducts
    };
}

// Generate Daily Data for Chart
function generateDailyData(orders) {
    const dailyMap = new Map();
    const days = currentDateRange.days;
    
    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
        const date = new Date(currentDateRange.from);
        date.setDate(date.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        dailyMap.set(dateKey, { revenue: 0, orders: 0 });
    }
    
    // Fill with actual data
    orders.forEach(order => {
        const dateKey = new Date(order.date).toISOString().split('T')[0];
        if (dailyMap.has(dateKey)) {
            const day = dailyMap.get(dateKey);
            day.revenue += order.total;
            day.orders += 1;
        }
    });
    
    return Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders
    }));
}

// Get Top Products
function getTopProducts(orders) {
    const productMap = new Map();
    
    orders.forEach(order => {
        order.items.forEach(item => {
            const key = item.id;
            if (productMap.has(key)) {
                const product = productMap.get(key);
                product.units += item.quantity;
                product.revenue += item.price * item.quantity;
            } else {
                productMap.set(key, {
                    id: item.id,
                    name: item.name?.ru || item.name || 'Product',
                    units: item.quantity,
                    revenue: item.price * item.quantity,
                    image: item.image
                });
            }
        });
    });
    
    // Convert to array and sort by revenue
    return Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
}

// Display KPIs
function displayKPIs(data) {
    const currency = localStorage.getItem('currency') || 'usd';
    const symbol = currency === 'usd' ? '$' : '€';
    const rate = currency === 'eur' ? 0.92 : 1;
    
    document.getElementById('totalRevenue').textContent = `${symbol}${(data.totalRevenue * rate).toFixed(0).toLocaleString()}`;
    document.getElementById('netRevenue').textContent = `${symbol}${(data.netRevenue * rate).toFixed(0).toLocaleString()}`;
    document.getElementById('totalOrders').textContent = data.orders;
    document.getElementById('refundRate').textContent = `${data.refundRate}%`;
    document.getElementById('avgOrderValue').textContent = `${symbol}${(data.avgOrderValue * rate).toFixed(0)}`;
    document.getElementById('totalCustomers').textContent = data.customers;
}

// Display Chart
function displayChart(data) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    // Destroy existing chart
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    const labels = data.dailyData.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
    });
    
    const currency = localStorage.getItem('currency') || 'usd';
    const symbol = currency === 'usd' ? '$' : '€';
    const rate = currency === 'eur' ? 0.92 : 1;
    
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Выручка',
                    data: data.dailyData.map(d => (d.revenue * rate).toFixed(2)),
                    borderColor: '#00f0ff',
                    backgroundColor: 'rgba(0, 240, 255, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Заказы',
                    data: data.dailyData.map(d => d.orders),
                    borderColor: '#ff00ff',
                    backgroundColor: 'rgba(255, 0, 255, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 1, 24, 0.95)',
                    titleColor: '#00f0ff',
                    bodyColor: '#ffffff',
                    borderColor: '#ff00ff',
                    borderWidth: 2,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.datasetIndex === 0) {
                                label += symbol + context.parsed.y;
                            } else {
                                label += context.parsed.y;
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: {
                        color: 'rgba(255, 0, 255, 0.1)'
                    },
                    ticks: {
                        color: '#00f0ff',
                        callback: function(value) {
                            return symbol + value;
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        color: '#ff00ff'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 0, 255, 0.1)'
                    },
                    ticks: {
                        color: '#ffffff'
                    }
                }
            }
        }
    });
}

// Display Top Products
function displayTopProducts(data) {
    const tbody = document.getElementById('productsTableBody');
    const currency = localStorage.getItem('currency') || 'usd';
    const symbol = currency === 'usd' ? '$' : '€';
    const rate = currency === 'eur' ? 0.92 : 1;
    
    tbody.innerHTML = data.topProducts.map((product, index) => `
        <tr>
            <td class="product-rank">${index + 1}</td>
            <td class="product-name">${product.name}</td>
            <td class="product-units">${product.units}</td>
            <td class="product-revenue">${symbol}${(product.revenue * rate).toFixed(2)}</td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="viewProduct('${product.id}')">
                    <i class="fas fa-eye"></i>
                    <span data-en="View" data-ru="Просмотр">Просмотр</span>
                </button>
            </td>
        </tr>
    `).join('');
    
    if (data.topProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-gray);">
                    <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 10px; display: block;"></i>
                    <span data-en="No products data" data-ru="Нет данных о товарах">Нет данных о товарах</span>
                </td>
            </tr>
        `;
    }
}

// View Product
function viewProduct(productId) {
    window.location.href = `shop.html?product=${productId}`;
}

// Export Data
function exportData() {
    alert('Функция экспорта данных будет доступна в следующей версии!');
    // TODO: Implement CSV export
}

// Show Loader
function showLoader() {
    document.getElementById('loader').style.display = 'block';
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('analyticsContent').style.display = 'none';
}

// Hide Loader
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
    document.getElementById('analyticsContent').style.display = 'block';
}

// Show Error
function showError() {
    document.getElementById('loader').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'block';
    document.getElementById('analyticsContent').style.display = 'none';
}
