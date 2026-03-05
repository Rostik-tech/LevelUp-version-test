//  admin-api.js
const API_URL = "http://localhost:5000/api";

// ========================================
// CORE API REQUEST
// ========================================

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("token");

  if (!token) {
    redirectToLogin();
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const isFormData = options.body instanceof FormData;

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        "Authorization": `Bearer ${token}`,
        ...options.headers
      }
    });

    clearTimeout(timeout);

    // ========================================
    // AUTH HANDLING
    // ========================================

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("token");
      redirectToLogin();
      return;
    }

    // ========================================
    // SAFE JSON PARSE
    // ========================================

    let data = null;

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    }

    if (!response.ok) {
      const message =
        data?.message ||
        `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    return data;

  } catch (error) {
    clearTimeout(timeout);

    if (error.name === "AbortError") {
      throw new Error("Request timeout. Please try again.");
    }

    if (!navigator.onLine) {
      throw new Error("No internet connection.");
    }

    throw error;
  }
}

// ========================================
// REDIRECT
// ========================================

function redirectToLogin() {
  window.location.href = "login.html";
}