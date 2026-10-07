const { DataTypes } = require('sequelize');
const db = require('../config/database');
const KhachHang = require('./KhachHang');
const Phong = require('./Phong');

const DatPhong = db.sequelize.define('DatPhong', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  khachHangId: { type: DataTypes.INTEGER, allowNull: false },
  phongId: { type: DataTypes.INTEGER, allowNull: false },
  checkIn: { type: DataTypes.DATEONLY, allowNull: false },
  checkOut: { type: DataTypes.DATEONLY, allowNull: false },
  trangThai: {
    type: DataTypes.ENUM('da-dat', 'dang-o', 'da-tra', 'huy'),
    defaultValue: 'da-dat',
  },
  ghiChu: { type: DataTypes.TEXT, defaultValue: '' },
  tongTien: { type: DataTypes.BIGINT, defaultValue: 0 },
}, { tableName: 'dat_phongs' });

DatPhong.belongsTo(KhachHang, { foreignKey: 'khachHangId', as: 'khachHang' });
DatPhong.belongsTo(Phong, { foreignKey: 'phongId', as: 'phong' });

module.exports = DatPhong;
