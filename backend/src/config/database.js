const { Sequelize } = require('sequelize');

let sequelize = null;

function getSequelize() {
  if (!sequelize) {
    sequelize = new Sequelize(
      process.env.DB_NAME || 'qlykhachsan',
      process.env.DB_USER || 'root',
      process.env.DB_PASS || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        dialect: 'mysql',
        logging: false,
        pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
        define: { timestamps: true, underscored: false },
      }
    );
  }
  return sequelize;
}

const connectDB = async () => {
  const mysql2 = require('mysql2/promise');
  try {
    // Tạo database nếu chưa có (dùng mysql2 thô, không cần sequelize)
    const tempConn = await mysql2.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
    });
    const dbName = process.env.DB_NAME || 'qlykhachsan';
    await tempConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await tempConn.end();
    console.log(`✅ Database '${dbName}' sẵn sàng!`);

    // Kiểm tra kết nối Sequelize
    await getSequelize().authenticate();
    console.log('✅ Kết nối MySQL thành công!');
  } catch (err) {
    console.error('❌ Lỗi kết nối MySQL:', err.message);
    throw err;
  }
};

// Export lazy getter
module.exports = {
  get sequelize() { return getSequelize(); },
  connectDB,
};
