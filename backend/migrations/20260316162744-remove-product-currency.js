"use strict";

export default {
  async up(queryInterface, Sequelize) {

    // удаляем колонку currency
    await queryInterface.removeColumn("Products", "currency");

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.addColumn("Products", "currency", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "USD",
    });

  }
};