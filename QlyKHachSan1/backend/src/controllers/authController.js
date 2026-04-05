const dichVuAuth = require("../services/authService");

class AuthController {
  async dangKy(req, res, next) {
    try {
      const ketQua = await dichVuAuth.dangKy(req.body);

      res.status(201).json({
        thanhCong: true,
        thongBao: "Đăng ký thành công",
        duLieu: ketQua,
      });
    } catch (error) {
      next(error);
    }
  }

  async dangNhap(req, res, next) {
    try {
      const { tenDangNhap, matKhau } = req.body;
      const ketQua = await dichVuAuth.dangNhap(tenDangNhap, matKhau);

      res.json({
        thanhCong: true,
        thongBao: "Đăng nhập thành công",
        duLieu: ketQua,
      });
    } catch (error) {
      next(error);
    }
  }

  async layThongTinCaNhan(req, res, next) {
    try {
      const nguoiDung = await dichVuAuth.layThongTinCaNhan(req.nguoiDung.id);

      res.json({
        thanhCong: true,
        duLieu: nguoiDung,
      });
    } catch (error) {
      next(error);
    }
  }

  async capNhatThongTin(req, res, next) {
    try {
      const nguoiDung = await dichVuAuth.capNhatThongTin(
        req.nguoiDung.id,
        req.body,
      );

      res.json({
        thanhCong: true,
        thongBao: "Cập nhật thông tin thành công",
        duLieu: nguoiDung,
      });
    } catch (error) {
      next(error);
    }
  }

  async doiMatKhau(req, res, next) {
    try {
      const { matKhauCu, matKhauMoi } = req.body;
      const ketQua = await dichVuAuth.doiMatKhau(
        req.nguoiDung.id,
        matKhauCu,
        matKhauMoi,
      );

      res.json({
        thanhCong: true,
        thongBao: ketQua.thongBao,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
