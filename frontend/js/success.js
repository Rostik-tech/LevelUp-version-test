// ========================================
// Production Success Page Script (INVOICE READY)
// ========================================
const API_BASE = "/api";

document.addEventListener("DOMContentLoaded", async function () {
    await handlePaymentSuccess();
});

async function handlePaymentSuccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const paypalToken = urlParams.get("token");
    console.log("PAYPAL TOKEN:", paypalToken);

    if (!paypalToken) {
        redirectToCancel();
        return;
    }

    const token = localStorage.getItem("token");
    console.log("USER TOKEN:", token);

    if (!token) {
        redirectToCancel();
        return;
    }

    try {
        const response = await fetch(
    `${API_BASE}/payments/capture/${paypalToken}`,
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    }
);

console.log("CAPTURE STATUS:", response.status);

const data = await response.json();
console.log("CAPTURE DATA:", data);

        if (!response.ok) {
            redirectToCancel();
            return;
        }

        

        if (!data.order || data.order.status !== "PAID") {
            redirectToCancel();
            return;
        }

        // ✅ Очищаем корзину
        clearCart();

        displayOrderDetails(data.order);

        // ✅ Активируем кнопку скачивания инвойса
        if (data.invoiceNumber) {
            enableInvoiceDownload(data.invoiceNumber);
        }

    } catch (error) {
        console.error("Payment verification error:", error);
        redirectToCancel();
    }
}

// ========================================
// Invoice Download
// ========================================

function enableInvoiceDownload(invoiceNumber) {
    const btn = document.getElementById("downloadInvoiceBtn");
    if (!btn) return;

    btn.style.display = "inline-flex";

    btn.addEventListener("click", async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE}/invoices/${invoiceNumber}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error("Download failed");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `${invoiceNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error("Invoice download error:", err);
            alert("Unable to download invoice");
        }
    });
}

// ========================================
// Clear Cart
// ========================================

function clearCart() {
    localStorage.removeItem("cart");
    localStorage.removeItem("checkoutData"); // 🔥 ДОБАВЬ
}

// ========================================
// Display Order Details
// ========================================

function displayOrderDetails(order) {
    
    const orderNumber = `#ORD-${String(order.id).substring(0, 8).toUpperCase()}`;
    document.querySelector(".order-number").textContent = orderNumber;

    const totalAmount = Number(order.totalPrice);
    document.querySelector(".total-amount").textContent =
    window.formatPrice(totalAmount);
    document.querySelector(".payment-method").textContent = "PayPal";
}

// ========================================
// Redirect
// ========================================

function redirectToCancel() {
    window.location.href = "cancel.html";
}