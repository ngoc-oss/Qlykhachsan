const { ThanhToan, DatPhong, NguoiDung } = require("../models");
const LoiTuyChon = require("../utils/LoiTuyChon");

class ThanhToanService {
  async layDanhSach(query) {
    const { trang = 1, gioi_han = 10, trang_thai = "" } = query;
    const offset = (trang - 1) * gioi_han;

    const dieu_kien = trang_thai ? { trangThai: trang_thai } : {};

    const { count, rows } = await ThanhToan.findAndCountAll({
      where: dieu_kien,
      include: [
        {
          model: DatPhong,
          as: "datPhong",
          attributes: ["id", "maDatPhong", "hoTen", "soDienThoai"],
        },
        {
          model: NguoiDung,
          as: "nguoiThu",
          attributes: ["id", "hoTen", "email"],
        },
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
    const thanhToan = await ThanhToan.findByPk(id, {
      include: [
        {
          model: DatPhong,
          as: "datPhong",
          attributes: ["id", "maDatPhong", "hoTen", "soDienThoai", "email"],
        },
        {
          model: NguoiDung,
          as: "nguoiThu",
          attributes: ["id", "hoTen", "email"],
        },
      ],
    });

    if (!thanhToan) {
      throw new LoiTuyChon("Thanh toán không tồn tại", 404);
    }

    return thanhToan;
  }

  async taoMoi(duLieu) {
    const { datPhongId, soTien, phuongThuc } = duLieu;

    if (!datPhongId || !soTien || !phuongThuc) {
      throw new LoiTuyChon("Thiếu thông tin bắt buộc", 400);
    }

    const datPhong = await DatPhong.findByPk(datPhongId);
    if (!datPhong) {
      throw new LoiTuyChon("Đặt phòng không tồn tại", 404);
    }

    return await ThanhToan.create({
      datPhongId,
      soTien: Number(soTien),
      phuongThuc,
      trangThai: "cho_xac_nhan",
      ngayThanhToan: new Date(),
    });
  }

  async xacNhan(id, nguoiThuId) {
    const thanhToan = await ThanhToan.findByPk(id);
    if (!thanhToan) {
      throw new LoiTuyChon("Thanh toán không tồn tại", 404);
    }

    await thanhToan.update({
      trangThai: "da_xac_nhan",
      nguoiThuId,
      ngayXacNhan: new Date(),
    });

    return thanhToan.reload();
  }

  async huy(id) {
    const thanhToan = await ThanhToan.findByPk(id);
    if (!thanhToan) {
      throw new LoiTuyChon("Thanh toán không tồn tại", 404);
    }

    await thanhToan.update({
      trangThai: "da_huy",
    });

    return thanhToan.reload();
  }
}

module.exports = new ThanhToanService();
