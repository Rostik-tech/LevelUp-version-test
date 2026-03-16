// controllers/invoiceController.js
import { Invoice, OrderItem, Product } from "../models/index.js";
import { generateInvoiceNumber } from "../utils/invoiceNumber.js";
import { generateInvoicePDF } from "../utils/pdfGenerator.js";
import { sendCustomerInvoiceEmail } from "../services/emailService.js";

/**
 * Создание инвойса для заказа
 */
export const createInvoiceForOrder = async (order) => {
  try {
    // Проверяем существование инвойса
    const existingInvoice = await Invoice.findOne({
      where: { orderId: order.id },
    });

    if (existingInvoice) {
      return existingInvoice;
    }

    const user = await order.getUser();

    const invoice = await Invoice.create({
      orderId: order.id,
      invoiceNumber: generateInvoiceNumber(order.id),
      customerEmail: user.email,
      totalAmount: Number(order.totalPrice),
      currency: "EUR",
    });

    const fullItems = await OrderItem.findAll({
      where: { OrderId: order.id },
      include: [Product],
    });

    const pdfPath = await generateInvoicePDF(
      invoice,
      order,
      fullItems
    );

    invoice.pdfPath = pdfPath;
    await invoice.save();
     console.log("Sending invoice to:", invoice.customerEmail);
    await sendCustomerInvoiceEmail(invoice, order, fullItems);

    return invoice;

  } catch (error) {
    console.error("Invoice creation error:", error.message);
    return null;
  }
};