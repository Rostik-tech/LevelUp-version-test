'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Payments', {

      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },

      UserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },

      OrderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'Orders',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },

      amount: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },

      refundedAmount: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0
      },

      currency: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: "USD"
      },

      method: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "PAYPAL"
      },

      paypalOrderId: {
        type: Sequelize.STRING,
        allowNull: true
      },

      paypalCaptureId: {
        type: Sequelize.STRING,
        allowNull: true
      },

      status: {
        type: Sequelize.ENUM(
          "PENDING",
          "COMPLETED",
          "FAILED",
          "PARTIALLY_REFUNDED",
          "REFUNDED"
        ),
        allowNull: false,
        defaultValue: "PENDING"
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
    await queryInterface.dropTable('Payments');
  }
};