const { DataTypes } = require('sequelize');
const db = require('../config/database');

const Phong = db.sequelize.define('Phong', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  soPhong: { type: DataTypes.STRING(10), allowNull: false, unique: true },
  loai: { type: DataTypes.ENUM('Don', 'Doi', 'VIP', 'Suite'), allowNull: false },
  tang: { type: DataTypes.INTEGER, defaultValue: 1 },
  gia: { type: DataTypes.BIGINT, allowNull: false },
  trangThai: {
    type: DataTypes.ENUM('trong', 'dang-o', 'don-dep', 'bao-tri'),
    defaultValue: 'trong',
  },
  moTa: { type: DataTypes.TEXT, defaultValue: '' },
}, { tableName: 'phongs' });

module.exports = Phong;
