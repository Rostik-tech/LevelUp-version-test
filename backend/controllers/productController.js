const Product = require('../models/product');

exports.createProduct = async (req, res) => {
    const { name, description, price, stock } = req.body;
    try {
        const product = await Product.create({ name, description, price, stock });
        res.json({ message: 'Товар создан', product });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getProducts = async (req, res) => {
    try {
        const products = await Product.findAll();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
