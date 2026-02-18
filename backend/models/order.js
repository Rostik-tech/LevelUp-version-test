// backend/models/order.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define("Order", {
    totalPrice: { type: DataTypes.FLOAT, defaultValue: 0 },
    status: { type: DataTypes.STRING, defaultValue: "pending" },
  }, { timestamps: true });
};

