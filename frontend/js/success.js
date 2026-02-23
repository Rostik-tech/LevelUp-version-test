// ========================================
// Production Success Page Script
// ========================================

document.addEventListener("DOMContentLoaded", async function () {
    await handlePaymentSuccess();
});

async function handlePaymentSuccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const paypalToken = urlParams.get("token");

    if (!paypalToken) {
        redirectToCancel();
        return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
        redirectToCancel();
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:5000/api/payments/capture/${paypalToken}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            redirectToCancel();
            return;
        }

        const data = await response.json();

        if (!data.order || data.order.status !== "PAID") {
            redirectToCancel();
            return;
        }

        displayOrderDetails(data.order);

    } catch (error) {
        console.error("Payment verification error:", error);
        redirectToCancel();
    }
}

// ========================================
// Display Order Details
// ========================================

function displayOrderDetails(order) {
    const currency = localStorage.getItem("currency") || "usd";
    const currencySymbol = currency === "usd" ? "$" : "€";
    const exchangeRate = currency === "eur" ? 0.92 : 1;

    const orderNumber = `#ORD-${String(order.id).substring(0, 8).toUpperCase()}`;
    document.querySelector(".order-number").textContent = orderNumber;

    const totalAmount = (order.totalPrice * exchangeRate).toFixed(2);
    document.querySelector(".total-amount").textContent = `${currencySymbol}${totalAmount}`;

    document.querySelector(".payment-method").textContent = "PayPal";
}

// ========================================
// Redirect
// ========================================

function redirectToCancel() {
    window.location.href = "cancel.html";
}
