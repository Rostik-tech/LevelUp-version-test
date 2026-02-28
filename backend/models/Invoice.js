// backend/models/Invoice.js

import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define("Invoice", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    customerEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: "USD",
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "PAID",
    },
    pdfPath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });
};