'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Orders', {

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

      totalPrice: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0
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
          "PAID",
          "PROCESSING",
          "SHIPPED",
          "DELIVERED",
          "CANCELLED",
          "PARTIALLY_REFUNDED",
          "REFUNDED"
        ),
        allowNull: false,
        defaultValue: "PENDING"
      },

      shippingFullName: {
        type: Sequelize.STRING
      },

      shippingPhone: {
        type: Sequelize.STRING
      },

      shippingCountry: {
        type: Sequelize.STRING
      },

      shippingCity: {
        type: Sequelize.STRING
      },

      shippingAddress: {
        type: Sequelize.STRING
      },

      shippingPostalCode: {
        type: Sequelize.STRING
      },

      shippingApartment: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('Orders');
  }
};
