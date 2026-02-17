const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existing = await User.findOne({ where: { email } });
        if (existing) return res.status(400).json({ message: 'Пользователь уже существует' });

        const user = await User.create({ username, email, password });
        res.json({ message: 'Пользователь создан', user: { id: user.id, username, email } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(400).json({ message: 'Пользователь не найден' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Неверный пароль' });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ message: 'Успешный вход', token });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
