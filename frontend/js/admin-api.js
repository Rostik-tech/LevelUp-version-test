//  admin-api.js
const API_URL = "https://levelup-version-test-production.up.railway.app/api";

// ========================================
// CORE API REQUEST
// ========================================

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("token");

  if (!token) {
    redirectToLogin();
    throw new Error("No token");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const isFormData = options.body instanceof FormData;

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        Authorization: `Bearer ${token}`,
        ...options.headers
      }
    });

    clearTimeout(timeout);

    // 🔥 ЖЁСТКАЯ ПРОВЕРКА AUTH
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("token");
      redirectToLogin();
      throw new Error("Unauthorized");
    }

    let data = null;

    if (res.headers.get("content-type")?.includes("application/json")) {
      data = await res.json();
    }

    if (!res.ok) {
      throw new Error(data?.message || `Error ${res.status}`);
    }

    return data;

  } catch (err) {
    clearTimeout(timeout);

    if (err.name === "AbortError") {
      throw new Error("Request timeout");
    }

    if (!navigator.onLine) {
      throw new Error("No internet connection");
    }

    throw err;
  }
}

// ========================================
// REDIRECT
// ========================================

function redirectToLogin() {
  window.location.href = "login.html";
}