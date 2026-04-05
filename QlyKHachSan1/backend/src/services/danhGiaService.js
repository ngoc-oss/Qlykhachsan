const { DanhGia, DatPhong, KhachHang } = require("../models");
const LoiTuyChon = require("../utils/LoiTuyChon");

class DanhGiaService {
  async layDanhSach(query) {
    const { trang = 1, gioi_han = 10, sao_min = "" } = query;
    const offset = (trang - 1) * gioi_han;

    const dieu_kien = sao_min
      ? { sao: { [require("sequelize").Op.gte]: Number(sao_min) } }
      : {};

    const { count, rows } = await DanhGia.findAndCountAll({
      where: dieu_kien,
      include: [
        {
          model: DatPhong,
          as: "datPhong",
          attributes: ["id", "maDatPhong", "hoTen"],
        },
        {
          model: KhachHang,
          as: "khachHang",
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
    const danhGia = await DanhGia.findByPk(id, {
      include: [
        {
          model: DatPhong,
          as: "datPhong",
        },
        {
          model: KhachHang,
          as: "khachHang",
        },
      ],
    });

    if (!danhGia) {
      throw new LoiTuyChon("Đánh giá không tồn tại", 404);
    }

    return danhGia;
  }

  async taoMoi(duLieu) {
    const { datPhongId, khachHangId, sao, nhanXet } = duLieu;

    if (!datPhongId || !khachHangId || !sao) {
      throw new LoiTuyChon("Thiếu thông tin bắt buộc", 400);
    }

    if (sao < 1 || sao > 5) {
      throw new LoiTuyChon("Đánh giá phải từ 1-5 sao", 400);
    }

    const coSan = await DanhGia.findOne({
      where: { datPhongId, khachHangId },
    });

    if (coSan) {
      throw new LoiTuyChon("Đã đánh giá đặt phòng này", 409);
    }

    return await DanhGia.create({
      datPhongId,
      khachHangId,
      sao: Number(sao),
      nhanXet: nhanXet || "",
      ngayTao: new Date(),
    });
  }

  async capNhat(id, duLieu) {
    const danhGia = await DanhGia.findByPk(id);
    if (!danhGia) {
      throw new LoiTuyChon("Đánh giá không tồn tại", 404);
    }

    const { sao, nhanXet } = duLieu;

    if (sao && (sao < 1 || sao > 5)) {
      throw new LoiTuyChon("Đánh giá phải từ 1-5 sao", 400);
    }

    await danhGia.update({
      sao: sao !== undefined ? Number(sao) : danhGia.sao,
      nhanXet: nhanXet !== undefined ? nhanXet : danhGia.nhanXet,
    });

    return danhGia.reload();
  }

  async xoa(id) {
    const danhGia = await DanhGia.findByPk(id);
    if (!danhGia) {
      throw new LoiTuyChon("Đánh giá không tồn tại", 404);
    }

    await danhGia.destroy();
    return { id };
  }
}

module.exports = new DanhGiaService();
