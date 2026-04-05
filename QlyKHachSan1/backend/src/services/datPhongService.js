const {
  DatPhong,
  KhachHang,
  Phong,
  LoaiPhong,
  NguoiDung,
} = require("../models");
const { Op } = require("sequelize");
const {
  taoMaDatPhong,
  tinhSoNgay,
  kiemTraNgayHopLe,
} = require("../utils/helpers");
const LoiTuyChon = require("../utils/LoiTuyChon");

class DichVuDatPhong {
  kiemTraSucChua(soNguoiLon, soTreEm, soNguoiToiDa) {
    const nguoiLon = Number(soNguoiLon || 1);
    const treEm = Number(soTreEm || 0);
    const tongSoKhach = nguoiLon + treEm;

    if (nguoiLon < 1) {
      throw new LoiTuyChon("Cần ít nhất 1 người lớn cho mỗi đặt phòng", 400);
    }

    if (tongSoKhach > Number(soNguoiToiDa || 0)) {
      throw new LoiTuyChon(
        `Phòng chỉ nhận tối đa ${soNguoiToiDa} khách (hiện tại: ${tongSoKhach})`,
        400,
      );
    }
  }

  async dongBoTrangThaiPhong(phongId) {
    if (!phongId) return;

    const phong = await Phong.findByPk(phongId);
    if (!phong) return;

    const datPhongDangNhan = await DatPhong.findOne({
      where: {
        phongId,
        trangThai: "danhan",
      },
    });

    if (datPhongDangNhan) {
      if (phong.trangThai !== "dango") {
        await phong.update({ trangThai: "dango" });
      }
      return;
    }

    if (phong.trangThai === "dango") {
      await phong.update({ trangThai: "trong" });
    }
  }

  async kiemTraPhongCoSan(phongId, ngayNhanPhong, ngayTraPhong) {
    const datPhongTrung = await DatPhong.findOne({
      where: {
        phongId,
        trangThai: {
          [Op.in]: ["choxacnhan", "daxacnhan", "danhan"],
        },
        [Op.or]: [
          {
            ngayNhanPhong: {
              [Op.between]: [ngayNhanPhong, ngayTraPhong],
            },
          },
          {
            ngayTraPhong: {
              [Op.between]: [ngayNhanPhong, ngayTraPhong],
            },
          },
          {
            [Op.and]: [
              { ngayNhanPhong: { [Op.lte]: ngayNhanPhong } },
              { ngayTraPhong: { [Op.gte]: ngayTraPhong } },
            ],
          },
        ],
      },
    });

    if (datPhongTrung) {
      throw new LoiTuyChon(
        "Phòng đã có lịch đặt trong khoảng thời gian này",
        400,
      );
    }
  }

  async layDanhSach(query) {
    const {
      trang = 1,
      gioi_han = 10,
      trang_thai,
      trang_thai_nhom,
      khach_hang_id,
    } = query;
    const offset = (trang - 1) * gioi_han;

    const dieuKien = {};
    if (trang_thai) dieuKien.trangThai = trang_thai;
    if (trang_thai_nhom === "dangxuly") {
      dieuKien.trangThai = {
        [Op.in]: ["choxacnhan", "daxacnhan"],
      };
    }
    if (trang_thai_nhom === "lichsu") {
      dieuKien.trangThai = {
        [Op.in]: ["hoanthanh", "dahuy"],
      };
    }
    if (khach_hang_id) dieuKien.khachHangId = khach_hang_id;

    const { count, rows } = await DatPhong.findAndCountAll({
      where: dieuKien,
      include: [
        {
          model: KhachHang,
          as: "khachHang",
          attributes: ["id", "hoTen", "soDienThoai", "email"],
        },
        {
          model: Phong,
          as: "phong",
          include: [
            {
              model: LoaiPhong,
              as: "loaiPhong",
            },
          ],
        },
        {
          model: NguoiDung,
          as: "nguoiTao",
          attributes: ["id", "hoTen"],
        },
      ],
      limit: parseInt(gioi_han),
      offset: offset,
      order: [["ngayTao", "DESC"]],
    });

    return {
      tongSo: count,
      trangHienTai: parseInt(trang),
      tongSoTrang: Math.ceil(count / gioi_han),
      duLieu: rows,
    };
  }

