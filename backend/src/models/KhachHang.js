const { DataTypes } = require('sequelize');
const db = require('../config/database');

const KhachHang = db.sequelize.define('KhachHang', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  hoTen: { type: DataTypes.STRING(100), allowNull: false },
  sdt: { type: DataTypes.STRING(20), allowNull: false },
  email: { type: DataTypes.STRING(100), defaultValue: '' },
  cmnd: { type: DataTypes.STRING(20), defaultValue: '' },
  quocTich: { type: DataTypes.STRING(50), defaultValue: 'Viet Nam' },
  soLanO: { type: DataTypes.INTEGER, defaultValue: 0 },
  tongChiTieu: { type: DataTypes.BIGINT, defaultValue: 0 },
  hang: { type: DataTypes.ENUM('Moi', 'Bac', 'Vang', 'Kim cuong'), defaultValue: 'Moi' },
  ghiChu: { type: DataTypes.TEXT, defaultValue: '' },
}, { tableName: 'khach_hangs' });

module.exports = KhachHang;
