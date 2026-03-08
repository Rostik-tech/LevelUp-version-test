'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Products', {

      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },

      name: {
        type: Sequelize.STRING,
        allowNull: false
      },

      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },

      brand: {
        type: Sequelize.STRING,
        allowNull: true
      },

      rarity: {
        type: Sequelize.ENUM(
          "CLASSIC",
          "RARE",
          "EPIC",
          "MYTHIC",
          "LEGENDARY"
        ),
        allowNull: false,
        defaultValue: "CLASSIC"
      },

      price: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false
      },

      currency: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "USD"
      },

      shortDescription: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      longDescription: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      specs: {
        type: Sequelize.JSONB,
        allowNull: true
      },

      images: {
        type: Sequelize.JSONB,
        allowNull: true
      },

      sizes: {
        type: Sequelize.JSONB,
        allowNull: true
      },

      stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },

      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Products');
  }
};
