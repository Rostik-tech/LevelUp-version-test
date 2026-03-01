import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define(
    "Product",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },

      brand: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      category: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "USD",
      },

      shortDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      longDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      specs: {
        type: DataTypes.JSONB,
        allowNull: true,
      },

      images: {
        type: DataTypes.JSONB,
        allowNull: true,
      },

      sizes: {
        type: DataTypes.JSONB,
        allowNull: true,
      },

      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "Products",
      freezeTableName: true,
      timestamps: true,
    }
  );
};