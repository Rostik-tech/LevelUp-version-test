// backend/models/index.js
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

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

// Импорт моделей
import UserModel from "./user.js";
import ProductModel from "./product.js";
import OrderModel from "./order.js";
import OrderItemModel from "./orderItem.js";
import PaymentModel from "./payment.js";

// Инициализация моделей
export const User = UserModel(sequelize);
export const Product = ProductModel(sequelize);
export const Order = OrderModel(sequelize);
export const OrderItem = OrderItemModel(sequelize);
export const Payment = PaymentModel(sequelize);

// ======================
// СВЯЗИ
// ======================

// User → Order
User.hasMany(Order, { onDelete: "CASCADE" });
Order.belongsTo(User);

// Order → OrderItem
Order.hasMany(OrderItem, { onDelete: "CASCADE" });
OrderItem.belongsTo(Order);

// Product → OrderItem
Product.hasMany(OrderItem);
OrderItem.belongsTo(Product);

// User → Payment
User.hasMany(Payment, { onDelete: "CASCADE" });
Payment.belongsTo(User);

// 🔥 Новая связь: Order → Payment
Order.hasOne(Payment, { onDelete: "CASCADE" });
Payment.belongsTo(Order);

export default sequelize;