// backend/routes/orders.js
import express from "express";
import { sequelize, Order, OrderItem, Product } from "../models/index.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// ========================================
// СОЗДАНИЕ ЗАКАЗА
// ========================================
router.post("/", authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();

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

    // ===== ВАЛИДАЦИЯ =====
    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
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
      await transaction.rollback();
      return res.status(400).json({
        message: "Данные доставки заполнены не полностью",
      });
    }

    let totalPrice = 0;

    // ===== ПРОВЕРКА ТОВАРОВ =====
    for (const item of items) {
      const product = await Product.findByPk(item.productId);

      if (!product) {
        await transaction.rollback();
        return res.status(404).json({ message: "Товар не найден" });
      }

      if (product.stock < item.quantity) {
        await transaction.rollback();
        return res
          .status(400)
          .json({ message: "Недостаточно товара на складе" });
      }

      totalPrice += product.price * item.quantity;
    }

    // ===== СОЗДАЕМ ЗАКАЗ =====
    const order = await Order.create(
      {
        UserId: userId,
        totalPrice,
        status: "PENDING",

        shippingFullName,
        shippingPhone,
        shippingCountry,
        shippingCity,
        shippingAddress,
        shippingPostalCode,
        shippingApartment,
      },
      { transaction }
    );

    // ===== СОЗДАЕМ ПОЗИЦИИ =====
    for (const item of items) {
      const product = await Product.findByPk(item.productId);

      await OrderItem.create(
        {
          OrderId: order.id,
          ProductId: product.id,
          quantity: item.quantity,
          price: product.price,
        },
        { transaction }
      );

      // уменьшаем stock
      product.stock -= item.quantity;
      await product.save({ transaction });
    }

    await transaction.commit();

    res.status(201).json({
      message: "Заказ успешно создан",
      order,
    });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ message: err.message });
  }
});

// ========================================
// МОИ ЗАКАЗЫ
// ========================================
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { UserId: req.user.id },
      include: [
        {
          model: OrderItem,
          include: [Product],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========================================
// АДМИН: ВСЕ ЗАКАЗЫ
// ========================================
router.get("/", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Доступ запрещён" });
    }

    const orders = await Order.findAll({
      include: [
        {
          model: OrderItem,
          include: [Product],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;