  async layLichSuCuaToi(nguoiDungId, query = {}) {
    const { trang = 1, gioi_han = 20, trang_thai } = query;
    const offset = (trang - 1) * gioi_han;

    const nguoiDung = await NguoiDung.findByPk(nguoiDungId);
    if (!nguoiDung) throw new LoiTuyChon("Không tìm thấy người dùng", 404);

    const khachHang = await KhachHang.findOne({
      where: {
        [Op.or]: [
          ...(nguoiDung.email ? [{ email: nguoiDung.email }] : []),
          ...(nguoiDung.soDienThoai
            ? [{ soDienThoai: nguoiDung.soDienThoai }]
            : []),
        ],
      },
    });

    if (!khachHang) {
      return { tongSo: 0, trangHienTai: 1, tongSoTrang: 0, duLieu: [] };
    }

    const dieuKien = { khachHangId: khachHang.id };
    if (trang_thai) dieuKien.trangThai = trang_thai;

    const { count, rows } = await DatPhong.findAndCountAll({
      where: dieuKien,
      include: [
        {
          model: Phong,
          as: "phong",
          include: [{ model: LoaiPhong, as: "loaiPhong" }],
        },
      ],
      limit: parseInt(gioi_han),
      offset: offset,
      order: [["ngayTao", "DESC"]],
    });

    return {
      tongSo: count,
      trangHienTai: parseInt(trang),
      tongSoTrang: Math.ceil(count / gioi_han),
      duLieu: rows,
    };
  }

  async layChiTiet(id) {
    const datPhong = await DatPhong.findByPk(id, {
      include: [
        {
          model: KhachHang,
          as: "khachHang",
        },
        {
          model: Phong,
          as: "phong",
          include: [
            {
              model: LoaiPhong,
              as: "loaiPhong",
            },
          ],
        },
        {
          model: NguoiDung,
          as: "nguoiTao",
          attributes: ["id", "hoTen"],
        },
      ],
    });

    if (!datPhong) {
      throw new LoiTuyChon("Không tìm thấy đặt phòng", 404);
    }

    return datPhong;
  }

  async taoMoi(duLieu, nguoiTaoId) {
    const {
      khachHangId,
      phongId,
      ngayNhanPhong,
      ngayTraPhong,
      soNguoiLon,
      soTreEm,
      tienCoc,
      ghiChu,
    } = duLieu;

    const kiemTra = kiemTraNgayHopLe(ngayNhanPhong, ngayTraPhong);
    if (!kiemTra.hopLe) {
      throw new LoiTuyChon(kiemTra.thongBao, 400);
    }

    const phong = await Phong.findByPk(phongId, {
      include: [{ model: LoaiPhong, as: "loaiPhong" }],
    });

    if (!phong) {
      throw new LoiTuyChon("Không tìm thấy phòng", 404);
    }

    // Tìm khách hàng: ưu tiên khachHangId, nếu không có thì tìm bằng email/sđt của NguoiDung
    let khachHang = null;
    if (khachHangId) {
      khachHang = await KhachHang.findByPk(khachHangId);
    } else if (nguoiTaoId) {
      // Lấy info từ NguoiDung đã đăng nhập
      const nguoiDung = await NguoiDung.findByPk(nguoiTaoId);
      if (!nguoiDung) {
        throw new LoiTuyChon("Không tìm thấy người dùng", 404);
      }

      // Tìm hoặc tạo KhachHang dựa trên email/sđt
      [khachHang] = await KhachHang.findOrCreate({
        where: {
          [Op.or]: [
            ...(nguoiDung.email ? [{ email: nguoiDung.email }] : []),
            ...(nguoiDung.soDienThoai
              ? [{ soDienThoai: nguoiDung.soDienThoai }]
              : []),
          ],
        },
        defaults: {
          hoTen: nguoiDung.hoTen,
          soDienThoai: nguoiDung.soDienThoai || "0000000000",
          email: nguoiDung.email,
        },
      });
    }

    if (!khachHang) {
      throw new LoiTuyChon("Không tìm thấy khách hàng", 404);
    }

    this.kiemTraSucChua(
      soNguoiLon,
      soTreEm,
      phong.loaiPhong?.soNguoiToiDa || 0,
    );

    await this.kiemTraPhongCoSan(phongId, ngayNhanPhong, ngayTraPhong);

    const soNgay = tinhSoNgay(ngayNhanPhong, ngayTraPhong);
    const giaPhong = phong.loaiPhong.giaHienTai;
    const tongTien = soNgay * giaPhong;

    const datPhongMoi = await DatPhong.create({
      maDatPhong: taoMaDatPhong(),
      khachHangId: khachHang.id,
      phongId,
      ngayNhanPhong,
      ngayTraPhong,
      soNguoiLon: soNguoiLon || 1,
      soTreEm: soTreEm || 0,
      giaPhong,
      tienCoc: tienCoc || 0,
      tongTien,
      trangThai: "choxacnhan",
      ghiChu,
      nguoiTaoId,
    });

    return await this.layChiTiet(datPhongMoi.id);
  }

