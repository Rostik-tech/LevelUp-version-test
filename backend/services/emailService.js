// services/emailService.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ========================================
// 📧 УВЕДОМЛЕНИЕ О ЗАКАЗЕ (админу)
// ========================================
export const sendOrderNotification = async (order, payment, items) => {
  try {
    if (!process.env.NOTIFY_EMAIL) return;

    const itemsHtml = items.map(item => `
      <li>
        ${item.Product?.name || "Товар"} — 
        ${item.quantity} шт — 
        $${Number(item.price).toFixed(2)}
      </li>
    `).join("");

    const html = `
      <h2>Новый оплаченный заказ</h2>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Total:</strong> $${Number(order.totalPrice).toFixed(2)}</p>
      <ul>${itemsHtml}</ul>
    `;

    const result = await resend.emails.send({
      from: "Level Up <noreply@levelup-gaming.store>",
      to: process.env.NOTIFY_EMAIL,
      subject: `Новый заказ #${order.id}`,
      html,
    });

    console.log("✅ Email sent:", result);

  } catch (err) {
    console.error("❌ Admin email failed:", err.message);
  }
};

// ========================================
// 📧 ИНВОЙС КЛИЕНТУ
// ========================================
export const sendCustomerInvoiceEmail = async (invoice, order, items) => {
  try {
    const itemsHtml = items.map(item => `
      <tr>
        <td>${item.Product?.name || "Product"}</td>
        <td>${item.quantity}</td>
        <td>$${Number(item.price).toFixed(2)}</td>
      </tr>
    `).join("");

    const html = `
      <div style="font-family:Arial,sans-serif;">
        <h2>Level Up Gaming</h2>

        <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>

        <h3>Order Summary</h3>

        <table border="1" cellpadding="5" cellspacing="0">
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Price</th>
          </tr>
          ${itemsHtml}
        </table>

        <h3>Total: $${Number(invoice.totalAmount).toFixed(2)}</h3>

        <p>Thank you for your purchase!</p>
      </div>
    `;

    const result = await resend.emails.send({
      from: "Level Up <noreply@levelup-gaming.store>",
      to: invoice.customerEmail,
      subject: `Your Invoice #${invoice.invoiceNumber}`,
      html,
    });
    console.log("✅ Email sent:", result);

  } catch (err) {
    console.error("❌ Customer email failed:", err.message);
  }
};

// ========================================
// 📧 КОПИЯ ИНВОЙСА (тебе)
// ========================================
export const sendBusinessInvoiceCopy = async (invoice, order, items) => {
  try {
    if (!process.env.BUSINESS_EMAIL) return;

    const html = `
      <h2>INTERNAL INVOICE COPY</h2>
      <p>Invoice #${invoice.invoiceNumber}</p>
      <p>Order ID: ${order.id}</p>
    `;

    const result = await resend.emails.send({
      from: "Level Up <noreply@levelup-gaming.store>",
      to: process.env.BUSINESS_EMAIL,
      subject: `Invoice #${invoice.invoiceNumber}`,
      html,
    });
      console.log("✅ Email sent:", result);
  } catch (err) {
    console.error("❌ Business email failed:", err.message);
  }
};

// ========================================
// 📧 КОНТАКТ ФОРМА
// ========================================
export const sendContactEmail = async ({ name, email, subject, message }) => {
  try {
    const html = `
      <h2>Contact Form</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p>${message}</p>
    `;

    const result = await resend.emails.send({
      from: "Level Up <noreply@levelup-gaming.store>",
      to: process.env.NOTIFY_EMAIL || process.env.EMAIL_USER,
      subject: `Contact: ${subject}`,
      html,
      replyTo: email,
    });
    console.log("✅ Email sent:", result);

  } catch (err) {
    console.error("❌ Contact email failed:", err.message);
  }
};