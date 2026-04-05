const nhanVienService = require("../services/nhanVienService");

class NhanVienController {
  async layDanhSach(req, res, next) {
    try {
      const ketQua = await nhanVienService.layDanhSach(req.query);

      res.json({
        thanhCong: true,
        duLieu: ketQua,
      });
    } catch (error) {
      next(error);
    }
  }

  async layChiTiet(req, res, next) {
    try {
      const nhanVien = await nhanVienService.layChiTiet(req.params.id);

      res.json({
        thanhCong: true,
        duLieu: nhanVien,
      });
    } catch (error) {
      next(error);
    }
  }

  async taoMoi(req, res, next) {
    try {
      const nhanVien = await nhanVienService.taoMoi(req.body);

      res.status(201).json({
        thanhCong: true,
        thongBao: "Tạo nhân viên thành công",
        duLieu: {
          id: nhanVien.id,
          tenDangNhap: nhanVien.tenDangNhap,
          hoTen: nhanVien.hoTen,
          vaiTro: nhanVien.vaiTro,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async capNhat(req, res, next) {
    try {
      const nhanVien = await nhanVienService.capNhat(req.params.id, req.body);

      res.json({
        thanhCong: true,
        thongBao: "Cập nhật nhân viên thành công",
        duLieu: {
          id: nhanVien.id,
          tenDangNhap: nhanVien.tenDangNhap,
          hoTen: nhanVien.hoTen,
          vaiTro: nhanVien.vaiTro,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async doiMatKhau(req, res, next) {
    try {
      const { matKhauCu, matKhauMoi } = req.body;
      await nhanVienService.doiMatKhau(req.params.id, matKhauCu, matKhauMoi);

      res.json({
        thanhCong: true,
        thongBao: "Đổi mật khẩu thành công",
      });
    } catch (error) {
      next(error);
    }
  }

  async xoa(req, res, next) {
    try {
      await nhanVienService.xoa(req.params.id);

      res.json({
        thanhCong: true,
        thongBao: "Xóa nhân viên thành công",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NhanVienController();
