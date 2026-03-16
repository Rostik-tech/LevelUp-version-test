// controllers/productController.js

import { Product } from "../models/index.js";


/* ============================
   CREATE PRODUCT
============================ */
export const createProduct = async (req, res) => {
  try {
    const data = { ...req.body };

    // Автоматический пересчёт stock из sizes
    if (data.sizes && Array.isArray(data.sizes)) {
      data.stock = data.sizes.reduce(
        (total, item) => total + (item.stock || 0),
        0
      );
    }

    const product = await Product.create(data);

    return res.status(201).json({
      message: "Product created successfully",
      product
    });

  } catch (err) {

    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "Slug already exists"
      });
    }

    if (err.name === "SequelizeValidationError") {
      return res.status(400).json({
        message: err.errors.map(e => e.message)
      });
    }

    console.error("CREATE PRODUCT ERROR:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};


/* ============================
   GET ALL ACTIVE PRODUCTS
============================ */
export const getProducts = async (req, res) => {
  try {

    const { rarity, lang = "en" } = req.query;
    

    const where = {
      isActive: true
    };

    if (rarity && rarity !== "ALL") {
      where.rarity = rarity;
    }

    const products = await Product.findAll({
      where,
      order: [["createdAt", "DESC"]]
    });

    const localizedProducts = await Promise.all(
      products.map(async (p) => {

        const name =
          lang === "ru"
            ? p.name_ru
            : lang === "bg"
            ? p.name_bg
            : p.name_en;

        const shortDescription =
          lang === "ru"
            ? p.shortDescription_ru
            : lang === "bg"
            ? p.shortDescription_bg
            : p.shortDescription_en;

        const price = Number(p.price);
        return {
          id: p.id,
          name,
          slug: p.slug,
          price,
          currency: "EUR",
          shortDescription,
          images: p.images,
          rarity: p.rarity
        };

      })
    );

    return res.json(localizedProducts);

  } catch (err) {
    console.error("GET PRODUCTS ERROR:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};


/* ============================
   GET PRODUCT BY ID
============================ */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({
      where: { id, isActive: true }
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    return res.json(product);

  } catch (err) {
    console.error("GET PRODUCT ERROR:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};


/* ============================
   GET PRODUCT BY SLUG
============================ */
export const getProductBySlug = async (req, res) => {

  try {

    const { slug } = req.params;
    const { lang = "en" } = req.query;

    const product = await Product.findOne({
      where: { slug, isActive: true }
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const name =
      lang === "ru"
        ? product.name_ru
        : lang === "bg"
        ? product.name_bg
        : product.name_en;

    const shortDescription =
      lang === "ru"
        ? product.shortDescription_ru
        : lang === "bg"
        ? product.shortDescription_bg
        : product.shortDescription_en;

    const longDescription =
      lang === "ru"
        ? product.longDescription_ru
        : lang === "bg"
        ? product.longDescription_bg
        : product.longDescription_en;

    const price = Number(product.price);

    return res.json({
      id: product.id,
      name,
      slug: product.slug,
      price,
      currency: "EUR",
      shortDescription,
      longDescription,
      images: product.images,
      rarity: product.rarity,
      sizes: product.sizes
    });

  } catch (err) {

    console.error("GET PRODUCT BY SLUG ERROR:", err.message);
    return res.status(500).json({ message: "Server error" });

  }

};


/* ============================
   UPDATE PRODUCT
============================ */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Если обновляются sizes — пересчитываем stock
    if (data.sizes && Array.isArray(data.sizes)) {
      data.stock = data.sizes.reduce(
        (total, item) => total + (item.stock || 0),
        0
      );
    }

    await product.update(data);

    return res.json({
      message: "Product updated successfully",
      product
    });

  } catch (err) {

    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "Slug already exists"
      });
    }

    if (err.name === "SequelizeValidationError") {
      return res.status(400).json({
        message: err.errors.map(e => e.message)
      });
    }

    console.error("UPDATE PRODUCT ERROR:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};


/* ============================
   TOGGLE ACTIVE STATUS
============================ */
export const toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.isActive = !product.isActive;
    await product.save();

    return res.json({
      message: "Product status updated",
      isActive: product.isActive
    });

  } catch (err) {
    console.error("TOGGLE PRODUCT ERROR:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};


/* ============================
   VALIDATE PRODUCT SIZE
============================ */
export const validateProductSize = async (req, res) => {
  try {
    const { id } = req.params;
    const { size, quantity } = req.body;

    if (!size || !quantity || quantity <= 0) {
      return res.status(400).json({
        valid: false,
        message: "Size and quantity are required"
      });
    }

    const product = await Product.findOne({
      where: { id, isActive: true }
    });

    if (!product) {
      return res.status(404).json({
        valid: false,
        message: "Product not available"
      });
    }

    if (product.sizes && product.sizes.length > 0) {

      const sizeObj = product.sizes.find(s => s.size === size);

      if (!sizeObj) {
        return res.status(400).json({
          valid: false,
          message: "Selected size does not exist"
        });
      }

      if (sizeObj.stock < quantity) {
        return res.status(400).json({
          valid: false,
          message: "Not enough stock for selected size"
        });
      }

    } else {

      if (product.stock < quantity) {
        return res.status(400).json({
          valid: false,
          message: "Not enough stock"
        });
      }
    }

    return res.json({ valid: true });

  } catch (err) {
    console.error("VALIDATE PRODUCT ERROR:", err.message);
    return res.status(500).json({
      valid: false,
      message: "Server error"
    });
  }
};