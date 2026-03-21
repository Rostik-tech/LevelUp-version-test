import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const generateInvoicePDF = async (invoice, order, items) => {
  return new Promise((resolve, reject) => {
    try {
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

      // ===== DEBUG =====
      console.log("====== ORDER DEBUG ======");
      console.log("Full Name:", order.shippingFullName);
      console.log("Address:", order.shippingAddress);
      console.log("City:", order.shippingCity);
      console.log("Country:", order.shippingCountry);
      console.log("====== END DEBUG ======");

      // ===== FONTS (FIX КИРИЛЛИЦЫ) =====
      const fontRegular = path.join("fonts", "Roboto-Regular.ttf");
      const fontBold = path.join("fonts", "Roboto-Bold.ttf");

      if (fs.existsSync(fontRegular)) {
        doc.registerFont("Regular", fontRegular);
      }

      if (fs.existsSync(fontBold)) {
        doc.registerFont("Bold", fontBold);
      }

      doc.font("Regular");

      // ===== LOGO =====
      const logoPath = path.join("uploads", "logo.png");
      if (fs.existsSync(logoPath)) {
  const logoWidth = 90;

  const pageWidth = doc.page.width;

  const x = (pageWidth - logoWidth) / 2; // центр по горизонтали
  const y = 22; // отступ сверху

  doc.image(logoPath, x, y, { width: logoWidth });
}

      // ===== HEADER =====
      doc
        .font("Bold")
        .fontSize(20)
        .text("INVOICE", 400, 50, { align: "right" });

      doc.font("Regular");

      // ===== COMPANY =====
      doc
        .fontSize(10)
        .text("Level Up Gaming", 50, 120)
        .text("Email: support@levelup.com");

      // ===== LINE =====
      doc.moveTo(50, 150).lineTo(550, 150).stroke();

      // ===== CUSTOMER =====
      doc
        .fontSize(12)
        .text("Bill To:", 50, 170)
        .fontSize(10)
        .text(order.shippingFullName || "")
        .text(order.shippingAddress || "")
        .text(
          `${order.shippingCity || ""}, ${order.shippingCountry || ""}`
        );

      // ===== INVOICE INFO =====
      doc
        .fontSize(12)
        .text(`Invoice #: ${invoice.invoiceNumber}`, 400, 170, {
          align: "right",
        })
        .text(`Date: ${new Date().toLocaleDateString()}`, {
          align: "right",
        })
        .text(`Order ID: ${order.id}`, { align: "right" });

      // ===== TABLE =====
      const tableTop = 260;

      doc.fontSize(10);

      doc.text("Item", 50, tableTop);
      doc.text("Qty", 300, tableTop);
      doc.text("Price", 350, tableTop);
      doc.text("Total", 450, tableTop);

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      let y = tableTop + 25;

      items.forEach((item) => {
        const name =
          item.Product?.name_en ||
          item.name_en ||
          "Product";

        const quantity = item.quantity || 0;
        const price = Number(item.price || 0);
        const total = quantity * price;

        doc.text(name, 50, y);
        doc.text(quantity.toString(), 300, y);
        doc.text(`$${price.toFixed(2)}`, 350, y);
        doc.text(`$${total.toFixed(2)}`, 450, y);

        y += 20;
      });

      // ===== TOTAL =====
      doc.moveTo(300, y + 10).lineTo(550, y + 10).stroke();

      doc
        .fontSize(12)
        .text(
          `Total: $${Number(invoice.totalAmount || 0).toFixed(2)}`,
          400,
          y + 20,
          { align: "right" }
        );

      // ===== FOOTER =====
      doc
        .fontSize(10)
        .text("Thank you for your purchase!", 50, 720, {
          align: "center",
        });

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
};