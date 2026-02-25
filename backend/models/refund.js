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
        type: DataTypes.DOUBLE,
        allowNull: false,
      },

      currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "USD",
      },

      /* ======================
         🔗 PAYPAL DATA
      ====================== */

      paypalRefundId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true, // защита от дублирования
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
      ],
    }
  );
};