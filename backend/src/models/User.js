const { DataTypes } = require('sequelize');
const db = require('../config/database');
const bcrypt = require('bcryptjs');

const User = db.sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  hoTen: { type: DataTypes.STRING(100), defaultValue: '' },
  role: { type: DataTypes.ENUM('admin', 'staff'), defaultValue: 'staff' },
}, { tableName: 'users' });

User.beforeCreate(async (user) => {
  if (user.password) user.password = await bcrypt.hash(user.password, 10);
});
User.beforeUpdate(async (user) => {
  if (user.changed('password')) user.password = await bcrypt.hash(user.password, 10);
});
User.prototype.checkPassword = async function(plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = User;
