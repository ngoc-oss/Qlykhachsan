const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const DatPhong = sequelize.define(
  "DatPhong",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    maDatPhong: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    khachHangId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "khach_hang",
        key: "id",
      },
    },
    phongId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "phong",
        key: "id",
      },
    },
    ngayNhanPhong: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    ngayTraPhong: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    soNguoiLon: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    soTreEm: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    giaPhong: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    tienCoc: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    tongTien: {
      type: DataTypes.DECIMAL(10, 2),
    },
    trangThai: {
      type: DataTypes.ENUM(
        "choxacnhan",
        "daxacnhan",
        "danhan",
        "hoanthanh",
        "dahuy",
      ),
      defaultValue: "choxacnhan",
    },
    ghiChu: {
      type: DataTypes.TEXT,
    },
    nguoiTaoId: {
      type: DataTypes.INTEGER,
      references: {
        model: "nguoi_dung",
        key: "id",
      },
    },
  },
  {
    tableName: "dat_phong",
    timestamps: true,
    createdAt: "ngayTao",
    updatedAt: "ngayCapNhat",
  },
);

module.exports = DatPhong;
