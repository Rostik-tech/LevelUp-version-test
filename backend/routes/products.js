const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Создать товар
router.post('/', productController.createProduct);

// Получить все товары
router.get('/', productController.getProducts);

module.exports = router;
