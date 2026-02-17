const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Создать заказ
router.post('/', orderController.createOrder);

// Получить все заказы
router.get('/', orderController.getOrders);

// Получить заказ по ID
router.get('/:id', orderController.getOrderById);

module.exports = router;
