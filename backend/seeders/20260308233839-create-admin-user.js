'use strict';

import bcrypt from 'bcryptjs';

export default {
  async up(queryInterface, Sequelize) {

    const hashedPassword = await bcrypt.hash('rost-2007', 10);

    await queryInterface.bulkInsert('Users', [{
      username: 'admin',
      email: 'levelupshopgaming@gmail.com',
      password: hashedPassword,
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.bulkDelete('Users', {
      email: 'levelupshopgaming@gmail.com'
    }, {});

  }
};