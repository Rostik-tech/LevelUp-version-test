import { apiRequest } from "./admin-api.js";

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
async function loadOrders() {
  const container = document.querySelector(".admin-main");

  try {
    const response = await apiRequest("/admin/orders");
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
          const remaining =
            parseFloat(order.totalPrice) -
            parseFloat(order.refundedAmount || 0);

          return `
            <tr>
              <td>${order.id}</td>
              <td>${order.User?.email || "-"}</td>
              <td>$${order.totalPrice}</td>
              <td>$${order.refundedAmount || 0}</td>
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
      Page ${meta.page} of ${meta.pages}
    </div>
  `;

  attachRefundListeners();
}

/* =========================
   REFUND
========================= */
function attachRefundListeners() {
  document.querySelectorAll(".refund-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const orderId = btn.dataset.id;
      const remaining = parseFloat(btn.dataset.remaining);

      const amount = prompt(
        `Enter refund amount (max ${remaining}):`
      );

      if (!amount) return;

      if (parseFloat(amount) > remaining) {
        alert("Refund exceeds remaining amount");
        return;
      }

      try {
        await apiRequest(`/admin/orders/${orderId}/refund`, {
          method: "POST",
          body: JSON.stringify({
            amount: parseFloat(amount)
          }),
        });

        alert("Refund successful");
        await loadOrders();

      } catch (err) {
        alert("Refund failed: " + err.message);
      }
    });
  });
}

/* =========================
   INIT
========================= */
(async function init() {
  await verifyAdmin();
  await loadOrders();
})();