const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
require("dotenv").config();

const { kiemTraKetNoi } = require("./config/database");
const { dongBoDatabase } = require("./models");
const routes = require("./routes");
const xuLyLoi = require("./middlewares/xuLyLoi");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials: true,
  }),
);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/api", routes);

app.use(xuLyLoi);

const PORT = process.env.PORT || 5000;

const khoiDongServer = async () => {
  try {
    await kiemTraKetNoi();
    await dongBoDatabase();

    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════╗
║   Server đang chạy ở cổng ${PORT}       ║
║   Môi trường: ${process.env.NODE_ENV || "development"}           ║
║   URL: http://localhost:${PORT}        ║
╚═══════════════════════════════════════╝
      `);
    });
  } catch (error) {
    process.exit(1);
  }
};

khoiDongServer();

module.exports = app;
