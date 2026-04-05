const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ThanhToan = sequelize.define(
  "ThanhToan",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    maThanhToan: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    datPhongId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "dat_phong",
        key: "id",
      },
    },
    tongTienPhong: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    tongTienDichVu: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    tienCoc: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    giamGia: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    tongThanhToan: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    phuongThucThanhToan: {
      type: DataTypes.ENUM("tienmat", "chuyenkhoan", "theonline"),
      defaultValue: "tienmat",
    },
    trangThai: {
      type: DataTypes.ENUM("chothanhtoan", "dathanhoan", "dahuy"),
      defaultValue: "chothanhtoan",
    },
    ngayThanhToan: {
      type: DataTypes.DATE,
    },
    nguoiThuId: {
      type: DataTypes.INTEGER,
      references: {
        model: "nguoi_dung",
        key: "id",
      },
    },
    ghiChu: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "thanh_toan",
    timestamps: true,
    createdAt: "ngayTao",
    updatedAt: "ngayCapNhat",
  },
);

module.exports = ThanhToan;
