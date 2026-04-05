const { sequelize } = require("../config/database");
const NguoiDung = require("./NguoiDung");
const KhachHang = require("./KhachHang");
const LoaiPhong = require("./LoaiPhong");
const Phong = require("./Phong");
const DatPhong = require("./DatPhong");
const DichVu = require("./DichVu");
const SuDungDichVu = require("./SuDungDichVu");
const ThanhToan = require("./ThanhToan");
const DanhGia = require("./DanhGia");

LoaiPhong.hasMany(Phong, { foreignKey: "loaiPhongId", as: "cacPhong" });
Phong.belongsTo(LoaiPhong, { foreignKey: "loaiPhongId", as: "loaiPhong" });

KhachHang.hasMany(DatPhong, { foreignKey: "khachHangId", as: "cacDatPhong" });
DatPhong.belongsTo(KhachHang, { foreignKey: "khachHangId", as: "khachHang" });

Phong.hasMany(DatPhong, { foreignKey: "phongId", as: "cacDatPhong" });
DatPhong.belongsTo(Phong, { foreignKey: "phongId", as: "phong" });

NguoiDung.hasMany(DatPhong, { foreignKey: "nguoiTaoId", as: "cacDatPhong" });
DatPhong.belongsTo(NguoiDung, { foreignKey: "nguoiTaoId", as: "nguoiTao" });

DatPhong.hasMany(SuDungDichVu, { foreignKey: "datPhongId", as: "cacDichVu" });
SuDungDichVu.belongsTo(DatPhong, { foreignKey: "datPhongId", as: "datPhong" });

DichVu.hasMany(SuDungDichVu, { foreignKey: "dichVuId", as: "cacSuDung" });
SuDungDichVu.belongsTo(DichVu, { foreignKey: "dichVuId", as: "dichVu" });

DatPhong.hasOne(ThanhToan, { foreignKey: "datPhongId", as: "thanhToan" });
ThanhToan.belongsTo(DatPhong, { foreignKey: "datPhongId", as: "datPhong" });

NguoiDung.hasMany(ThanhToan, { foreignKey: "nguoiThuId", as: "cacThanhToan" });
ThanhToan.belongsTo(NguoiDung, { foreignKey: "nguoiThuId", as: "nguoiThu" });

DatPhong.hasMany(DanhGia, { foreignKey: "datPhongId", as: "cacDanhGia" });
DanhGia.belongsTo(DatPhong, { foreignKey: "datPhongId", as: "datPhong" });

KhachHang.hasMany(DanhGia, { foreignKey: "khachHangId", as: "cacDanhGia" });
DanhGia.belongsTo(KhachHang, { foreignKey: "khachHangId", as: "khachHang" });

const dongBoDatabase = async () => {
  const choPhepAlter = process.env.DB_SYNC_ALTER === "true";
  await sequelize.sync({ alter: choPhepAlter });
};

module.exports = {
  sequelize,
  dongBoDatabase,
  NguoiDung,
  KhachHang,
  LoaiPhong,
  Phong,
  DatPhong,
  DichVu,
  SuDungDichVu,
  ThanhToan,
  DanhGia,
};
