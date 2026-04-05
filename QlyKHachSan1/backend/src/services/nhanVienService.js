const { NguoiDung } = require("../models");
const LoiTuyChon = require("../utils/LoiTuyChon");
const bcryptjs = require("bcryptjs");

class NhanVienService {
  async layDanhSach(query) {
    const { trang = 1, gioi_han = 10, vai_tro = "" } = query;
    const offset = (trang - 1) * gioi_han;

    const dieu_kien = vai_tro ? { vaiTro: vai_tro } : {};

    const { count, rows } = await NguoiDung.findAndCountAll({
      where: {
        ...dieu_kien,
        vaiTro: { [require("sequelize").Op.ne]: "khach" },
      },
      attributes: [
        "id",
        "tenDangNhap",
        "hoTen",
        "email",
        "soDienThoai",
        "vaiTro",
        "trangThai",
        "createdAt",
      ],
      limit: Number(gioi_han),
      offset,
      order: [["id", "DESC"]],
    });

    return {
      tong: count,
      trang: Number(trang),
      gioi_han: Number(gioi_han),
      duLieu: rows,
    };
  }

  async layChiTiet(id) {
    const nhanVien = await NguoiDung.findByPk(id, {
      attributes: [
        "id",
        "tenDangNhap",
        "hoTen",
        "email",
        "soDienThoai",
        "vaiTro",
        "trangThai",
      ],
    });

    if (!nhanVien || nhanVien.vaiTro === "khach") {
      throw new LoiTuyChon("Nhân viên không tồn tại", 404);
    }

    return nhanVien;
  }

  async taoMoi(duLieu) {
    const { tenDangNhap, matKhau, hoTen, email, soDienThoai, vaiTro } = duLieu;

    if (!tenDangNhap || !matKhau || !hoTen || !vaiTro) {
      throw new LoiTuyChon("Thiếu thông tin bắt buộc", 400);
    }

    const coSan = await NguoiDung.findOne({ where: { tenDangNhap } });
    if (coSan) {
      throw new LoiTuyChon("Tên đăng nhập đã tồn tại", 409);
    }

    const matKhauDaHashed = await bcryptjs.hash(matKhau, 10);

    return await NguoiDung.create({
      tenDangNhap,
      matKhau: matKhauDaHashed,
      hoTen,
      email: email || null,
      soDienThoai: soDienThoai || null,
      vaiTro,
      trangThai: "hoat_dong",
    });
  }

  async capNhat(id, duLieu) {
    const nhanVien = await NguoiDung.findByPk(id);
    if (!nhanVien || nhanVien.vaiTro === "khach") {
      throw new LoiTuyChon("Nhân viên không tồn tại", 404);
    }

    const { hoTen, email, soDienThoai, vaiTro, trangThai } = duLieu;

    await nhanVien.update({
      hoTen: hoTen || nhanVien.hoTen,
      email: email !== undefined ? email : nhanVien.email,
      soDienThoai:
        soDienThoai !== undefined ? soDienThoai : nhanVien.soDienThoai,
      vaiTro: vaiTro || nhanVien.vaiTro,
      trangThai: trangThai || nhanVien.trangThai,
    });

    return nhanVien.reload();
  }

  async doiMatKhau(id, matKhauCu, matKhauMoi) {
    const nhanVien = await NguoiDung.findByPk(id);
    if (!nhanVien) {
      throw new LoiTuyChon("Nhân viên không tồn tại", 404);
    }

    const dung = await bcryptjs.compare(matKhauCu, nhanVien.matKhau);
    if (!dung) {
      throw new LoiTuyChon("Mật khẩu cũ không đúng", 401);
    }

    const matKhauDaHashed = await bcryptjs.hash(matKhauMoi, 10);
    await nhanVien.update({ matKhau: matKhauDaHashed });

    return { id: nhanVien.id };
  }

  async xoa(id) {
    const nhanVien = await NguoiDung.findByPk(id);
    if (!nhanVien || nhanVien.vaiTro === "khach") {
      throw new LoiTuyChon("Nhân viên không tồn tại", 404);
    }

    await nhanVien.destroy();
    return { id };
  }
}

module.exports = new NhanVienService();
