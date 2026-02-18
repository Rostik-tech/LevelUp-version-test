const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "postgres",
    port: process.env.DB_PORT || 5432,
    logging: false,
  }
);

sequelize
  .authenticate()
  .then(() => console.log("Соединение с базой данных прошло успешно!"))
  .catch((err) => console.error("Ошибка соединения с базой данных:", err));

module.exports = sequelize;
