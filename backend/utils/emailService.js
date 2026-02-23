// backend/utils/emailService.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false, // true если 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Отправка уведомления о новом оплаченном заказе
 */
export const sendOrderNotification = async (order, payment, items) => {
  try {
    if (!process.env.NOTIFY_EMAIL) {
      console.warn("⚠ NOTIFY_EMAIL не указан");
      return;
    }

    const itemsHtml = items
      .map((item) => {
        const productName = item.Product?.name || "Товар";
        const quantity = item.quantity || 0;
        const price = Number(item.price || 0).toFixed(2);

        return `
          <li>
            ${productName} — ${quantity} шт. — $${price}
          </li>
        `;
      })
      .join("");

    const html = `
      <h2>Новый оплаченный заказ</h2>

      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Сумма:</strong> $${Number(order.totalPrice).toFixed(2)}</p>
      <p><strong>Статус:</strong> ${order.status}</p>

      <hr>

      <h3>Данные клиента:</h3>
      <p><strong>Имя:</strong> ${order.shippingFullName}</p>
      <p><strong>Телефон:</strong> ${order.shippingPhone}</p>
      <p><strong>Страна:</strong> ${order.shippingCountry}</p>
      <p><strong>Город:</strong> ${order.shippingCity}</p>
      <p><strong>Адрес:</strong> ${order.shippingAddress}</p>
      <p><strong>Индекс:</strong> ${order.shippingPostalCode}</p>
      <p><strong>Квартира:</strong> ${order.shippingApartment || "-"}</p>

      <hr>

      <h3>Товары:</h3>
      <ul>
        ${itemsHtml}
      </ul>

      <hr>

      <p><strong>Метод оплаты:</strong> ${payment.method}</p>
      <p><strong>Payment status:</strong> ${payment.status}</p>
    `;

    await transporter.sendMail({
      from: `"Shop System" <${process.env.EMAIL_USER}>`,
      to: process.env.NOTIFY_EMAIL,
      subject: `Новый заказ #${order.id}`,
      html,
    });

    console.log("📧 Email отправлен успешно");
  } catch (error) {
    console.error("❌ Ошибка отправки email:", error.message);
  }
};