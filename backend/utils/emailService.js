// backend/utils/emailService.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Проверка соединения при старте
transporter.verify()
  .then(() => console.log("📧 Email transporter ready"))
  .catch(err => console.error("❌ Email transporter error:", err.message));

/**
 * Отправка уведомления админу
 */
export const sendOrderNotification = async (order, payment, items) => {
  if (!process.env.NOTIFY_EMAIL) return;

  const itemsHtml = items.map(item => `
      <li>${item.Product?.name || "Товар"} — ${item.quantity} шт — $${Number(item.price).toFixed(2)}</li>
  `).join("");

  const html = `
    <h2>Новый оплаченный заказ</h2>
    <p><strong>Order ID:</strong> ${order.id}</p>
    <p><strong>Total:</strong> $${Number(order.totalPrice).toFixed(2)}</p>
    <ul>${itemsHtml}</ul>
  `;

  await transporter.sendMail({
    from: `"Level Up Gaming" <${process.env.EMAIL_USER}>`,
    to: process.env.NOTIFY_EMAIL,
    subject: `Новый заказ #${order.id}`,
    html,
  });
};

/**
 * Отправка инвойса клиенту
 */
export const sendCustomerInvoiceEmail = async (invoice, order, items) => {
  const itemsHtml = items.map(item => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;">
          ${item.Product?.name || "Product"}
        </td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;">
          ${item.quantity}
        </td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;">
          $${Number(item.price).toFixed(2)}
        </td>
      </tr>
  `).join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
      <h2 style="color:#6a00ff;">Level Up Gaming</h2>
      <p><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
      <p><strong>Date:</strong> ${new Date(invoice.issued_at).toLocaleDateString()}</p>

      <hr/>

      <h3>Billing Information</h3>
      <p>${order.shippingFullName}</p>
      <p>${order.shippingAddress}</p>
      <p>${order.shippingCity}, ${order.shippingCountry}</p>
      <p>${invoice.customer_email}</p>

      <hr/>

      <h3>Order Summary</h3>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="border:1px solid #ddd;padding:8px;">Product</th>
            <th style="border:1px solid #ddd;padding:8px;">Qty</th>
            <th style="border:1px solid #ddd;padding:8px;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <h3 style="text-align:right;margin-top:20px;">
        Total: $${Number(invoice.total_amount).toFixed(2)}
      </h3>

      <hr/>
      <p style="font-size:12px;color:#666;">
        Thank you for your purchase.
      </p>
    </div>
  `;

  await transporter.sendMail({
  from: `"Level Up Gaming" <${process.env.EMAIL_USER}>`,
  to: invoice.customerEmail,
  subject: `Your Invoice #${invoice.invoiceNumber}`,
  html,
  attachments: [
    {
      filename: `${invoice.invoiceNumber}.pdf`,
      path: invoice.pdfPath,
    },
  ],
});
};