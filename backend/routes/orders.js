// backend/routes/orders.js
import express from "express";
import { sequelize, Order, OrderItem, Product } from "../models/index.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { Op } from "sequelize";

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

    // =========================
    // 🔥 1. Грузим все продукты одним запросом
    // =========================
    const productIds = items.map((i) => i.productId);

    const products = await Product.findAll({
      where: { id: productIds },
      transaction,
    });

    if (products.length !== items.length) {
      await transaction.rollback();
      return res.status(404).json({ message: "Один из товаров не найден" });
    }

    // =========================
    // 💰 2. Считаем цену
    // =========================
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      totalPrice += product.price * item.quantity;
    }

    // =========================
    // ⚡ 3. АТОМАРНО уменьшаем stock
    // =========================
    for (const item of items) {
      const [updatedRows] = await Product.update(
        {
          stock: sequelize.literal(`stock - ${item.quantity}`),
        },
        {
          where: {
            id: item.productId,
            stock: {
              [Op.gte]: item.quantity,
            },
          },
          transaction,
        }
      );

      if (updatedRows === 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Недостаточно товара на складе",
        });
      }
    }

    // =========================
    // 🧾 4. Создаем заказ
    // =========================
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

    // =========================
    // 📦 5. Создаем позиции (БЕЗ лишних запросов)
    // =========================
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);

      await OrderItem.create(
        {
          OrderId: order.id,
          ProductId: product.id,
          quantity: item.quantity,
          price: product.price,
        },
        { transaction }
      );
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