'use strict';

export default {

  async up(queryInterface) {

    await queryInterface.removeColumn("Products", "name");
    await queryInterface.removeColumn("Products", "shortDescription");
    await queryInterface.removeColumn("Products", "longDescription");

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.addColumn("Products", "name", {
      type: Sequelize.STRING,
      allowNull: false
    });

    await queryInterface.addColumn("Products", "shortDescription", {
      type: Sequelize.TEXT
    });

    await queryInterface.addColumn("Products", "longDescription", {
      type: Sequelize.TEXT
    });

  }

};