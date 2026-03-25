// ========================================
// My Invoices - Production Version
// ========================================

const API_BASE = "/api";
document.addEventListener("DOMContentLoaded", () => {
  init();
});

function init() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  setupRetryButton();
  loadInvoices();
}

// ========================================
// LOAD INVOICES
// ========================================

async function loadInvoices() {
  showLoadingState();

  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${API_BASE}/invoices`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch invoices");
    }

    const invoices = await response.json();

    if (!invoices.length) {
      showEmptyState();
      return;
    }

    renderInvoices(invoices);

  } catch (error) {
    console.error("Load invoices error:", error);
    showErrorState("Failed to load invoices");
  }
}

// ========================================
// RENDER TABLE
// ========================================

function renderInvoices(invoices) {
  const tableBody = document.getElementById("invoicesTableBody");
  tableBody.innerHTML = "";

  invoices.forEach((invoice) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${invoice.invoiceNumber}</td>
      <td>#${invoice.orderId}</td>
      <td>${new Date(invoice.createdAt).toLocaleDateString()}</td>
      <td>$${Number(invoice.totalAmount).toFixed(2)} ${invoice.currency}</td>
      <td>
        <span class="status-badge status-${invoice.status.toLowerCase()}">
          ${invoice.status}
        </span>
      </td>
      <td>
        <button class="download-btn" data-invoice="${invoice.invoiceNumber}">
          <i class="fas fa-download"></i> PDF
        </button>
      </td>
    `;

    tableBody.appendChild(row);
  });

  attachDownloadEvents();

  hideAllStates();
  document.getElementById("invoicesTable").style.display = "block";
}

// ========================================
// DOWNLOAD PDF
// ========================================

function attachDownloadEvents() {
  document.querySelectorAll(".download-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const invoiceNumber = btn.dataset.invoice;
      await downloadInvoice(invoiceNumber);
    });
  });
}

async function downloadInvoice(invoiceNumber) {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(
      `${API_BASE}/invoices/${invoiceNumber}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Download failed");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoiceNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Download error:", error);
    alert("Failed to download invoice");
  }
}

// ========================================
// STATES
// ========================================

function showLoadingState() {
  hideAllStates();
  document.getElementById("loadingState").style.display = "block";
}

function showErrorState(message) {
  hideAllStates();
  document.getElementById("errorState").style.display = "block";
  document.getElementById("errorMessage").textContent = message;
}

function showEmptyState() {
  hideAllStates();
  document.getElementById("emptyState").style.display = "block";
}

function hideAllStates() {
  document.getElementById("loadingState").style.display = "none";
  document.getElementById("errorState").style.display = "none";
  document.getElementById("emptyState").style.display = "none";
  document.getElementById("invoicesTable").style.display = "none";
}

// ========================================
// RETRY BUTTON
// ========================================

function setupRetryButton() {
  const retryBtn = document.getElementById("retryBtn");
  if (retryBtn) {
    retryBtn.addEventListener("click", loadInvoices);
  }
}