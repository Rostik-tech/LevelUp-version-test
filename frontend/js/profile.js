// ========================================
// Profile Page - Backend Connected Version
// ========================================

const API_BASE = "https://www.levelup-gaming.store/api";

document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    await loadUserProfile();
    await loadUserStats();

    document
        .getElementById("profileForm")
        ?.addEventListener("submit", handleProfileUpdate);
});

// ========================================
// Load Profile From Backend
// ========================================
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE}/users/me`, {
            headers: {
                Authorization: "Bearer " + localStorage.getItem("token"),
            },
        });

        if (!response.ok) {
            throw new Error("Ошибка загрузки профиля");
        }

        const user = await response.json();

        document.getElementById("profileName").textContent =
            user.name || "Пользователь";

        document.getElementById("profileEmail").textContent =
            user.email || "user@example.com";

        document.getElementById("profileName").textContent =
    user.username || "Пользователь";

document.getElementById("fullNameInput").value =
    user.username || "";

    } catch (error) {
        console.error("PROFILE LOAD ERROR:", error.message);
    }
}

// ========================================
// Load Stats From Backend
// ========================================
async function loadUserStats() {
    try {
        const response = await fetch(`${API_BASE}/orders/my`, {
            headers: {
                Authorization: "Bearer " + localStorage.getItem("token"),
            },
        });

        if (!response.ok) return;

        const orders = await response.json();

        const totalOrders = orders.length;

        const totalSpent = orders.reduce(
            (sum, order) => sum + Number(order.totalPrice || 0),
            0
        );

        document.getElementById("totalOrders").textContent = totalOrders;

        document.getElementById("totalSpent").textContent =
            "$" + totalSpent.toFixed(2);

    } catch (error) {
        console.error("STATS LOAD ERROR:", error.message);
    }
}

// ========================================
// Profile Update (Disabled Until API Ready)
// ========================================
async function handleProfileUpdate(e) {
    e.preventDefault();

    alert(
        "Редактирование профиля будет доступно после реализации backend endpoint."
    );
}