const Payment = require('../models/payment');
const Order = require('../models/order');

// Создать платеж
exports.createPayment = async (req, res) => {
    try {
        const { order_id, amount, payment_method } = req.body;

        // Проверка, существует ли заказ
        const order = await Order.findByPk(order_id);
        if (!order) return res.status(404).json({ message: 'Заказ не найден' });

        const payment = await Payment.create({
            order_id,
            amount,
            payment_method,
            status: 'completed' // по умолчанию можно ставить completed
        });

        res.json({ message: 'Платеж создан', payment });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Получить все платежи
exports.getPayments = async (req, res) => {
    try {
        const payments = await Payment.findAll();
        res.json(payments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Получить платеж по ID
exports.getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findByPk(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Платеж не найден' });
        res.json(payment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
