// ========================================
// My Invoices Page - API Integration
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();
    
    // Load invoices
    loadInvoices();
    
    // Setup retry button
    setupRetryButton();
    
    // Setup language change listener
    setupLanguageListener();
});

// Check if user is authenticated
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!user || !user.username) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
}

// Get JWT token from localStorage
function getJWTToken() {
    // In a real implementation, this would be stored securely
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.token || 'demo-jwt-token'; // Placeholder for demo
}

// Load invoices from API
async function loadInvoices() {
    showLoadingState();
    
    try {
        // Get JWT token
        const token = getJWTToken();
        
        // Make API request
        // In production, this would be: const response = await fetch('/api/invoices', {
        // For now, we'll simulate the API call with localStorage data
        
        const invoices = await fetchInvoicesAPI(token);
        
        if (invoices && invoices.length > 0) {
            displayInvoices(invoices);
        } else {
            showEmptyState();
        }
        
    } catch (error) {
        console.error('Error loading invoices:', error);
        showErrorState(error.message);
    }
}

// Fetch invoices from API (Production implementation)
async function fetchInvoicesAPI(token) {
    // PRODUCTION CODE:
    // const response = await fetch('/api/invoices', {
    //     method: 'GET',
    //     headers: {
    //         'Authorization': `Bearer ${token}`,
    //         'Content-Type': 'application/json'
    //     }
    // });
    //
    // if (!response.ok) {
    //     if (response.status === 401) {
    //         // Unauthorized - redirect to login
    //         window.location.href = 'login.html';
    //         throw new Error('Unauthorized');
    //     }
    //     throw new Error(`HTTP error! status: ${response.status}`);
    // }
    //
    // const data = await response.json();
    // return data.invoices;
    
    // DEMO: Simulate API call with localStorage data
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                const invoices = generateDemoInvoices();
                resolve(invoices);
            } catch (err) {
                reject(err);
            }
        }, 1000); // Simulate network delay
    });
}

// Generate demo invoices from localStorage orders
function generateDemoInvoices() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    
    if (!orders || orders.length === 0) {
        return [];
    }
    
    // Convert orders to invoices
    const invoices = orders.map(order => {
        return {
            invoiceId: `INV-${String(order.id).padStart(8, '0')}`,
            orderId: `#ORD-${String(order.id).slice(0, 8).toUpperCase()}`,
            date: order.date || new Date().toISOString(),
            total: order.total || 0,
            status: order.status === 'refunded' ? 'refunded' : 'paid',
            currency: order.currency || 'usd'
        };
    });
    
    return invoices;
}

// Display invoices in table
function displayInvoices(invoices) {
    const tableBody = document.getElementById('invoicesTableBody');
    const invoicesTable = document.getElementById('invoicesTable');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Get current language and currency
    const lang = localStorage.getItem('language') || 'ru';
    const currency = localStorage.getItem('currency') || 'usd';
    
    // Add rows
    invoices.forEach(invoice => {
        const row = createInvoiceRow(invoice, lang, currency);
        tableBody.appendChild(row);
    });
    
    // Show table, hide loading/error/empty states
    hideAllStates();
    invoicesTable.style.display = 'block';
}

// Create invoice table row
function createInvoiceRow(invoice, lang, currency) {
    const row = document.createElement('tr');
    
    // Invoice Number
    const invoiceNumberCell = document.createElement('td');
    invoiceNumberCell.setAttribute('data-label', lang === 'en' ? 'Invoice #' : 'Счет №');
    invoiceNumberCell.innerHTML = `<span class="invoice-number">${invoice.invoiceId}</span>`;
    
    // Order Number
    const orderNumberCell = document.createElement('td');
    orderNumberCell.setAttribute('data-label', lang === 'en' ? 'Order #' : 'Заказ №');
    orderNumberCell.innerHTML = `<span class="order-number">${invoice.orderId}</span>`;
    
    // Date
    const dateCell = document.createElement('td');
    dateCell.setAttribute('data-label', lang === 'en' ? 'Date' : 'Дата');
    dateCell.innerHTML = `<span class="invoice-date">${formatDate(invoice.date, lang)}</span>`;
    
    // Total
    const totalCell = document.createElement('td');
    totalCell.setAttribute('data-label', lang === 'en' ? 'Total' : 'Сумма');
    totalCell.innerHTML = `<span class="invoice-total">${formatCurrency(invoice.total, currency)}</span>`;
    
    // Status
    const statusCell = document.createElement('td');
    statusCell.setAttribute('data-label', lang === 'en' ? 'Status' : 'Статус');
    statusCell.innerHTML = `<span class="status-badge ${invoice.status}">${getStatusText(invoice.status, lang)}</span>`;
    
    // Action
    const actionCell = document.createElement('td');
    actionCell.setAttribute('data-label', lang === 'en' ? 'Action' : 'Действие');
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'download-btn';
    downloadBtn.innerHTML = `
        <i class="fas fa-download"></i>
        <span>${lang === 'en' ? 'Download PDF' : 'Скачать PDF'}</span>
    `;
    downloadBtn.addEventListener('click', () => downloadInvoice(invoice));
    actionCell.appendChild(downloadBtn);
    
    // Append cells to row
    row.appendChild(invoiceNumberCell);
    row.appendChild(orderNumberCell);
    row.appendChild(dateCell);
    row.appendChild(totalCell);
    row.appendChild(statusCell);
    row.appendChild(actionCell);
    
    return row;
}

