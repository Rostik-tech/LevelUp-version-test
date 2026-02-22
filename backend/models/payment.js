// backend/models/payment.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define(
    "Payment",
    {
      amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },

      method: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      paypalOrderId: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      status: {
        type: DataTypes.ENUM(
          "PENDING",
          "COMPLETED",
          "FAILED"
        ),
        allowNull: false,
        defaultValue: "PENDING",
      },
    },
    {
      tableName: "Payments",
      freezeTableName: true,
      timestamps: true,
    }
  );
};