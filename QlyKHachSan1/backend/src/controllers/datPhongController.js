const dichVuDatPhong = require("../services/datPhongService");

class DatPhongController {
  async taoMoiCongKhai(req, res, next) {
    try {
      const datPhong = await dichVuDatPhong.taoMoiCongKhai(req.body);

      res.status(201).json({
        thanhCong: true,
        thongBao: "Gửi yêu cầu đặt phòng thành công",
        duLieu: datPhong,
      });
    } catch (error) {
      next(error);
    }
  }

  async layDanhSach(req, res, next) {
    try {
      const ketQua = await dichVuDatPhong.layDanhSach(req.query);

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
      const datPhong = await dichVuDatPhong.layChiTiet(req.params.id);

      res.json({
        thanhCong: true,
        duLieu: datPhong,
      });
    } catch (error) {
      next(error);
    }
  }

  async taoMoi(req, res, next) {
    try {
      const datPhong = await dichVuDatPhong.taoMoi(req.body, req.nguoiDung.id);

      res.status(201).json({
        thanhCong: true,
        thongBao: "Tạo đặt phòng thành công",
        duLieu: datPhong,
      });
    } catch (error) {
      next(error);
    }
  }

  async xacNhan(req, res, next) {
    try {
      const datPhong = await dichVuDatPhong.xacNhan(req.params.id);

      res.json({
        thanhCong: true,
        thongBao: "Xác nhận đặt phòng thành công",
        duLieu: datPhong,
      });
    } catch (error) {
      next(error);
    }
  }

  async checkIn(req, res, next) {
    try {
      const datPhong = await dichVuDatPhong.checkIn(req.params.id);

      res.json({
        thanhCong: true,
        thongBao: "Nhận phòng thành công",
        duLieu: datPhong,
      });
    } catch (error) {
      next(error);
    }
  }

  async checkOut(req, res, next) {
    try {
      const datPhong = await dichVuDatPhong.checkOut(req.params.id);

      res.json({
        thanhCong: true,
        thongBao: "Trả phòng thành công",
        duLieu: datPhong,
      });
    } catch (error) {
      next(error);
    }
  }

  async huy(req, res, next) {
    try {
      const datPhong = await dichVuDatPhong.huy(req.params.id);

      res.json({
        thanhCong: true,
        thongBao: "Hủy đặt phòng thành công",
        duLieu: datPhong,
      });
    } catch (error) {
      next(error);
    }
  }

  async layLichSuCuaToi(req, res, next) {
    try {
      const ketQua = await dichVuDatPhong.layLichSuCuaToi(
        req.nguoiDung.id,
        req.query,
      );
      res.json({ thanhCong: true, duLieu: ketQua });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DatPhongController();
