const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const LoaiPhong = sequelize.define(
  "LoaiPhong",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tenLoaiPhong: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    moTa: {
      type: DataTypes.TEXT,
    },
    giaGoc: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    giaHienTai: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    dienTich: {
      type: DataTypes.INTEGER,
    },
    soNguoiToiDa: {
      type: DataTypes.INTEGER,
      defaultValue: 2,
    },
    soGiuong: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    tienNghi: {
      type: DataTypes.JSON,
    },
    hinhAnh: {
      type: DataTypes.JSON,
    },
    trangThai: {
      type: DataTypes.ENUM("hoatdong", "dunghoatdong"),
      defaultValue: "hoatdong",
    },
  },
  {
    tableName: "loai_phong",
    timestamps: true,
    createdAt: "ngayTao",
    updatedAt: "ngayCapNhat",
  },
);

module.exports = LoaiPhong;
