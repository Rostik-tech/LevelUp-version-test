import express from "express";
import { Invoice } from "../models/index.js";
import { Order } from "../models/index.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔒 Только авторизованный пользователь
router.get("/:invoiceNumber", authenticateToken, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      where: { invoiceNumber: req.params.invoiceNumber },
      include: {
        model: Order,
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Проверка владельца
    if (invoice.Order.UserId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.download(invoice.pdfPath);

  } catch (err) {
    console.error("Invoice download error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;