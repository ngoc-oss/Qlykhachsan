const { NguoiDung } = require("../models");
const { taoToken } = require("../utils/jwt");
const LoiTuyChon = require("../utils/LoiTuyChon");

class DichVuAuth {
  async dangKy(duLieu) {
    const { tenDangNhap, matKhau, hoTen, email, soDienThoai, vaiTro } = duLieu;

    const nguoiDungTonTai = await NguoiDung.findOne({
      where: { tenDangNhap },
    });

    if (nguoiDungTonTai) {
      throw new LoiTuyChon("Tên đăng nhập đã tồn tại", 400);
    }

    const emailTonTai = await NguoiDung.findOne({
      where: { email },
    });

    if (emailTonTai) {
      throw new LoiTuyChon("Email đã được sử dụng", 400);
    }

    const nguoiDungMoi = await NguoiDung.create({
      tenDangNhap,
      matKhau,
      hoTen,
      email,
      soDienThoai,
      vaiTro: vaiTro || "khach_hang",
    });

    const token = taoToken({
      id: nguoiDungMoi.id,
      vaiTro: nguoiDungMoi.vaiTro,
    });
    const refreshToken = taoToken({ id: nguoiDungMoi.id }, "refresh");

    return {
      nguoiDung: nguoiDungMoi,
      token,
      refreshToken,
    };
  }

  async dangNhap(tenDangNhap, matKhau) {
    const nguoiDung = await NguoiDung.findOne({
      where: { tenDangNhap },
    });

    if (!nguoiDung) {
      throw new LoiTuyChon("Tên đăng nhập hoặc mật khẩu không đúng", 401);
    }

    if (nguoiDung.trangThai === "tamkhoa") {
      throw new LoiTuyChon("Tài khoản đã bị tạm khóa", 403);
    }

    const matKhauDung = await nguoiDung.kiemTraMatKhau(matKhau);

    if (!matKhauDung) {
      throw new LoiTuyChon("Tên đăng nhập hoặc mật khẩu không đúng", 401);
    }

    const token = taoToken({ id: nguoiDung.id, vaiTro: nguoiDung.vaiTro });
    const refreshToken = taoToken({ id: nguoiDung.id }, "refresh");

    return {
      nguoiDung,
      token,
      refreshToken,
    };
  }

  async layThongTinCaNhan(nguoiDungId) {
    const nguoiDung = await NguoiDung.findByPk(nguoiDungId);

    if (!nguoiDung) {
      throw new LoiTuyChon("Không tìm thấy người dùng", 404);
    }

    return nguoiDung;
  }

  async capNhatThongTin(nguoiDungId, duLieu) {
    const nguoiDung = await NguoiDung.findByPk(nguoiDungId);

    if (!nguoiDung) {
      throw new LoiTuyChon("Không tìm thấy người dùng", 404);
    }

    const { hoTen, email, soDienThoai } = duLieu;

    await nguoiDung.update({
      hoTen: hoTen || nguoiDung.hoTen,
      email: email || nguoiDung.email,
      soDienThoai: soDienThoai || nguoiDung.soDienThoai,
    });

    return nguoiDung;
  }

  async doiMatKhau(nguoiDungId, matKhauCu, matKhauMoi) {
    const nguoiDung = await NguoiDung.findByPk(nguoiDungId);

    if (!nguoiDung) {
      throw new LoiTuyChon("Không tìm thấy người dùng", 404);
    }

    const matKhauDung = await nguoiDung.kiemTraMatKhau(matKhauCu);

    if (!matKhauDung) {
      throw new LoiTuyChon("Mật khẩu cũ không đúng", 400);
    }

    await nguoiDung.update({ matKhau: matKhauMoi });

    return { thongBao: "Đổi mật khẩu thành công" };
  }
}

module.exports = new DichVuAuth();
