// backend/models/refund.js

import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define(
    "Refund",
    {
      /* ======================
         💰 REFUND AMOUNT
      ====================== */

      amount: {
        type: DataTypes.DECIMAL(10, 2), // ❗ правильно для денег
        allowNull: false,
      },

      currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "USD",
      },

      /* ======================
         🔐 IDEMPOTENCY
      ====================== */

      idempotencyKey: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // защита от повторных запросов
      },

      /* ======================
         🔗 PAYPAL DATA
      ====================== */

      paypalRefundId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true, // защита от дублирования PayPal
      },

      rawResponse: {
        type: DataTypes.JSONB, // сохраняем полный ответ PayPal
        allowNull: true,
      },

      /* ======================
         📊 STATUS
      ====================== */

      status: {
        type: DataTypes.ENUM(
          "PENDING",
          "COMPLETED",
          "FAILED"
        ),
        allowNull: false,
        defaultValue: "PENDING",
      },

      /* ======================
         👤 ADMIN TRACKING
      ====================== */

      adminId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      /* ======================
         📝 OPTIONAL
      ====================== */

      reason: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "Refunds",
      freezeTableName: true,
      timestamps: true,
      indexes: [
        { fields: ["status"] },
        { fields: ["paypalRefundId"] },
        { fields: ["PaymentId"] },
        { fields: ["idempotencyKey"] },
      ],
    }
  );
};