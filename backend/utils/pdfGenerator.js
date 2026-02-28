import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const generateInvoicePDF = async (invoice, order, items) => {
  return new Promise((resolve, reject) => {
    const invoicesDir = path.join("uploads", "invoices");

    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    const filePath = path.join(
      invoicesDir,
      `${invoice.invoiceNumber}.pdf`
    );

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // HEADER
    doc.fontSize(20).text("Level Up Gaming", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Invoice #: ${invoice.invoiceNumber}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Order ID: ${order.id}`);
    doc.moveDown();

    doc.text("Customer:");
    doc.text(order.shippingFullName);
    doc.text(order.shippingAddress);
    doc.text(`${order.shippingCity}, ${order.shippingCountry}`);
    doc.moveDown();

    doc.text("Items:");
    doc.moveDown();

    items.forEach((item) => {
      doc.text(
        `${item.Product?.name} - ${item.quantity} x $${Number(
          item.price
        ).toFixed(2)}`
      );
    });

    doc.moveDown();
    doc.fontSize(14).text(
      `Total: $${Number(invoice.totalAmount).toFixed(2)}`,
      { align: "right" }
    );

    doc.end();

    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};