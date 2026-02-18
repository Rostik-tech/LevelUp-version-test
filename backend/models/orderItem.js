// backend/models/orderItem.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define("OrderItem", {
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    price: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  }, { timestamps: true });
};


