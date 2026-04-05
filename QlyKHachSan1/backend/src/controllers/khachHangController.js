const dichVuKhachHang = require("../services/khachHangService");

class KhachHangController {
  async layDanhSach(req, res, next) {
    try {
      const ketQua = await dichVuKhachHang.layDanhSach(req.query);

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
      const khachHang = await dichVuKhachHang.layChiTiet(req.params.id);

      res.json({
        thanhCong: true,
        duLieu: khachHang,
      });
    } catch (error) {
      next(error);
    }
  }

  async taoMoi(req, res, next) {
    try {
      const khachHang = await dichVuKhachHang.taoMoi(req.body);

      res.status(201).json({
        thanhCong: true,
        thongBao: "Tạo khách hàng thành công",
        duLieu: khachHang,
      });
    } catch (error) {
      next(error);
    }
  }

  async capNhat(req, res, next) {
    try {
      const khachHang = await dichVuKhachHang.capNhat(req.params.id, req.body);

      res.json({
        thanhCong: true,
        thongBao: "Cập nhật khách hàng thành công",
        duLieu: khachHang,
      });
    } catch (error) {
      next(error);
    }
  }

  async xoa(req, res, next) {
    try {
      await dichVuKhachHang.xoa(req.params.id);

      res.json({
        thanhCong: true,
        thongBao: "Xóa khách hàng thành công",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new KhachHangController();
