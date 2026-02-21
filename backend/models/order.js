// backend/models/order.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define(
    "Order",
    {
      totalPrice: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        allowNull: false,
      },

      // ⚠️ Пока оставляем STRING (не ENUM), чтобы не ломать существующие записи
      status: {
        type: DataTypes.STRING,
        defaultValue: "pending",
        allowNull: false,
      },

      // 🔹 Shipping Information (временно allowNull: true)
      shippingFullName: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      shippingPhone: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      shippingCountry: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      shippingCity: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      shippingAddress: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      shippingPostalCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      shippingApartment: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    { timestamps: true }
  );
};