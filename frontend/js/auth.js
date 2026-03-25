//  auth.js
export function getToken() {
    return localStorage.getItem("token");
}

export function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}

export function requireAuth() {
    const token = getToken();

    if (!token) {
        window.location.href = "login.html";
    }
}

export function getUserFromToken() {
    const token = getToken();
    if (!token) return null;

    try {
        if (!token.includes(".")) return null;

        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
    } catch {
        return null;
    }
}