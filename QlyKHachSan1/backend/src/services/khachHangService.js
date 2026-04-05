const { KhachHang } = require("../models");
const LoiTuyChon = require("../utils/LoiTuyChon");

class DichVuKhachHang {
  async layDanhSach(query) {
    const { trang = 1, gioi_han = 10, tim_kiem = "" } = query;
    const offset = (trang - 1) * gioi_han;

    const dieu_kien = tim_kiem
      ? {
          [require("sequelize").Op.or]: [
            { hoTen: { [require("sequelize").Op.like]: `%${tim_kiem}%` } },
            { email: { [require("sequelize").Op.like]: `%${tim_kiem}%` } },
            {
              soDienThoai: { [require("sequelize").Op.like]: `%${tim_kiem}%` },
            },
          ],
        }
      : {};

    const { count, rows } = await KhachHang.findAndCountAll({
      where: dieu_kien,
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
    const khachHang = await KhachHang.findByPk(id);
    if (!khachHang) {
      throw new LoiTuyChon("Khách hàng không tồn tại", 404);
    }
    return khachHang;
  }

  async taoMoi(duLieu) {
    const { hoTen, email, soDienThoai } = duLieu;

    if (!hoTen || !email || !soDienThoai) {
      throw new LoiTuyChon("Thiếu thông tin bắt buộc", 400);
    }

    const khachHangCoSan = await KhachHang.findOne({ where: { email } });
    if (khachHangCoSan) {
      throw new LoiTuyChon("Email đã tồn tại", 409);
    }

    return await KhachHang.create({
      hoTen,
      email,
      soDienThoai,
      diaChi: duLieu.diaChi || "",
      gioiTinh: duLieu.gioiTinh || null,
      ngaySinh: duLieu.ngaySinh || null,
    });
  }

  async capNhat(id, duLieu) {
    const khachHang = await KhachHang.findByPk(id);
    if (!khachHang) {
      throw new LoiTuyChon("Khách hàng không tồn tại", 404);
    }

    const { hoTen, email, soDienThoai, diaChi, gioiTinh, ngaySinh } = duLieu;

    if (email && email !== khachHang.email) {
      const coSan = await KhachHang.findOne({ where: { email } });
      if (coSan) {
        throw new LoiTuyChon("Email đã tồn tại", 409);
      }
    }

    await khachHang.update({
      hoTen: hoTen || khachHang.hoTen,
      email: email || khachHang.email,
      soDienThoai: soDienThoai || khachHang.soDienThoai,
      diaChi: diaChi !== undefined ? diaChi : khachHang.diaChi,
      gioiTinh: gioiTinh !== undefined ? gioiTinh : khachHang.gioiTinh,
      ngaySinh: ngaySinh !== undefined ? ngaySinh : khachHang.ngaySinh,
    });

    return khachHang.reload();
  }

  async xoa(id) {
    const khachHang = await KhachHang.findByPk(id);
    if (!khachHang) {
      throw new LoiTuyChon("Khách hàng không tồn tại", 404);
    }

    await khachHang.destroy();
    return { id };
  }
}

module.exports = new DichVuKhachHang();
