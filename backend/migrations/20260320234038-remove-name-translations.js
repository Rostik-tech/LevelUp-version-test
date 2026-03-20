'use strict';

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Products", "name_ru").catch(() => {});
    await queryInterface.removeColumn("Products", "name_bg").catch(() => {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("Products", "name_ru", {
      type: Sequelize.STRING,
    });

    await queryInterface.addColumn("Products", "name_bg", {
      type: Sequelize.STRING,
    });
  }
};
