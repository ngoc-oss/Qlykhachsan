const dichVuService = require("../services/dichVuService");

class DichVuController {
  async layDanhSach(req, res, next) {
    try {
      const ketQua = await dichVuService.layDanhSach(req.query);

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
      const dichVu = await dichVuService.layChiTiet(req.params.id);

      res.json({
        thanhCong: true,
        duLieu: dichVu,
      });
    } catch (error) {
      next(error);
    }
  }

  async taoMoi(req, res, next) {
    try {
      const dichVu = await dichVuService.taoMoi(req.body);

      res.status(201).json({
        thanhCong: true,
        thongBao: "Tạo dịch vụ thành công",
        duLieu: dichVu,
      });
    } catch (error) {
      next(error);
    }
  }

  async capNhat(req, res, next) {
    try {
      const dichVu = await dichVuService.capNhat(req.params.id, req.body);

      res.json({
        thanhCong: true,
        thongBao: "Cập nhật dịch vụ thành công",
        duLieu: dichVu,
      });
    } catch (error) {
      next(error);
    }
  }

  async xoa(req, res, next) {
    try {
      await dichVuService.xoa(req.params.id);

      res.json({
        thanhCong: true,
        thongBao: "Xóa dịch vụ thành công",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DichVuController();
