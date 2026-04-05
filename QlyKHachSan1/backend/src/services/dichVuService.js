const { DichVu } = require("../models");
const LoiTuyChon = require("../utils/LoiTuyChon");

class DichVuService {
  async layDanhSach(query) {
    const { trang = 1, gioi_han = 10, tim_kiem = "" } = query;
    const offset = (trang - 1) * gioi_han;

    const dieu_kien = tim_kiem
      ? {
          [require("sequelize").Op.like]: `%${tim_kiem}%`,
        }
      : {};

    const { count, rows } = await DichVu.findAndCountAll({
      where: {
        ...dieu_kien,
      },
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
    const dichVu = await DichVu.findByPk(id);
    if (!dichVu) {
      throw new LoiTuyChon("Dịch vụ không tồn tại", 404);
    }
    return dichVu;
  }

  async taoMoi(duLieu) {
    const { tenDichVu, gia, moTa } = duLieu;

    if (!tenDichVu || gia === undefined) {
      throw new LoiTuyChon("Thiếu thông tin bắt buộc", 400);
    }

    return await DichVu.create({
      tenDichVu,
      gia: Number(gia),
      moTa: moTa || "",
    });
  }

  async capNhat(id, duLieu) {
    const dichVu = await DichVu.findByPk(id);
    if (!dichVu) {
      throw new LoiTuyChon("Dịch vụ không tồn tại", 404);
    }

    const { tenDichVu, gia, moTa } = duLieu;

    await dichVu.update({
      tenDichVu: tenDichVu || dichVu.tenDichVu,
      gia: gia !== undefined ? Number(gia) : dichVu.gia,
      moTa: moTa !== undefined ? moTa : dichVu.moTa,
    });

    return dichVu.reload();
  }

  async xoa(id) {
    const dichVu = await DichVu.findByPk(id);
    if (!dichVu) {
      throw new LoiTuyChon("Dịch vụ không tồn tại", 404);
    }

    await dichVu.destroy();
    return { id };
  }
}

module.exports = new DichVuService();
