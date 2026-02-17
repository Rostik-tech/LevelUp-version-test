const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Создать платеж
router.post('/', paymentController.createPayment);

// Получить все платежи
router.get('/', paymentController.getPayments);

// Получить платеж по ID
router.get('/:id', paymentController.getPaymentById);

module.exports = router;
