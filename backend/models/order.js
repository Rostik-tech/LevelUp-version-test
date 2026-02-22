// backend/models/order.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define(
    "Order",
    {
      totalPrice: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },

      // 🔒 ENUM в UPPERCASE (совпадает с БД)
      status: {
        type: DataTypes.ENUM(
          "PENDING",
          "PAID",
          "PROCESSING",
          "SHIPPED",
          "DELIVERED",
          "CANCELLED"
        ),
        allowNull: false,
        defaultValue: "PENDING",
      },

      // ======================
      // SHIPPING INFO
      // ======================

      shippingFullName: {
        type: DataTypes.STRING,
      },

      shippingPhone: {
        type: DataTypes.STRING,
      },

      shippingCountry: {
        type: DataTypes.STRING,
      },

      shippingCity: {
        type: DataTypes.STRING,
      },

      shippingAddress: {
        type: DataTypes.STRING,
      },

      shippingPostalCode: {
        type: DataTypes.STRING,
      },

      shippingApartment: {
        type: DataTypes.STRING,
      },
    },
    {
      tableName: "Orders",     // 🔥 ВАЖНО
      freezeTableName: true,   // 🔥 Не создавать orders
      timestamps: true,
    }
  );
};