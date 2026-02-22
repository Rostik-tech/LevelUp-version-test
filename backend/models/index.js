// backend/models/index.js
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// ======================
// SEQUELIZE INIT
// ======================

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "postgres",
    logging: false,
  }
);

// ======================
// IMPORT MODELS
// ======================

import UserModel from "./user.js";
import ProductModel from "./product.js";
import OrderModel from "./order.js";
import OrderItemModel from "./orderItem.js";
import PaymentModel from "./payment.js";

// ======================
// INIT MODELS
// ======================

export const User = UserModel(sequelize);
export const Product = ProductModel(sequelize);
export const Order = OrderModel(sequelize);
export const OrderItem = OrderItemModel(sequelize);
export const Payment = PaymentModel(sequelize);

// ======================
// RELATIONS (EXPLICIT FOREIGN KEYS)
// ======================

// User → Orders
User.hasMany(Order, {
  foreignKey: "UserId",
  onDelete: "CASCADE",
});
Order.belongsTo(User, {
  foreignKey: "UserId",
});

// Order → OrderItems
Order.hasMany(OrderItem, {
  foreignKey: "OrderId",
  onDelete: "CASCADE",
});
OrderItem.belongsTo(Order, {
  foreignKey: "OrderId",
});

// Product → OrderItems
Product.hasMany(OrderItem, {
  foreignKey: "ProductId",
});
OrderItem.belongsTo(Product, {
  foreignKey: "ProductId",
});

// User → Payments
User.hasMany(Payment, {
  foreignKey: "UserId",
  onDelete: "CASCADE",
});
Payment.belongsTo(User, {
  foreignKey: "UserId",
});

// Order → Payment (1:1)
Order.hasOne(Payment, {
  foreignKey: "OrderId",
  onDelete: "CASCADE",
});
Payment.belongsTo(Order, {
  foreignKey: "OrderId",
});

export default sequelize;