const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const bcrypt = require("bcryptjs");

const NguoiDung = sequelize.define(
  "NguoiDung",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tenDangNhap: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    matKhau: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    hoTen: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    soDienThoai: {
      type: DataTypes.STRING(20),
    },
    vaiTro: {
      type: DataTypes.ENUM("admin", "nhanvien", "letan", "khach_hang"),
      defaultValue: "nhanvien",
    },
    trangThai: {
      type: DataTypes.ENUM("hoatdong", "tamkhoa"),
      defaultValue: "hoatdong",
    },
  },
  {
    tableName: "nguoi_dung",
    timestamps: true,
    createdAt: "ngayTao",
    updatedAt: "ngayCapNhat",
  },
);

NguoiDung.beforeCreate(async (nguoiDung) => {
  if (nguoiDung.matKhau) {
    nguoiDung.matKhau = await bcrypt.hash(nguoiDung.matKhau, 10);
  }
});

NguoiDung.beforeUpdate(async (nguoiDung) => {
  if (nguoiDung.changed("matKhau")) {
    nguoiDung.matKhau = await bcrypt.hash(nguoiDung.matKhau, 10);
  }
});

NguoiDung.prototype.kiemTraMatKhau = async function (matKhau) {
  return await bcrypt.compare(matKhau, this.matKhau);
};

NguoiDung.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.matKhau;
  return values;
};

module.exports = NguoiDung;
