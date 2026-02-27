// ========================================
// Admin Analytics (PRODUCTION STABLE VERSION)
// ========================================

let revenueChart = null;
let selectedStatus = "ALL";

// ========================================
// INIT
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAccess();
    setDateRange(30);
    setupEventListeners();
    initStatusDropdown();
    loadAnalytics();
    setInterval(loadAnalytics, 60000);
});

// ========================================
// ADMIN CHECK (JWT)
// ========================================

function checkAdminAccess() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Access denied");
        window.location.href = "login.html";
    }
}

// ========================================
// EVENTS
// ========================================

function setupEventListeners() {
    document.getElementById('applyFilter')
        ?.addEventListener('click', applyCustomFilter);

    document.getElementById('refreshBtn')
        ?.addEventListener('click', loadAnalytics);

    document.getElementById('exportBtn')
        ?.addEventListener('click', exportData);

    document.querySelectorAll('.btn-quick')
        .forEach(btn => {
            btn.addEventListener('click', function () {
                const days = parseInt(this.dataset.days);
                if (!days) return;

                setDateRange(days);

                document.querySelectorAll('.btn-quick')
                    .forEach(b => b.classList.remove('active'));

                this.classList.add('active');
                loadAnalytics();
            });
        });
}

// ========================================
// STATUS DROPDOWN
// ========================================

function initStatusDropdown() {
    const statusBtn = document.getElementById("statusBtn");
    const statusMenu = document.getElementById("statusMenu");
    const statusOptions = document.querySelectorAll(".status-option");
    const selectedText = document.getElementById("selectedStatusText");

    if (!statusBtn || !statusMenu) return;

    statusBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        statusMenu.classList.toggle("show");
    });

    statusOptions.forEach(option => {
        option.addEventListener("click", () => {
            selectedStatus = option.dataset.status;
            selectedText.textContent = option.textContent;
            statusMenu.classList.remove("show");
            loadAnalytics();
        });
    });

    document.addEventListener("click", (e) => {
        if (!statusBtn.contains(e.target) &&
            !statusMenu.contains(e.target)) {
            statusMenu.classList.remove("show");
        }
    });
}

// ========================================
// DATE RANGE
// ========================================

function setDateRange(days) {
    const today = new Date();
    const from = new Date();
    from.setDate(today.getDate() - days);

    const fromInput = document.getElementById('dateFrom');
    const toInput = document.getElementById('dateTo');

    if (fromInput) {
        fromInput.value = from.toISOString().slice(0, 10);
    }

    if (toInput) {
        toInput.value = today.toISOString().slice(0, 10);
    }
}

function applyCustomFilter() {
    const fromInput = document.getElementById('dateFrom');
    const toInput = document.getElementById('dateTo');

    if (!fromInput?.value || !toInput?.value) {
        alert("Please select both dates");
        return;
    }

    if (new Date(fromInput.value) > new Date(toInput.value)) {
        alert("From date cannot be greater than To date");
        return;
    }

    document.querySelectorAll('.btn-quick')
        .forEach(b => b.classList.remove('active'));

    loadAnalytics();
}

// ========================================
// LOAD FROM BACKEND
// ========================================

async function loadAnalytics() {
    try {
        showLoader();

        const token = localStorage.getItem("token");

        const fromInput = document.getElementById('dateFrom');
        const toInput = document.getElementById('dateTo');

        if (!fromInput?.value || !toInput?.value) {
            showError();
            return;
        }

        const fromISO = new Date(fromInput.value).toISOString();
        const toISO = new Date(toInput.value).toISOString();

        let url = `http://localhost:5000/api/admin/analytics?from=${fromISO}&to=${toISO}`;

        if (selectedStatus !== "ALL") {
            url += `&status=${selectedStatus}`;
        }

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) throw new Error("Failed to load analytics");

        const data = await response.json();

        if (!data?.dailyData) {
            showError();
            return;
        }

        displayKPIs(data);
        displayChart(data.dailyData);
        displayTopProducts(data.topProducts || []);

        hideLoader();

    } catch (error) {
        console.error("Analytics error:", error);
        showError();
    }
}

// ========================================
// KPI
// ========================================

