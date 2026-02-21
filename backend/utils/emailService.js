import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOrderNotification = async (order, payment, items) => {
  const itemsHtml = items
    .map(
      (item) => `
      <li>
        ${item.Product.name} — ${item.quantity} шт. — $${item.price}
      </li>
    `
    )
    .join("");

  const html = `
    <h2>Новый оплаченный заказ</h2>
    <p><strong>Order ID:</strong> ${order.id}</p>
    <p><strong>Сумма:</strong> $${order.totalPrice}</p>

    <h3>Данные клиента:</h3>
    <p><strong>Имя:</strong> ${order.shippingFullName}</p>
    <p><strong>Телефон:</strong> ${order.shippingPhone}</p>
    <p><strong>Страна:</strong> ${order.shippingCountry}</p>
    <p><strong>Город:</strong> ${order.shippingCity}</p>
    <p><strong>Адрес:</strong> ${order.shippingAddress}</p>
    <p><strong>Индекс:</strong> ${order.shippingPostalCode}</p>
    <p><strong>Квартира:</strong> ${order.shippingApartment || "-"}</p>

    <h3>Товары:</h3>
    <ul>
      ${itemsHtml}
    </ul>

    <p><strong>Метод оплаты:</strong> ${payment.method}</p>
  `;

  await transporter.sendMail({
    from: `"Shop System" <${process.env.EMAIL_USER}>`,
    to: process.env.NOTIFY_EMAIL,
    subject: `Новый заказ #${order.id}`,
    html,
  });
};