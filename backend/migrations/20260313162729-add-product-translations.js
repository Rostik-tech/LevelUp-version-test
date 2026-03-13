'use strict';

export default {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn("Products", "name_en", {
      type: Sequelize.STRING
    });

    await queryInterface.addColumn("Products", "name_ru", {
      type: Sequelize.STRING
    });

    await queryInterface.addColumn("Products", "name_bg", {
      type: Sequelize.STRING
    });

    await queryInterface.addColumn("Products", "shortDescription_en", {
      type: Sequelize.TEXT
    });

    await queryInterface.addColumn("Products", "shortDescription_ru", {
      type: Sequelize.TEXT
    });

    await queryInterface.addColumn("Products", "shortDescription_bg", {
      type: Sequelize.TEXT
    });

    await queryInterface.addColumn("Products", "longDescription_en", {
      type: Sequelize.TEXT
    });

    await queryInterface.addColumn("Products", "longDescription_ru", {
      type: Sequelize.TEXT
    });

    await queryInterface.addColumn("Products", "longDescription_bg", {
      type: Sequelize.TEXT
    });

  },

  async down(queryInterface) {

    await queryInterface.removeColumn("Products", "name_en");
    await queryInterface.removeColumn("Products", "name_ru");
    await queryInterface.removeColumn("Products", "name_bg");

    await queryInterface.removeColumn("Products", "shortDescription_en");
    await queryInterface.removeColumn("Products", "shortDescription_ru");
    await queryInterface.removeColumn("Products", "shortDescription_bg");

    await queryInterface.removeColumn("Products", "longDescription_en");
    await queryInterface.removeColumn("Products", "longDescription_ru");
    await queryInterface.removeColumn("Products", "longDescription_bg");

  }
};