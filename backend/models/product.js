// models/product.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define(
    "Product",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      price: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },

      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "Products",
      freezeTableName: true,
      timestamps: true,
    }
  );
};

