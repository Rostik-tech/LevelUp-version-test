// backend/models/product.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define("Product", {
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING },
    price: { type: DataTypes.FLOAT, allowNull: false },
    stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  }, { timestamps: true });
};