  async taoMoiCongKhai(duLieu) {
    const {
      hoTen,
      soDienThoai,
      email,
      phongId,
      ngayNhanPhong,
      ngayTraPhong,
      soNguoiLon,
      soTreEm,
      ghiChu,
    } = duLieu;

    if (!hoTen || !soDienThoai || !phongId || !ngayNhanPhong || !ngayTraPhong) {
      throw new LoiTuyChon("Thiếu thông tin bắt buộc để đặt phòng", 400);
    }

    const kiemTra = kiemTraNgayHopLe(ngayNhanPhong, ngayTraPhong);
    if (!kiemTra.hopLe) {
      throw new LoiTuyChon(kiemTra.thongBao, 400);
    }

    const phong = await Phong.findByPk(phongId, {
      include: [{ model: LoaiPhong, as: "loaiPhong" }],
    });

    if (!phong || phong.trangThai !== "trong") {
      throw new LoiTuyChon("Phòng không khả dụng", 400);
    }

    this.kiemTraSucChua(
      soNguoiLon,
      soTreEm,
      phong.loaiPhong?.soNguoiToiDa || 0,
    );

    await this.kiemTraPhongCoSan(phongId, ngayNhanPhong, ngayTraPhong);

    const [khachHang] = await KhachHang.findOrCreate({
      where: { soDienThoai },
      defaults: {
        hoTen,
        soDienThoai,
        email,
      },
    });

    if (khachHang.hoTen !== hoTen || khachHang.email !== email) {
      await khachHang.update({ hoTen, email });
    }

    const soNgay = tinhSoNgay(ngayNhanPhong, ngayTraPhong);
    const giaPhong = phong.loaiPhong.giaHienTai;
    const tongTien = soNgay * giaPhong;

    const datPhongMoi = await DatPhong.create({
      maDatPhong: taoMaDatPhong(),
      khachHangId: khachHang.id,
      phongId,
      ngayNhanPhong,
      ngayTraPhong,
      soNguoiLon: soNguoiLon || 1,
      soTreEm: soTreEm || 0,
      giaPhong,
      tienCoc: 0,
      tongTien,
      trangThai: "choxacnhan",
      ghiChu: ghiChu || "Yêu cầu đặt phòng từ website khách hàng",
      nguoiTaoId: null,
    });

    return await this.layChiTiet(datPhongMoi.id);
  }

  async xacNhan(id) {
    const datPhong = await DatPhong.findByPk(id);

    if (!datPhong) {
      throw new LoiTuyChon("Không tìm thấy đặt phòng", 404);
    }

    if (datPhong.trangThai !== "choxacnhan") {
      throw new LoiTuyChon("Không thể xác nhận đặt phòng này", 400);
    }

    await datPhong.update({ trangThai: "daxacnhan" });
    return await this.layChiTiet(id);
  }

  async checkIn(id) {
    const datPhong = await DatPhong.findByPk(id, {
      include: [{ model: Phong, as: "phong" }],
    });

    if (!datPhong) {
      throw new LoiTuyChon("Không tìm thấy đặt phòng", 404);
    }

    if (datPhong.trangThai !== "daxacnhan") {
      throw new LoiTuyChon("Không thể nhận phòng", 400);
    }

    await datPhong.update({ trangThai: "danhan" });
    await datPhong.phong.update({ trangThai: "dango" });

    return await this.layChiTiet(id);
  }

  async checkOut(id) {
    const datPhong = await DatPhong.findByPk(id, {
      include: [{ model: Phong, as: "phong" }],
    });

    if (!datPhong) {
      throw new LoiTuyChon("Không tìm thấy đặt phòng", 404);
    }

    if (datPhong.trangThai !== "danhan") {
      throw new LoiTuyChon("Không thể trả phòng", 400);
    }

    await datPhong.update({ trangThai: "hoanthanh" });
    await datPhong.phong.update({ trangThai: "donphong" });

    return await this.layChiTiet(id);
  }

  async huy(id) {
    const datPhong = await DatPhong.findByPk(id, {
      include: [{ model: Phong, as: "phong" }],
    });

    if (!datPhong) {
      throw new LoiTuyChon("Không tìm thấy đặt phòng", 404);
    }

    if (["danhan", "hoanthanh"].includes(datPhong.trangThai)) {
      throw new LoiTuyChon("Không thể hủy đặt phòng này", 400);
    }

    await datPhong.update({ trangThai: "dahuy" });
    await this.dongBoTrangThaiPhong(datPhong.phongId);

    return await this.layChiTiet(id);
  }
}

module.exports = new DichVuDatPhong();
