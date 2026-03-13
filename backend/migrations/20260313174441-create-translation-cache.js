'use strict';

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TranslationCache', {

      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },

      text: {
        type: Sequelize.TEXT,
        allowNull: false
      },

      lang: {
        type: Sequelize.STRING,
        allowNull: false
      },

      translation: {
        type: Sequelize.TEXT,
        allowNull: false
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }

    });

    await queryInterface.addConstraint('TranslationCache', {
      fields: ['text', 'lang'],
      type: 'unique',
      name: 'unique_translation_text_lang'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('TranslationCache');
  }
};