function displayKPIs(data) {
    const currency = localStorage.getItem("currency") || "usd";
    const symbol = currency === "usd" ? "$" : "€";
    const rate = currency === "eur" ? 0.92 : 1;

    document.getElementById('totalRevenue').textContent =
        `${symbol}${(data.totalRevenue * rate).toFixed(2)}`;

    document.getElementById('netRevenue').textContent =
        `${symbol}${(data.netRevenue * rate).toFixed(2)}`;

    document.getElementById('totalOrders').textContent =
        data.orders;

    document.getElementById('refundRate').textContent =
        `${Number(data.refundRate || 0).toFixed(2)}%`;

    document.getElementById('avgOrderValue').textContent =
        `${symbol}${(data.avgOrderValue * rate).toFixed(2)}`;

    document.getElementById('totalCustomers').textContent =
        data.customers;

    if (data.comparison) {
        renderGrowth("totalRevenue", data.comparison.revenueGrowth);
        renderGrowth("totalOrders", data.comparison.ordersGrowth);
    }
}

// ========================================
// GROWTH DISPLAY
// ========================================

function renderGrowth(elementId, growthValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const parent = element.closest(".kpi-content");
    if (!parent) return;

    let growthEl = parent.querySelector(".kpi-growth");

    if (!growthEl) {
        growthEl = document.createElement("div");
        growthEl.className = "kpi-growth";
        parent.appendChild(growthEl);
    }

    const value = Number(growthValue || 0).toFixed(2);

    if (growthValue > 0) {
        growthEl.innerHTML = `↑ ${value}%`;
        growthEl.style.color = "#00ff99";
    } else if (growthValue < 0) {
        growthEl.innerHTML = `↓ ${Math.abs(value)}%`;
        growthEl.style.color = "#ff4d4d";
    } else {
        growthEl.innerHTML = `0%`;
        growthEl.style.color = "#999";
    }
}

// ========================================
// CHART
// ========================================

function displayChart(dailyData) {
    const ctx = document.getElementById('revenueChart')?.getContext('2d');
    if (!ctx) return;

    if (revenueChart) revenueChart.destroy();

    const currency = localStorage.getItem("currency") || "usd";
    const rate = currency === "eur" ? 0.92 : 1;

    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dailyData.map(d =>
                new Date(d.date).toLocaleDateString()
            ),
            datasets: [
                {
                    label: 'Revenue',
                    data: dailyData.map(d => Number(d.revenue) * rate),
                    borderColor: '#00f0ff',
                    backgroundColor: 'rgba(0,240,255,0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Orders',
                    data: dailyData.map(d => d.orders),
                    borderColor: '#ff00ff',
                    backgroundColor: 'rgba(255,0,255,0.1)',
                    tension: 0.4,
                    fill: false,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { position: 'left' },
                y1: {
                    position: 'right',
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

// ========================================
// TABLE + EXPORT + UI
// ========================================

function displayTopProducts(products) {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    if (!products.length) {
        tbody.innerHTML =
            `<tr><td colspan="5" style="text-align:center;padding:30px;">No data</td></tr>`;
        return;
    }

    tbody.innerHTML = products.map((p, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${p.name}</td>
            <td>${p.units}</td>
            <td>$${Number(p.revenue).toFixed(2)}</td>
            <td>
                <button class="btn btn-outline btn-sm"
                    onclick="viewProduct('${p.id}')">
                    View
                </button>
            </td>
        </tr>
    `).join('');
}

function viewProduct(productId) {
    window.location.href = `shop.html?product=${productId}`;
}

function exportData() {
    if (!revenueChart) {
        alert("No data to export");
        return;
    }

    const rows = [["Date", "Revenue", "Orders"]];

    revenueChart.data.labels.forEach((label, index) => {
        const revenue = revenueChart.data.datasets[0].data[index];
        const orders = revenueChart.data.datasets[1].data[index];
        rows.push([label, revenue, orders]);
    });

    const csvContent = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "analytics_export.csv";
    link.click();
}

function showLoader() {
    document.getElementById('loader').style.display = 'block';
    document.getElementById('analyticsContent').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'none';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
    document.getElementById('analyticsContent').style.display = 'block';
}

function showError() {
    document.getElementById('loader').style.display = 'none';
    document.getElementById('analyticsContent').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'block';
}