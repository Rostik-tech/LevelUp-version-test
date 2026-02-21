// backend/routes/orders.js
import express from "express";
import { Order, OrderItem, Product } from "../models/index.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Создание заказа
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      items,
      shippingFullName,
      shippingPhone,
      shippingCountry,
      shippingCity,
      shippingAddress,
      shippingPostalCode,
      shippingApartment,
    } = req.body;

    // 🔴 Базовая валидация
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Корзина пуста" });
    }

    if (
      !shippingFullName ||
      !shippingPhone ||
      !shippingCountry ||
      !shippingCity ||
      !shippingAddress ||
      !shippingPostalCode
    ) {
      return res.status(400).json({ message: "Данные доставки заполнены не полностью" });
    }

    // Создаём заказ сразу с shipping
    const order = await Order.create({
      UserId: userId,
      shippingFullName,
      shippingPhone,
      shippingCountry,
      shippingCity,
      shippingAddress,
      shippingPostalCode,
      shippingApartment,
      status: "pending",
    });

    let totalPrice = 0;

    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      if (!product) continue;

      const price = product.price * item.quantity;
      totalPrice += price;

      await OrderItem.create({
        OrderId: order.id,
        ProductId: product.id,
        quantity: item.quantity,
        price,
      });
    }

    order.totalPrice = totalPrice;
    await order.save();

    res.status(201).json({ message: "Заказ создан", order });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// ✅ Получение заказов текущего пользователя (без дыры)
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { UserId: req.user.id },
      include: [OrderItem],
      order: [["createdAt", "DESC"]],
    });

    res.json(orders);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;