const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const KhachHang = sequelize.define(
  "KhachHang",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    hoTen: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    soDienThoai: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
    },
    cmnd: {
      type: DataTypes.STRING(20),
    },
    diaChi: {
      type: DataTypes.TEXT,
    },
    quocTich: {
      type: DataTypes.STRING(50),
      defaultValue: "Việt Nam",
    },
    ngaySinh: {
      type: DataTypes.DATEONLY,
    },
    gioiTinh: {
      type: DataTypes.ENUM("nam", "nu", "khac"),
    },
    ghiChu: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "khach_hang",
    timestamps: true,
    createdAt: "ngayTao",
    updatedAt: "ngayCapNhat",
  },
);

module.exports = KhachHang;
