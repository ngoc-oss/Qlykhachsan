const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const DanhGia = sequelize.define(
  "DanhGia",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    datPhongId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "dat_phong",
        key: "id",
      },
    },
    khachHangId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "khach_hang",
        key: "id",
      },
    },
    diemPhong: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
        max: 5,
      },
    },
    diemDichVu: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
        max: 5,
      },
    },
    diemNhanVien: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
        max: 5,
      },
    },
    diemTrungBinh: {
      type: DataTypes.DECIMAL(2, 1),
    },
    noiDung: {
      type: DataTypes.TEXT,
    },
    camXuc: {
      type: DataTypes.ENUM("tichcuc", "trunglap", "tieucuc"),
    },
    diemCamXuc: {
      type: DataTypes.DECIMAL(3, 2),
    },
  },
  {
    tableName: "danh_gia",
    timestamps: true,
    createdAt: "ngayTao",
    updatedAt: "ngayCapNhat",
  },
);

module.exports = DanhGia;
