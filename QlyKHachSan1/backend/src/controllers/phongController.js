const dichVuPhong = require("../services/phongService");

class PhongController {
  async layDanhSachCongKhai(req, res, next) {
    try {
      const ketQua = await dichVuPhong.layDanhSachCongKhai(req.query);

      res.json({
        thanhCong: true,
        duLieu: ketQua,
      });
    } catch (error) {
      next(error);
    }
  }

  async layChiTietCongKhai(req, res, next) {
    try {
      const phong = await dichVuPhong.layChiTietCongKhai(req.params.id);

      res.json({
        thanhCong: true,
        duLieu: phong,
      });
    } catch (error) {
      next(error);
    }
  }

  async layPhongTrongCongKhai(req, res, next) {
    try {
      const { ngay_nhan, ngay_tra } = req.query;

      if (!ngay_nhan || !ngay_tra) {
        return res.status(400).json({
          thanhCong: false,
          thongBao: "Vui lòng cung cấp ngày nhận và ngày trả",
        });
      }

      const cacPhong = await dichVuPhong.layPhongTrong(ngay_nhan, ngay_tra);

      res.json({
        thanhCong: true,
        duLieu: cacPhong,
      });
    } catch (error) {
      next(error);
    }
  }

  async layDanhSach(req, res, next) {
    try {
      const ketQua = await dichVuPhong.layDanhSach(req.query);

      res.json({
        thanhCong: true,
        duLieu: ketQua,
      });
    } catch (error) {
      next(error);
    }
  }

  async layPhongTrong(req, res, next) {
    try {
      const { ngay_nhan, ngay_tra } = req.query;

      if (!ngay_nhan || !ngay_tra) {
        return res.status(400).json({
          thanhCong: false,
          thongBao: "Vui lòng cung cấp ngày nhận và ngày trả",
        });
      }

      const cacPhong = await dichVuPhong.layPhongTrong(ngay_nhan, ngay_tra);

      res.json({
        thanhCong: true,
        duLieu: cacPhong,
      });
    } catch (error) {
      next(error);
    }
  }

  async layChiTiet(req, res, next) {
    try {
      const phong = await dichVuPhong.layChiTiet(req.params.id);

      res.json({
        thanhCong: true,
        duLieu: phong,
      });
    } catch (error) {
      next(error);
    }
  }

  async taoMoi(req, res, next) {
    try {
      const phong = await dichVuPhong.taoMoi(req.body);

      res.status(201).json({
        thanhCong: true,
        thongBao: "Tạo phòng mới thành công",
        duLieu: phong,
      });
    } catch (error) {
      next(error);
    }
  }

  async capNhat(req, res, next) {
    try {
      const phong = await dichVuPhong.capNhat(req.params.id, req.body);

      res.json({
        thanhCong: true,
        thongBao: "Cập nhật phòng thành công",
        duLieu: phong,
      });
    } catch (error) {
      next(error);
    }
  }

  async xoa(req, res, next) {
    try {
      const ketQua = await dichVuPhong.xoa(req.params.id);

      res.json({
        thanhCong: true,
        thongBao: ketQua.thongBao,
      });
    } catch (error) {
      next(error);
    }
  }

  async capNhatTrangThai(req, res, next) {
    try {
      const { trangThai } = req.body;
      const phong = await dichVuPhong.capNhatTrangThai(
        req.params.id,
        trangThai,
      );

      res.json({
        thanhCong: true,
        thongBao: "Cập nhật trạng thái phòng thành công",
        duLieu: phong,
      });
    } catch (error) {
      next(error);
    }
  }

  async kiemTraPhongCoSanCongKhai(req, res, next) {
    try {
      const { ngay_nhan, ngay_tra } = req.query;
      const { id } = req.params;

      if (!ngay_nhan || !ngay_tra) {
        return res.status(400).json({
          thanhCong: false,
          thongBao: "Vui lòng cung cấp ngày nhận và ngày trả",
        });
      }

      const ketQua = await dichVuPhong.kiemTraPhongCoSan(
        id,
        ngay_nhan,
        ngay_tra,
      );

      res.json({
        thanhCong: true,
        duLieu: ketQua,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PhongController();
