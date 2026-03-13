import { apiRequest } from "./admin-api.js";
let currentPage = 1;
const allowedTransitions = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  PARTIALLY_REFUNDED: [],
  REFUNDED: []
};
let filters = {
  search: "",
  status: "",
  sort: "date_desc",
  from: "",
  to: "",
  minTotal: "",
  maxTotal: ""
};
const API_URL = "http://localhost:5000";
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

  

  const container = document.getElementById("ordersList");

  const query = new URLSearchParams({
    page: page,
    ...(filters.search && { search: filters.search }),
    ...(filters.status && { status: filters.status }),
    ...(filters.sort && { sort: filters.sort }),
    ...(filters.from && { from: filters.from }),
    ...(filters.to && { to: filters.to }),
    ...(filters.minTotal && { minTotal: filters.minTotal }),
    ...(filters.maxTotal && { maxTotal: filters.maxTotal })
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
<input type="number"
       id="minTotal"
       placeholder="Min $"
       step="0.01"
       value="${filters.minTotal}" />

<input type="number"
       id="maxTotal"
       placeholder="Max $"
       step="0.01"
       value="${filters.maxTotal}" />
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
              <td>
              ${renderStatusDropdown(order)}
              </td>
              <td>${new Date(order.createdAt).toLocaleDateString()}</td>
              <td>
                ${renderRefundButton(order, remaining)}
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
  attachStatusListeners();
}

function attachStatusListeners() {
  document.querySelectorAll(".status-dropdown").forEach(select => {
    select.addEventListener("change", async () => {
      const orderId = select.dataset.id;
      const newStatus = select.value;

      try {
        await apiRequest(`/admin/orders/${orderId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: newStatus })
        });

        await loadOrders(currentPage);

      } catch (err) {
        alert("Status update failed: " + err.message);
        await loadOrders(currentPage);
      }
    });
  });
}

function attachFilterListeners() {
  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const applyBtn = document.getElementById("applyFiltersBtn");
  const sortFilter = document.getElementById("sortFilter");
  const fromDate = document.getElementById("fromDate");
  const toDate = document.getElementById("toDate");
  const minTotal = document.getElementById("minTotal");
  const maxTotal = document.getElementById("maxTotal");

  applyBtn.addEventListener("click", async () => {
    filters.search = searchInput.value.trim();
    filters.status = statusFilter.value;
    filters.sort = sortFilter.value;
    filters.from = fromDate.value;
    filters.to = toDate.value;
    filters.minTotal = minTotal.value;
    filters.maxTotal = maxTotal.value;

  if (filters.minTotal && filters.maxTotal &&
    parseFloat(filters.minTotal) > parseFloat(filters.maxTotal)) {
  alert("Min total cannot exceed Max total");
  return;
}

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

function renderStatusDropdown(order) {
  const current = order.status;
  const transitions = allowedTransitions[current] || [];

  // Если терминальный статус — просто текст
  if (transitions.length === 0) {
    return `<span class="status-badge status-${current.toLowerCase()}">
              ${current}
            </span>`;
  }

  return `
    <select class="status-dropdown"
            data-id="${order.id}"
            data-current="${current}">
      <option value="${current}" selected disabled>
        ${current}
      </option>
      ${transitions.map(status => `
        <option value="${status}">
          ${status}
        </option>
      `).join("")}
    </select>
  `;
}


function renderRefundButton(order, remaining) {

  const allowedStatuses = ["PAID", "PROCESSING", "DELIVERED", "PARTIALLY_REFUNDED"];

  if (!allowedStatuses.includes(order.status)) {
    return "-";
  }

  let warning = "";
  let disabled = "";

  if (order.status === "DELIVERED" && order.deliveredAt) {

    const delivered = new Date(order.deliveredAt);
    const now = new Date();

    const diffDays =
      (now - delivered) / (1000 * 60 * 60 * 24);

    if (diffDays > 21) {
      disabled = "disabled";
      warning = `<div class="refund-warning expired">
                   Refund period expired
                 </div>`;
    }

    else if (diffDays > 14) {
      warning = `<div class="refund-warning support">
                   Customer window expired (support review)
                 </div>`;
    }

  }

  return `
    <div class="refund-wrapper">

      <button class="btn btn-outline refund-btn"
              data-id="${order.id}"
              data-remaining="${remaining}"
              ${disabled}>
        Refund
      </button>

      ${warning}

    </div>
  `;
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
   LOAD PRODUCTS
========================= */

async function loadProducts(page = 1) {

  const container = document.getElementById("ordersList");

  try {

    const response = await apiRequest(`/admin/products?page=${page}`);

    const products = response.data || [];

    container.innerHTML = `
      <h2>Products</h2>

      <button class="btn btn-primary" id="createProductBtn">
        Add Product
      </button>

      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${products.map(product => `
            <tr>
              <td>${product.id}</td>
              <td>${product.name_en}</td>
              <td>$${product.price}</td>
              <td>${product.stock}</td>
              <td>${product.isActive ? "Active" : "Inactive"}</td>

              <td>
                <button class="btn btn-outline edit-product"
                        data-id="${product.id}">
                  Edit
                </button>

                <button class="btn btn-danger delete-product"
                        data-id="${product.id}">
                  Delete
                </button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    attachProductListeners();

    const createBtn = document.getElementById("createProductBtn");

if (createBtn) {
  createBtn.addEventListener("click", openCreateProductModal);
}

  } catch (err) {

    container.innerHTML = `<p>Error: ${err.message}</p>`;

  }

}

/* =========================
   PRODUCT ACTIONS
========================= */

function attachProductListeners() {

  document.querySelectorAll(".delete-product").forEach(btn => {

    btn.addEventListener("click", async () => {

      const id = btn.dataset.id;

      if (!confirm("Archive this product?")) return;

      try {

        await apiRequest(`/admin/products/${id}`, {
          method: "DELETE"
        });

        await loadProducts(currentPage);

      } catch (err) {

        alert("Delete failed: " + err.message);

      }

    });

  });

  document.querySelectorAll(".edit-product").forEach(btn => {

  btn.addEventListener("click", async () => {

    const id = btn.dataset.id;

    try {

      const response = await apiRequest(`/admin/products?page=1`);
      const product = response.data.find(p => p.id == id);

      if (!product) {
        alert("Product not found");
        return;
      }

      openEditProductModal(product);

    } catch (err) {
      alert("Failed to load product");
    }

  });

});

}

/* =========================
   CREATE PRODUCT MODAL
========================= */

function openCreateProductModal() {

  const modal = document.createElement("div");
  modal.className = "refund-modal";

  modal.innerHTML = `
    <div class="refund-modal-content">

      <h3>Create Product</h3>

      <input id="p_name" placeholder="Name" />
      <input id="p_slug" placeholder="Slug" />
      <input id="p_brand" placeholder="Brand" />
      <label class="admin-label">Rarity</label>
      <select id="p_rarity">
<option value="CLASSIC">Classic</option>
<option value="RARE">Rare</option>
<option value="EPIC">Epic</option>
<option value="MYTHIC">Mythic</option>
<option value="LEGENDARY">Legendary</option>
</select>

      <input id="p_price" type="number" placeholder="Price" step="0.01" />

      <textarea id="p_short" placeholder="Short description"></textarea>

      <textarea id="p_long" placeholder="Long description"></textarea>

      <input 
id="p_sizes"
placeholder='Sizes (JSON) e.g. [{"size":"XL","stock":5}]'
/>

      <label class="file-upload">
  Upload images
  <input id="p_images" type="file" multiple hidden>
</label>

      <div class="refund-actions">
        <button class="btn btn-outline" id="cancelCreate">
          Cancel
        </button>

        <button class="btn btn-primary" id="confirmCreate">
          Create
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(modal);

/* RARITY GLOW */

const rarity = document.getElementById("p_rarity");

rarity.addEventListener("change", () => {

  const colors = {
    CLASSIC:"#9ca3af",
    RARE:"#3b82f6",
    EPIC:"#a855f7",
    MYTHIC:"#ef4444",
    LEGENDARY:"#f59e0b"
  };

  rarity.style.borderColor = colors[rarity.value];
  rarity.style.boxShadow = `0 0 10px ${colors[rarity.value]}`;

});

  document.getElementById("cancelCreate").onclick = () => {
    modal.remove();
  };

  document.getElementById("confirmCreate").onclick = async () => {

    try {

      const formData = new FormData();

      formData.append("name_en", document.getElementById("p_name").value);
      formData.append("slug", document.getElementById("p_slug").value);
      formData.append("brand", document.getElementById("p_brand").value);
      formData.append("rarity", document.getElementById("p_rarity").value);
      formData.append("price", document.getElementById("p_price").value);
      formData.append("currency", "USD");

      formData.append("shortDescription_en", document.getElementById("p_short").value);
      formData.append("longDescription_en", document.getElementById("p_long").value);

      formData.append("sizes", document.getElementById("p_sizes").value);

      const files = document.getElementById("p_images").files;

      for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]);
      }

      await apiRequest("/admin/products", {
        method: "POST",
        body: formData
      });

      modal.remove();

      await loadProducts(currentPage);

    } catch (err) {

      alert("Create product failed: " + err.message);

    }
const raritySelect = document.getElementById("p_rarity");


  };

}

function openEditProductModal(product) {

  const modal = document.createElement("div");
  modal.className = "refund-modal";

  modal.innerHTML = `
  <div class="refund-modal-content">

    <h3>Edit Product</h3>

    <div class="product-layout">

  <div class="product-form">

    <div class="product-grid">

      <input id="ep_name_en" value="${product.name_en || ""}" placeholder="Name (EN)"/>
      <input id="ep_name_ru" value="${product.name_ru || ""}" placeholder="Name (RU)"/>
      <input id="ep_name_bg" value="${product.name_bg || ""}" placeholder="Name (BG)"/>

      <input id="ep_slug" value="${product.slug || ""}" placeholder="Slug"/>

      <input id="ep_brand" value="${product.brand || ""}" placeholder="Brand"/>

      <div>
        <label class="admin-label">Rarity</label>

        <select id="ep_rarity">

          <option value="CLASSIC" ${product.rarity === "CLASSIC" ? "selected" : ""}>Classic</option>
          <option value="RARE" ${product.rarity === "RARE" ? "selected" : ""}>Rare</option>
          <option value="EPIC" ${product.rarity === "EPIC" ? "selected" : ""}>Epic</option>
          <option value="MYTHIC" ${product.rarity === "MYTHIC" ? "selected" : ""}>Mythic</option>
          <option value="LEGENDARY" ${product.rarity === "LEGENDARY" ? "selected" : ""}>Legendary</option>

        </select>
      </div>

      <input
        id="ep_price"
        type="number"
        step="0.01"
        value="${product.price || ""}"
        placeholder="Price"
      />

      <input
        id="ep_sizes"
        value='${JSON.stringify(product.sizes || [])}'
        placeholder='Sizes JSON [{"size":"XL","stock":5}]'
      />

    </div>


    <div class="product-descriptions">

  <div class="lang-column">
    <h4>EN</h4>

    <textarea id="ep_short_en" placeholder="Short description">
${product.shortDescription_en || ""}
    </textarea>

    <textarea id="ep_long_en" placeholder="Long description">
${product.longDescription_en || ""}
    </textarea>
  </div>

  <div class="lang-column">
    <h4>RU</h4>

    <textarea id="ep_short_ru" placeholder="Short description RU">
${product.shortDescription_ru || ""}
    </textarea>

    <textarea id="ep_long_ru" placeholder="Long description RU">
${product.longDescription_ru || ""}
    </textarea>
  </div>

  <div class="lang-column">
    <h4>BG</h4>

    <textarea id="ep_short_bg" placeholder="Short description BG">
${product.shortDescription_bg || ""}
    </textarea>

    <textarea id="ep_long_bg" placeholder="Long description BG">
${product.longDescription_bg || ""}
    </textarea>
  </div>

</div>

  </div>


  <div class="product-images">

    <div class="current-images">

      <h4>Current Images</h4>

      <div class="image-grid">

        ${(product.images || []).map((img, index) => `
          <div class="image-item">

            <img src="${API_URL}${img}" />

            <button class="delete-image" data-index="${index}">
              ✕
            </button>

          </div>
        `).join("")}

      </div>

    </div>

    <label class="file-upload">
      Upload images
      <input id="ep_images" type="file" multiple hidden>
    </label>

  </div>

</div>

    <div class="refund-actions">

      <button class="btn btn-outline" id="cancelEdit">
        Cancel
      </button>

      <button class="btn btn-primary" id="confirmEdit">
        Update
      </button>

    </div>

  </div>
  `;

  document.body.appendChild(modal);

  let images = [...(product.images || [])];

  /* DELETE IMAGE */

  document.querySelectorAll(".delete-image").forEach(btn => {

    btn.addEventListener("click", () => {

      const index = btn.dataset.index;

      images.splice(index,1);

      btn.parentElement.remove();

    });

  });

  /* AUTO SLUG */

  const nameInput = document.getElementById("ep_name_en");
const slugInput = document.getElementById("ep_slug");

if (nameInput) {
  nameInput.addEventListener("input", () => {

    slugInput.value = nameInput.value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g,"-")
      .replace(/(^-|-$)/g,"");

  });
}

  /* IMAGE PREVIEW */

  const imageInput = document.getElementById("ep_images");
  const imageGrid = document.querySelector(".image-grid");;

  imageInput.addEventListener("change", () => {

    const files = imageInput.files;

    for (let i = 0; i < files.length; i++) {

      const reader = new FileReader();

      reader.onload = function(e){

        const div = document.createElement("div");
        div.className = "image-item";

        div.innerHTML = `
          <img src="${e.target.result}">
        `;

        imageGrid.appendChild(div);

      };

      reader.readAsDataURL(files[i]);

    }

  });

  /* RARITY GLOW */

  const rarity = document.getElementById("ep_rarity");

  rarity.addEventListener("change", () => {

    const colors = {
      CLASSIC:"#9ca3af",
      RARE:"#3b82f6",
      EPIC:"#a855f7",
      MYTHIC:"#ef4444",
      LEGENDARY:"#f59e0b"
    };

    rarity.style.borderColor = colors[rarity.value];
    rarity.style.boxShadow = `0 0 10px ${colors[rarity.value]}`;

  });

  /* CANCEL */

  document.getElementById("cancelEdit").onclick = () => {
    modal.remove();
  };

  /* UPDATE */

  document.getElementById("confirmEdit").onclick = async () => {

    try {

      const formData = new FormData();

      formData.append("name_en", document.getElementById("ep_name_en").value);
      formData.append("name_ru", document.getElementById("ep_name_ru").value);
      formData.append("name_bg", document.getElementById("ep_name_bg").value);
      formData.append("slug", document.getElementById("ep_slug").value);
      formData.append("brand", document.getElementById("ep_brand").value);
      formData.append("rarity", document.getElementById("ep_rarity").value);
      formData.append("price", document.getElementById("ep_price").value);

      formData.append("currency", "USD");

      formData.append(
"shortDescription_en",
document.getElementById("ep_short_en").value
);

formData.append(
"shortDescription_ru",
document.getElementById("ep_short_ru").value
);

formData.append(
"shortDescription_bg",
document.getElementById("ep_short_bg").value
);

      formData.append(
"longDescription_en",
document.getElementById("ep_long_en").value
);

formData.append(
"longDescription_ru",
document.getElementById("ep_long_ru").value
);

formData.append(
"longDescription_bg",
document.getElementById("ep_long_bg").value
);

      formData.append(
        "sizes",
        document.getElementById("ep_sizes").value
      );

      const files = document.getElementById("ep_images").files;

      formData.append("existingImages", JSON.stringify(images));

      for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]);
      }

      await apiRequest(`/admin/products/${product.id}`, {
        method: "PUT",
        body: formData
      });

      modal.remove();

      await loadProducts(currentPage);

    } catch (err) {

      alert("Update failed: " + err.message);

    }

  };

}



/* =========================
   INIT
========================= */
(async function init() {

  await verifyAdmin();

  const ordersLink = document.querySelector('a[href="#orders"]');
  const productsLink = document.querySelector('a[href="#products"]');

  if (ordersLink) {
    ordersLink.addEventListener("click", (e) => {
      e.preventDefault();
      loadOrders(1);
    });
  }

  if (productsLink) {
    productsLink.addEventListener("click", (e) => {
      e.preventDefault();
      loadProducts(1);
    });
  }

  await loadOrders(currentPage);

})();

const imageGrid = document.getElementById("imageGrid");