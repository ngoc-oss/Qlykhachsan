const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    timezone: "+07:00",
  },
);

const kiemTraKetNoi = async () => {
  try {
    await sequelize.authenticate();
  } catch (error) {
    process.exit(1);
  }
};

module.exports = { sequelize, kiemTraKetNoi };
