const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const DichVu = sequelize.define(
  "DichVu",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tenDichVu: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    loaiDichVu: {
      type: DataTypes.ENUM("annuong", "giatui", "spa", "dichvukhac"),
      allowNull: false,
    },
    moTa: {
      type: DataTypes.TEXT,
    },
    donGia: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    donVi: {
      type: DataTypes.STRING(20),
      defaultValue: "cái",
    },
    trangThai: {
      type: DataTypes.ENUM("hoatdong", "dunghoatdong"),
      defaultValue: "hoatdong",
    },
  },
  {
    tableName: "dich_vu",
    timestamps: true,
    createdAt: "ngayTao",
    updatedAt: "ngayCapNhat",
  },
);

module.exports = DichVu;
