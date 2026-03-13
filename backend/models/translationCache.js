import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define(
    "TranslationCache",
    {
      text: {
        type: DataTypes.TEXT,
        allowNull: false
      },

      lang: {
        type: DataTypes.STRING,
        allowNull: false
      },

      translation: {
        type: DataTypes.TEXT,
        allowNull: false
      }
    },
    {
      tableName: "TranslationCache",
      freezeTableName: true,
      timestamps: true
    }
  );
};