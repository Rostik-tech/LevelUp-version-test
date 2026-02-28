// backend/models/index.js

import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

/* ======================
   SEQUELIZE INIT
====================== */

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

/* ======================
   IMPORT MODEL FACTORIES
====================== */

import UserModel from "./user.js";
import ProductModel from "./product.js";
import OrderModel from "./order.js";
import OrderItemModel from "./orderItem.js";
import PaymentModel from "./payment.js";
import RefundModel from "./refund.js";
import ReviewModel from "./review.js";
import InvoiceModel from "./Invoice.js";

/* ======================
   INIT MODELS
====================== */

export const User = UserModel(sequelize);
export const Product = ProductModel(sequelize);
export const Order = OrderModel(sequelize);
export const OrderItem = OrderItemModel(sequelize);
export const Payment = PaymentModel(sequelize);
export const Refund = RefundModel(sequelize);
export const Review = ReviewModel(sequelize);
export const Invoice = InvoiceModel(sequelize);

/* ======================
   RELATIONS
====================== */

/* -------- User -------- */

User.hasMany(Order, { foreignKey: "UserId", onDelete: "CASCADE" });
Order.belongsTo(User, { foreignKey: "UserId" });

User.hasMany(Payment, { foreignKey: "UserId", onDelete: "CASCADE" });
Payment.belongsTo(User, { foreignKey: "UserId" });

User.hasMany(Review, { foreignKey: "UserId", onDelete: "CASCADE" });
Review.belongsTo(User, { foreignKey: "UserId" });

/* -------- Orders -------- */

Order.hasMany(OrderItem, { foreignKey: "OrderId", onDelete: "CASCADE" });
OrderItem.belongsTo(Order, { foreignKey: "OrderId" });

Order.hasOne(Payment, { foreignKey: "OrderId", onDelete: "CASCADE" });
Payment.belongsTo(Order, { foreignKey: "OrderId" });

Order.hasOne(Invoice, { foreignKey: "orderId", onDelete: "CASCADE" });
Invoice.belongsTo(Order, { foreignKey: "orderId" });

/* -------- Products -------- */

Product.hasMany(OrderItem, { foreignKey: "ProductId" });
OrderItem.belongsTo(Product, { foreignKey: "ProductId" });

Product.hasMany(Review, { foreignKey: "ProductId", onDelete: "CASCADE" });
Review.belongsTo(Product, { foreignKey: "ProductId" });

/* -------- Payments -------- */

Payment.hasMany(Refund, { foreignKey: "PaymentId", onDelete: "CASCADE" });
Refund.belongsTo(Payment, { foreignKey: "PaymentId" });

export default sequelize;