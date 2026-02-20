// backend/models/payment.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define(
    "Payment",
    {
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      method: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      paypalOrderId: {
        type: DataTypes.STRING,
        allowNull: true, // временно true, чтобы ничего не сломать
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "pending",
      },
    },
    { timestamps: true }
  );
};
