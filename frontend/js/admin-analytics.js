// ========================================
// Admin Analytics (PRODUCTION API LAYERED)
// ========================================
import { apiRequest } from "./admin-api.js";

document.addEventListener("DOMContentLoaded", async () => {
    await verifyAdmin(); // 🔥 ДОБАВИЛИ
    init();
});
let revenueChart = null;
let autoRefreshInterval = null;

const state = {
    status: "ALL",
    from: null,
    to: null,
    currency: localStorage.getItem("currency") || "usd",
    isLoading: false
};

async function verifyAdmin() {
    try {
        await apiRequest("/test-admin");
    } catch {
        window.location.href = "login.html";
    }
}
// ========================================
// INIT
// ========================================

document.addEventListener("DOMContentLoaded", init);

function init() {
    cacheDates();
    setDateRange(30);
    setupEventListeners();
    initStatusDropdown();
    loadAnalytics();
    startAutoRefresh();
}

// ========================================
// EVENTS
// ========================================

function setupEventListeners() {
    document.getElementById("applyFilter")
        ?.addEventListener("click", applyCustomFilter);

    document.getElementById("refreshBtn")
        ?.addEventListener("click", loadAnalytics);

    document.getElementById("exportBtn")
        ?.addEventListener("click", exportData);

    document.querySelectorAll(".btn-quick")
        .forEach(btn => {
            btn.addEventListener("click", function () {
                const days = parseInt(this.dataset.days);
                if (!days) return;

                setDateRange(days);

                document.querySelectorAll(".btn-quick")
                    .forEach(b => b.classList.remove("active"));

                this.classList.add("active");
                loadAnalytics();
            });
        });
}

// ========================================
// AUTO REFRESH
// ========================================

function startAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }

    autoRefreshInterval = setInterval(() => {
        if (!state.isLoading) {
            loadAnalytics();
        }
    }, 60000);
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
            state.status = option.dataset.status || "ALL";
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

function cacheDates() {
    state.from = document.getElementById("dateFrom");
    state.to = document.getElementById("dateTo");
}

function setDateRange(days) {
    const today = new Date();
    const from = new Date();
    from.setDate(today.getDate() - days);

    if (state.from) {
        state.from.value = from.toISOString().slice(0, 10);
    }

    if (state.to) {
        state.to.value = today.toISOString().slice(0, 10);
    }
}

function applyCustomFilter() {
    if (!state.from?.value || !state.to?.value) {
        alert("Please select both dates");
        return;
    }

    if (new Date(state.from.value) > new Date(state.to.value)) {
        alert("From date cannot be greater than To date");
        return;
    }

    document.querySelectorAll(".btn-quick")
        .forEach(b => b.classList.remove("active"));

    loadAnalytics();
}

// ========================================
// LOAD ANALYTICS (USING API LAYER)
// ========================================

async function loadAnalytics() {
    if (state.isLoading) return;

    try {
        state.isLoading = true;
        showLoader();

        if (!state.from?.value || !state.to?.value) {
            showError();
            return;
        }

        const fromISO = new Date(state.from.value).toISOString();
        const toISO = new Date(state.to.value).toISOString();

        const query = new URLSearchParams({
            from: fromISO,
            to: toISO,
            ...(state.status !== "ALL" && { status: state.status })
        });

        const data = await apiRequest(`/admin/analytics?${query.toString()}`);

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
    } finally {
        state.isLoading = false;
    }
}

// ========================================
// KPI
// ========================================

function displayKPIs(data) {
    const currency = state.currency;
    const symbol = currency === "usd" ? "$" : "€";
    const rate = currency === "eur" ? 0.92 : 1;

    setText("totalRevenue", `${symbol}${(data.totalRevenue * rate).toFixed(2)}`);
    setText("netRevenue", `${symbol}${(data.netRevenue * rate).toFixed(2)}`);
    setText("totalOrders", data.orders);
    setText("refundRate", `${Number(data.refundRate || 0).toFixed(2)}%`);
    setText("avgOrderValue", `${symbol}${(data.avgOrderValue * rate).toFixed(2)}`);
    setText("totalCustomers", data.customers);

    if (data.comparison) {
        renderGrowth("totalRevenue", data.comparison.revenueGrowth);
        renderGrowth("totalOrders", data.comparison.ordersGrowth);
    }
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// ========================================
// GROWTH
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
    const canvas = document.getElementById("revenueChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (revenueChart) {
        revenueChart.destroy();
        revenueChart = null;
    }

    const currency = state.currency;
    const rate = currency === "eur" ? 0.92 : 1;

    revenueChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: dailyData.map(d =>
                new Date(d.date).toLocaleDateString()
            ),
            datasets: [
                {
                    label: "Revenue",
                    data: dailyData.map(d => Number(d.revenue) * rate),
                    borderColor: "#00f0ff",
                    backgroundColor: "rgba(0,240,255,0.1)",
                    tension: 0.4,
                    fill: true,
                    yAxisID: "y"
                },
                {
                    label: "Orders",
                    data: dailyData.map(d => d.orders),
                    borderColor: "#ff00ff",
                    backgroundColor: "rgba(255,0,255,0.1)",
                    tension: 0.4,
                    fill: false,
                    yAxisID: "y1"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { position: "left" },
                y1: {
                    position: "right",
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

// ========================================
// TABLE
// ========================================

function displayTopProducts(products) {

    const currency = state.currency;
    const rate = currency === "eur" ? 0.92 : 1;
    const symbol = currency === "usd" ? "$" : "€";
    const tbody = document.getElementById("productsTableBody");
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
            <td>${symbol}${(Number(p.revenue) * rate).toFixed(2)}</td>
            <td>
                <button class="btn btn-outline btn-sm"
                    onclick="viewProduct('${p.id}')">
                    View
                </button>
            </td>
        </tr>
    `).join("");
}

function viewProduct(productId) {
    window.location.href = `shop.html?product=${productId}`;
}

// ========================================
// EXPORT
// ========================================

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

    URL.revokeObjectURL(url);
}

// ========================================
// UI
// ========================================

function showLoader() {
    toggleDisplay("loader", true);
    toggleDisplay("analyticsContent", false);
    toggleDisplay("errorMessage", false);
}

function hideLoader() {
    toggleDisplay("loader", false);
    toggleDisplay("analyticsContent", true);
}

function showError() {
    toggleDisplay("loader", false);
    toggleDisplay("analyticsContent", false);
    toggleDisplay("errorMessage", true);
}

function toggleDisplay(id, show) {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = show ? "block" : "none";
    }
}