'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Refunds', {

      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },

      PaymentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Payments',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },

      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },

      currency: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: "USD"
      },

      idempotencyKey: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },

      paypalRefundId: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },

      rawResponse: {
        type: Sequelize.JSONB,
        allowNull: true
      },

      status: {
        type: Sequelize.ENUM(
          "PENDING",
          "COMPLETED",
          "FAILED"
        ),
        allowNull: false,
        defaultValue: "PENDING"
      },

      adminId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      reason: {
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
    await queryInterface.dropTable('Refunds');
  }
};
