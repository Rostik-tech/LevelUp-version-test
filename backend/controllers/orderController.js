// backend/controllers/orderController.js
import { sequelize } from "../models/index.js";
import { Order, OrderItem, Product } from "../models/index.js";

// ======================
// СОЗДАТЬ ЗАКАЗ
// ======================
export const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { items, shipping } = req.body;

    if (!items || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "Корзина пуста" });
    }

    let totalPrice = 0;

    // Проверяем товары и считаем сумму
    for (const item of items) {
      const product = await Product.findByPk(item.productId);

      if (!product) {
        await transaction.rollback();
        return res.status(404).json({ message: "Товар не найден" });
      }

      if (product.stock < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({ message: "Недостаточно товара на складе" });
      }

      totalPrice += product.price * item.quantity;
    }

    // Создаем заказ (PENDING)
    const order = await Order.create(
      {
        UserId: req.user.id,
        totalPrice,
        status: "PENDING",

        shippingFullName: shipping?.fullName,
        shippingPhone: shipping?.phone,
        shippingCountry: shipping?.country,
        shippingCity: shipping?.city,
        shippingAddress: shipping?.address,
        shippingPostalCode: shipping?.postalCode,
        shippingApartment: shipping?.apartment,
      },
      { transaction }
    );

    // Создаем позиции заказа
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
    }

    await transaction.commit();

    res.status(201).json({
      message: "Заказ создан",
      order,
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
};

// ======================
// ПОЛУЧИТЬ ВСЕ ЗАКАЗЫ (админ)
// ======================
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [OrderItem],
      order: [["createdAt", "DESC"]],
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================
// ПОЛУЧИТЬ МОИ ЗАКАЗЫ
// ======================
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { UserId: req.user.id },
      include: [OrderItem],
      order: [["createdAt", "DESC"]],
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================
// ПОЛУЧИТЬ ЗАКАЗ ПО ID
// ======================
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [OrderItem],
    });

    if (!order) {
      return res.status(404).json({ message: "Заказ не найден" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};