// backend/models/user.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define("User", {
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, defaultValue: "user" },
  }, { timestamps: true });
};

