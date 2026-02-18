// backend/models/payment.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define("Payment", {
    amount: { type: DataTypes.FLOAT, allowNull: false },
    method: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: "pending" },
  }, { timestamps: true });
};

