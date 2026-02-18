// backend/routes/orders.js
import express from "express";
import { Order, OrderItem, Product } from "../models/index.js";
import { authenticateToken } from "../middleware/authMiddleware.js";


const router = express.Router();

// Создание заказа
router.post("/", authenticateToken, async (req, res) => {

  try {
    const userId = req.user.id;
    const { items } = req.body;

    const order = await Order.create({ UserId: userId });

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

    res.json({ message: "Заказ создан", order });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Получение всех заказов пользователя
router.get("/user/:userId", async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { UserId: req.params.userId },
      include: [OrderItem],
    });
    res.json(orders);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
