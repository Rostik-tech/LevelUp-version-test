// server.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const { sequelize } = require('./models');

// Маршруты
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Тестовый роут
app.get('/', (req, res) => {
    res.send('Сервер работает!');
});

// API маршруты
app.use('/api/auth', authRoutes);       // регистрация / логин
app.use('/api/products', productRoutes); // товары
app.use('/api/orders', orderRoutes);    // заказы
app.use('/api/payments', paymentRoutes); // платежи

// Синхронизация базы данных
sequelize.sync({ alter: true })
    .then(() => console.log('База данных синхронизирована'))
    .catch(err => console.log('Ошибка синхронизации:', err));

// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
