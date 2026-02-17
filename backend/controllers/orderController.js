const Order = require('../models/order');
const OrderItem = require('../models/orderItem');
const Product = require('../models/product');

// Создать заказ
exports.createOrder = async (req, res) => {
    try {
        const { user_id, items } = req.body; // items = [{ product_id, quantity }]
        let total = 0;

        // Считаем total
        for (let item of items) {
            const product = await Product.findByPk(item.product_id);
            if (!product) return res.status(404).json({ message: 'Товар не найден' });
            total += product.price * item.quantity;
        }

        // Создаем заказ
        const order = await Order.create({ user_id, total });

        // Создаем order_items
        for (let item of items) {
            const product = await Product.findByPk(item.product_id);
            await OrderItem.create({
                order_id: order.id,
                product_id: product.id,
                quantity: item.quantity,
                price: product.price
            });
        }

        res.json({ message: 'Заказ создан', order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Получить все заказы
exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.findAll();
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Получить заказ по ID
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ message: 'Заказ не найден' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
