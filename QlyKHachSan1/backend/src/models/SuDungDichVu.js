const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const SuDungDichVu = sequelize.define(
  "SuDungDichVu",
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
    dichVuId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "dich_vu",
        key: "id",
      },
    },
    soLuong: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    donGia: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    thanhTien: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    ngaySuDung: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    ghiChu: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "su_dung_dich_vu",
    timestamps: true,
    createdAt: "ngayTao",
    updatedAt: "ngayCapNhat",
  },
);

module.exports = SuDungDichVu;
