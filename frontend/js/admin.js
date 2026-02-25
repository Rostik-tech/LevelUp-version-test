const API_URL = "http://localhost:5000/api";

/* =========================
   API HELPER
========================= */
async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "index.html";
    return;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (res.status === 401 || res.status === 403) {
    window.location.href = "index.html";
    return;
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "API Error");
  }

  return data;
}

/* =========================
   SERVER-SIDE ADMIN CHECK
========================= */
async function verifyAdmin() {
  try {
    await apiRequest("/test-admin");
  } catch (err) {
    window.location.href = "index.html";
  }
}

/* =========================
   NAVIGATION
========================= */
function setupNavigation() {
  const links = document.querySelectorAll(".admin-menu-link");

  links.forEach(link => {
    link.addEventListener("click", async (e) => {
      e.preventDefault();

      links.forEach(l => l.classList.remove("active"));
      link.classList.add("active");

      const section = link.getAttribute("href").replace("#", "");
      await loadSection(section);
    });
  });
}

/* =========================
   LOAD SECTION
========================= */
async function loadSection(section) {
  const container = document.querySelector(".admin-main");

  try {

    if (section === "orders") {
      const orders = await apiRequest("/admin/orders");
      renderOrders(container, orders);
    }

    if (section === "products") {
      const products = await apiRequest("/admin/products");
      renderProducts(container, products);
    }

    if (section === "users") {
      const users = await apiRequest("/admin/users");
      renderUsers(container, users);
    }

  } catch (err) {
    container.innerHTML = `<p>Ошибка: ${err.message}</p>`;
  }
}

/* =========================
   RENDER ORDERS + REFUND
========================= */
function renderOrders(container, orders) {
  container.innerHTML = `
    <h2>Orders</h2>
    ${orders.length === 0 ? "<p>No orders</p>" : ""}
    ${orders.map(order => `
      <div class="admin-card">
        <strong>Order #${order.id}</strong>
        <p>Status: ${order.status}</p>
        <p>User: ${order.User?.email || ""}</p>
        <p>Total: ${order.totalPrice}</p>

        ${
          order.status === "PAID" ||
          order.status === "PARTIALLY_REFUNDED"
            ? `<button class="refund-btn btn btn-outline" data-id="${order.id}">
                Refund
               </button>`
            : ""
        }
      </div>
    `).join("")}
  `;

  document.querySelectorAll(".refund-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const orderId = btn.dataset.id;

      const amount = prompt("Enter refund amount (leave empty for full refund):");
      const reason = prompt("Reason (optional):");

      try {
        await apiRequest(`/admin/orders/${orderId}/refund`, {
          method: "POST",
          body: JSON.stringify({
            amount: amount || undefined,
            reason: reason || undefined,
          }),
        });

        alert("Refund successful");
        await loadSection("orders");

      } catch (err) {
        alert("Refund failed: " + err.message);
      }
    });
  });
}

/* =========================
   RENDER PRODUCTS
========================= */
function renderProducts(container, products) {
  container.innerHTML = `
    <h2>Products</h2>
    ${products.map(p => `
      <div class="admin-card">
        <strong>${p.name}</strong>
        <p>Stock: ${p.stock}</p>
        <p>Price: ${p.price}</p>
      </div>
    `).join("")}
  `;
}

/* =========================
   RENDER USERS
========================= */
function renderUsers(container, users) {
  container.innerHTML = `
    <h2>Users</h2>
    ${users.map(u => `
      <div class="admin-card">
        <strong>${u.username}</strong>
        <p>${u.email}</p>
        <p>${u.role}</p>
      </div>
    `).join("")}
  `;
}

/* =========================
   INIT
========================= */
(async function init() {
  await verifyAdmin();
  setupNavigation();

  // Автоматически грузим Orders при открытии
  await loadSection("orders");
})();