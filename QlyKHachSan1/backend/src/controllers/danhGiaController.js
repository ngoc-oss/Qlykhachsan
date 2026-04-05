const danhGiaService = require("../services/danhGiaService");

class DanhGiaController {
  async layDanhSach(req, res, next) {
    try {
      const ketQua = await danhGiaService.layDanhSach(req.query);

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
      const danhGia = await danhGiaService.layChiTiet(req.params.id);

      res.json({
        thanhCong: true,
        duLieu: danhGia,
      });
    } catch (error) {
      next(error);
    }
  }

  async taoMoi(req, res, next) {
    try {
      const danhGia = await danhGiaService.taoMoi(req.body);

      res.status(201).json({
        thanhCong: true,
        thongBao: "Tạo đánh giá thành công",
        duLieu: danhGia,
      });
    } catch (error) {
      next(error);
    }
  }

  async capNhat(req, res, next) {
    try {
      const danhGia = await danhGiaService.capNhat(req.params.id, req.body);

      res.json({
        thanhCong: true,
        thongBao: "Cập nhật đánh giá thành công",
        duLieu: danhGia,
      });
    } catch (error) {
      next(error);
    }
  }

  async xoa(req, res, next) {
    try {
      await danhGiaService.xoa(req.params.id);

      res.json({
        thanhCong: true,
        thongBao: "Xóa đánh giá thành công",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DanhGiaController();
