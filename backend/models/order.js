// backend/models/order.js

import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define(
    "Order",
    {
      /* ======================
         💰 PAYMENT INFO
      ====================== */

      totalPrice: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },

      refundedAmount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },

      currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "EUR",
      },

      paypalOrderId: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      paypalCaptureId: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      /* ======================
         📦 STATUS
      ====================== */

      status: {
        type: DataTypes.ENUM(
          "PENDING",
          "PAID",
          "PROCESSING",
          "SHIPPED",
          "DELIVERED",
          "CANCELLED",
          "PARTIALLY_REFUNDED",
          "REFUNDED"
        ),
        allowNull: false,
        defaultValue: "PENDING",
      },

      /* ======================
      📅 DELIVERY TRACKING
       ====================== */

      deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      },

      

      /* ======================
         🚚 SHIPPING INFO
      ====================== */

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
      tableName: "Orders",
      freezeTableName: true,
      timestamps: true,
      indexes: [
        {
          fields: ["status"],
        },
        {
          fields: ["paypalOrderId"],
        },
        {
          fields: ["paypalCaptureId"],
        },
      ],
    }
  );
};