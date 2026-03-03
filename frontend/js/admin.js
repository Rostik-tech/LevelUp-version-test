import { apiRequest } from "./admin-api.js";
let currentPage = 1;
let filters = {
  search: "",
  status: "",
  sort: "date_desc",
  from: "",
  to: ""
};
/* =========================
   VERIFY ADMIN
========================= */
async function verifyAdmin() {
  try {
    await apiRequest("/test-admin");
  } catch {
    window.location.href = "login.html";
  }
}

/* =========================
   LOAD ORDERS
========================= */
async function loadOrders(page = 1) {
  currentPage = page;

  const container = document.querySelector(".admin-main");

  const query = new URLSearchParams({
    page: page,
    ...(filters.search && { search: filters.search }),
    ...(filters.status && { status: filters.status }),
    ...(filters.sort && { sort: filters.sort }),
    ...(filters.from && { from: filters.from }),
    ...(filters.to && { to: filters.to })
  }).toString();

  try {
    const response = await apiRequest(`/admin/orders?${query}`);
    renderOrders(container, response);
  } catch (err) {
    container.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

/* =========================
   RENDER ORDERS
========================= */
function renderOrders(container, response) {
  const orders = response.data;
  const meta = response.meta;

  container.innerHTML = `
  

<div class="orders-filters">
  <input type="text" id="searchInput" 
         placeholder="Search by ID or email"
         value="${filters.search}" />

  <select id="statusFilter">
    <option value="">All Statuses</option>
    <option value="PENDING" ${filters.status === "PENDING" ? "selected" : ""}>PENDING</option>
    <option value="PAID" ${filters.status === "PAID" ? "selected" : ""}>PAID</option>
    <option value="PARTIALLY_REFUNDED" ${filters.status === "PARTIALLY_REFUNDED" ? "selected" : ""}>PARTIALLY_REFUNDED</option>
    <option value="REFUNDED" ${filters.status === "REFUNDED" ? "selected" : ""}>REFUNDED</option>
  </select>
  <select id="sortFilter">
  <option value="date_desc" ${filters.sort === "date_desc" ? "selected" : ""}>
    Newest First
  </option>
  <option value="date_asc" ${filters.sort === "date_asc" ? "selected" : ""}>
    Oldest First
  </option>
  <option value="price_desc" ${filters.sort === "price_desc" ? "selected" : ""}>
    Highest Price
  </option>
  <option value="price_asc" ${filters.sort === "price_asc" ? "selected" : ""}>
    Lowest Price
  </option>
</select>

<input type="date" 
       id="fromDate"
       value="${filters.from}" />

<input type="date" 
       id="toDate"
       value="${filters.to}" />

  <button class="btn btn-primary" id="applyFiltersBtn">
    Apply
  </button>
</div>
    <h2>Orders</h2>

    <table class="admin-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>User</th>
          <th>Total</th>
          <th>Refunded</th>
          <th>Status</th>
          <th>Date</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${orders.map(order => {
          const remaining = (
  Number(order.totalPrice) -
  Number(order.refundedAmount || 0)
).toFixed(2);

          return `
            <tr>
              <td>${order.id}</td>
              <td>${order.User?.email || "-"}</td>
              <td>$${Number(order.totalPrice).toFixed(2)}</td>
              <td>$${Number(order.refundedAmount || 0).toFixed(2)}</td>
              <td>${order.status}</td>
              <td>${new Date(order.createdAt).toLocaleDateString()}</td>
              <td>
                ${
                  order.status === "PAID" ||
                  order.status === "PARTIALLY_REFUNDED"
                    ? `<button class="btn btn-outline refund-btn"
                         data-id="${order.id}"
                         data-remaining="${remaining}">
                         Refund
                       </button>`
                    : "-"
                }
              </td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>

    <div class="pagination">
  ${generatePagination(meta.page, meta.pages)}
</div>
  `;


  attachRefundListeners();
  attachPaginationListeners();
  attachFilterListeners();
}

function attachFilterListeners() {
  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const applyBtn = document.getElementById("applyFiltersBtn");
  const sortFilter = document.getElementById("sortFilter");
  const fromDate = document.getElementById("fromDate");
  const toDate = document.getElementById("toDate");

  applyBtn.addEventListener("click", async () => {
    filters.search = searchInput.value.trim();
    filters.status = statusFilter.value;
    filters.sort = sortFilter.value;
    filters.from = fromDate.value;
    filters.to = toDate.value;

    if (filters.from && filters.to && filters.from > filters.to) {
  alert("From date cannot be greater than To date");
  return;
}

    await loadOrders(1); // всегда начинаем с 1 страницы
  });
}

function attachPaginationListeners() {
  document.querySelectorAll(".page-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const page = btn.dataset.page;
      await loadOrders(page);
    });
  });
}

function generatePagination(currentPage, totalPages) {
  if (totalPages <= 1) return "";

  let buttons = `<div class="pagination-wrapper">`;

  if (currentPage > 1) {
    buttons += `
      <button class="page-btn nav-btn" data-page="${currentPage - 1}">
        <i class="fas fa-chevron-left"></i>
      </button>
    `;
  }

  for (let i = 1; i <= totalPages; i++) {
    buttons += `
      <button class="page-btn ${i === currentPage ? "active" : ""}" 
              data-page="${i}">
        ${i}
      </button>
    `;
  }

  if (currentPage < totalPages) {
    buttons += `
      <button class="page-btn nav-btn" data-page="${currentPage + 1}">
        <i class="fas fa-chevron-right"></i>
      </button>
    `;
  }

  buttons += `</div>`;

  return buttons;
}

/* =========================
   REFUND
========================= */
function attachRefundListeners() {
  document.querySelectorAll(".refund-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
  const orderId = btn.dataset.id;
  const remaining = parseFloat(btn.dataset.remaining);

  openRefundModal(orderId, remaining);
});
  });
}

function openRefundModal(orderId, remaining) {
  const modal = document.createElement("div");
  modal.className = "refund-modal";

  modal.innerHTML = `
    <div class="refund-modal-content">
      <h3>Refund Order #${orderId}</h3>

      <p>Remaining amount: $${remaining}</p>

      <input type="number" 
             id="refundAmount"
             placeholder="Enter amount"
             max="${remaining}"
             min="0.01"
             step="0.01" />

      <textarea id="refundReason"
                placeholder="Reason (optional)"></textarea>

      <div class="refund-actions">
        <button class="btn btn-outline" id="cancelRefund">
          Cancel
        </button>
        <button class="btn btn-primary" id="confirmRefund">
          Confirm Refund
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("cancelRefund").onclick = () => {
    modal.remove();
  };

  document.getElementById("confirmRefund").onclick = async () => {
    const amountInput = document.getElementById("refundAmount");
    const reasonInput = document.getElementById("refundReason");

    const amount = parseFloat(amountInput.value);

    if (!amount || amount <= 0) {
      alert("Invalid amount");
      return;
    }

    if (amount > remaining) {
      alert("Amount exceeds remaining balance");
      return;
    }

    try {
      await apiRequest(`/admin/orders/${orderId}/refund`, {
        method: "POST",
        body: JSON.stringify({
          amount,
          reason: reasonInput.value || undefined
        }),
      });

      modal.remove();
      await loadOrders(currentPage);

    } catch (err) {
      alert("Refund failed: " + err.message);
    }
  };
}

/* =========================
   INIT
========================= */
(async function init() {
  await verifyAdmin();
  await loadOrders(currentPage);
})();