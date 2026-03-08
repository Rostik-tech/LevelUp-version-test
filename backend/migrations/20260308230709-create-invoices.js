'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Invoices', {

      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },

      orderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'Orders',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },

      invoiceNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },

      customerEmail: {
        type: Sequelize.STRING,
        allowNull: false
      },

      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },

      currency: {
        type: Sequelize.STRING,
        defaultValue: "USD"
      },

      status: {
        type: Sequelize.STRING,
        defaultValue: "PAID"
      },

      pdfPath: {
        type: Sequelize.STRING,
        allowNull: true
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
    await queryInterface.dropTable('Invoices');
  }
};
