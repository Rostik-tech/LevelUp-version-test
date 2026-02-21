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

      // 🔒 Теперь строгий ENUM
      status: {
        type: DataTypes.ENUM(
          "pending",
          "paid",
          "processing",
          "shipped",
          "delivered",
          "cancelled"
        ),
        defaultValue: "pending",
        allowNull: false,
      },

      // 🔹 Shipping Information
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