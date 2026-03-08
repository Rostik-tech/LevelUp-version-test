// backend/models/review.js

import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Review = sequelize.define(
    "Review",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },

      comment: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          len: [3, 1000],
        },
      },

      isApproved: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["UserId", "ProductId"], // 🚫 один отзыв на товар от одного пользователя
        },
      ],
    }
  );

  return Review;
};