// Format date
function formatDate(dateString, lang) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    
    if (lang === 'ru') {
        return date.toLocaleDateString('ru-RU', options);
    } else {
        return date.toLocaleDateString('en-US', options);
    }
}

// Format currency
function formatCurrency(amount, currency) {
    const exchangeRate = 0.92; // 1 USD = 0.92 EUR
    
    if (currency === 'eur') {
        const eurAmount = (amount * exchangeRate).toFixed(2);
        return `€${eurAmount}`;
    } else {
        return `$${amount.toFixed(2)}`;
    }
}

// Get status text
function getStatusText(status, lang) {
    const statusTexts = {
        'paid': { en: 'PAID', ru: 'ОПЛАЧЕНО' },
        'refunded': { en: 'REFUNDED', ru: 'ВОЗВРАТ' },
        'pending': { en: 'PENDING', ru: 'В ОЖИДАНИИ' }
    };
    
    return statusTexts[status]?.[lang] || status.toUpperCase();
}

// Download invoice PDF
async function downloadInvoice(invoice) {
    try {
        // Get JWT token
        const token = getJWTToken();
        
        // PRODUCTION CODE:
        // const response = await fetch(`/api/invoices/${invoice.invoiceId}/download`, {
        //     method: 'GET',
        //     headers: {
        //         'Authorization': `Bearer ${token}`
        //     }
        // });
        //
        // if (!response.ok) {
        //     throw new Error('Failed to download invoice');
        // }
        //
        // const blob = await response.blob();
        // const url = window.URL.createObjectURL(blob);
        // const a = document.createElement('a');
        // a.href = url;
        // a.download = `${invoice.invoiceId}.pdf`;
        // document.body.appendChild(a);
        // a.click();
        // window.URL.revokeObjectURL(url);
        // document.body.removeChild(a);
        
        // DEMO: Show notification
        const lang = localStorage.getItem('language') || 'ru';
        const message = lang === 'en' 
            ? `Invoice ${invoice.invoiceId} download started...` 
            : `Загрузка счета ${invoice.invoiceId} начата...`;
        
        showNotification(message, 'success');
        
        // In production, the actual PDF download would happen here
        console.log('Download invoice:', invoice.invoiceId);
        
    } catch (error) {
        console.error('Error downloading invoice:', error);
        const lang = localStorage.getItem('language') || 'ru';
        const message = lang === 'en' 
            ? 'Failed to download invoice. Please try again.' 
            : 'Не удалось загрузить счет. Пожалуйста, попробуйте снова.';
        
        showNotification(message, 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Use main.js notification system if available
    if (typeof window.showNotification === 'function') {
        window.showNotification(message);
    } else {
        alert(message);
    }
}

// State management functions
function showLoadingState() {
    hideAllStates();
    document.getElementById('loadingState').style.display = 'block';
}

function showErrorState(message = null) {
    hideAllStates();
    const errorState = document.getElementById('errorState');
    errorState.style.display = 'block';
    
    if (message) {
        const errorMessage = document.getElementById('errorMessage');
        const lang = localStorage.getItem('language') || 'ru';
        errorMessage.textContent = message;
    }
}

function showEmptyState() {
    hideAllStates();
    document.getElementById('emptyState').style.display = 'block';
}

function hideAllStates() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'none';
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('invoicesTable').style.display = 'none';
}

// Setup retry button
function setupRetryButton() {
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
        retryBtn.addEventListener('click', loadInvoices);
    }
}

// Setup language change listener
function setupLanguageListener() {
    // Listen for custom language change event
    window.addEventListener('languageChanged', function() {
        // Reload invoices to update text
        const invoicesTable = document.getElementById('invoicesTable');
        if (invoicesTable.style.display !== 'none') {
            loadInvoices();
        }
    });
}

// Export functions for testing (optional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadInvoices,
        fetchInvoicesAPI,
        generateDemoInvoices,
        formatDate,
        formatCurrency,
        getStatusText,
        downloadInvoice
    };
}
