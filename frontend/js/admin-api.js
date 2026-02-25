const API_URL = "http://localhost:5000/api";

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...options.headers
    }
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "login.html";
    return;
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "API Error");
  }

  return data;
}