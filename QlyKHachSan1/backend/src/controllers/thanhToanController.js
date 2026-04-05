const thanhToanService = require("../services/thanhToanService");

class ThanhToanController {
  async layDanhSach(req, res, next) {
    try {
      const ketQua = await thanhToanService.layDanhSach(req.query);

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
      const thanhToan = await thanhToanService.layChiTiet(req.params.id);

      res.json({
        thanhCong: true,
        duLieu: thanhToan,
      });
    } catch (error) {
      next(error);
    }
  }

  async taoMoi(req, res, next) {
    try {
      const thanhToan = await thanhToanService.taoMoi(req.body);

      res.status(201).json({
        thanhCong: true,
        thongBao: "Tạo thanh toán thành công",
        duLieu: thanhToan,
      });
    } catch (error) {
      next(error);
    }
  }

  async xacNhan(req, res, next) {
    try {
      const thanhToan = await thanhToanService.xacNhan(
        req.params.id,
        req.nguoiDung.id,
      );

      res.json({
        thanhCong: true,
        thongBao: "Xác nhận thanh toán thành công",
        duLieu: thanhToan,
      });
    } catch (error) {
      next(error);
    }
  }

  async huy(req, res, next) {
    try {
      const thanhToan = await thanhToanService.huy(req.params.id);

      res.json({
        thanhCong: true,
        thongBao: "Hủy thanh toán thành công",
        duLieu: thanhToan,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ThanhToanController();
