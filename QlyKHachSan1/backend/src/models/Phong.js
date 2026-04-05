const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Phong = sequelize.define(
  "Phong",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    soPhong: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    loaiPhongId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "loai_phong",
        key: "id",
      },
    },
    tang: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    trangThai: {
      type: DataTypes.ENUM("trong", "dango", "donphong", "baotri"),
      defaultValue: "trong",
    },
    ghiChu: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "phong",
    timestamps: true,
    createdAt: "ngayTao",
    updatedAt: "ngayCapNhat",
  },
);

module.exports = Phong;
