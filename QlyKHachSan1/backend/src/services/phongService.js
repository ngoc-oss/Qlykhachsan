const { Phong, LoaiPhong, DatPhong } = require("../models");
const { Op } = require("sequelize");
const LoiTuyChon = require("../utils/LoiTuyChon");

class DichVuPhong {
  xacDinhTrangThaiHienThi(phong, cacDatPhong = []) {
    if (phong.trangThai === "baotri") {
      return {
        ma: "baotri",
        ten: "Bảo trì",
        chiTiet: phong.ghiChu || "Phòng đang bảo trì",
      };
    }

    if (phong.trangThai === "donphong") {
      return {
        ma: "donphong",
        ten: "Đang dọn phòng",
        chiTiet: "Phòng đang được chuẩn bị cho lượt khách tiếp theo",
      };
    }

    const datPhongDangNhan = cacDatPhong.find(
      (item) => item.trangThai === "danhan",
    );
    if (datPhongDangNhan) {
      return {
        ma: "danhan",
        ten: "Đang có khách",
        chiTiet: `Đến ${new Date(datPhongDangNhan.ngayTraPhong).toLocaleString("vi-VN")}`,
      };
    }

    const datPhongDaXacNhan = cacDatPhong.find(
      (item) => item.trangThai === "daxacnhan",
    );
    if (datPhongDaXacNhan) {
      return {
        ma: "daxacnhan",
        ten: "Đã xác nhận",
        chiTiet: `Nhận phòng ${new Date(datPhongDaXacNhan.ngayNhanPhong).toLocaleString("vi-VN")}`,
      };
    }

    const datPhongChoXacNhan = cacDatPhong.find(
      (item) => item.trangThai === "choxacnhan",
    );
    if (datPhongChoXacNhan) {
      return {
        ma: "choxacnhan",
        ten: "Chờ xác nhận",
        chiTiet: `Yêu cầu cho ${new Date(datPhongChoXacNhan.ngayNhanPhong).toLocaleString("vi-VN")}`,
      };
    }

    return {
      ma: "trong",
      ten: "Trống",
      chiTiet: "Sẵn sàng nhận khách",
    };
  }

  async layDanhSachCongKhai(query) {
    const { trang = 1, gioi_han = 12 } = query;
    const offset = (trang - 1) * gioi_han;

    const { count, rows } = await Phong.findAndCountAll({
      where: { trangThai: "trong" },
      include: [
        {
          model: LoaiPhong,
          as: "loaiPhong",
        },
      ],
      limit: parseInt(gioi_han),
      offset: offset,
      order: [["soPhong", "ASC"]],
    });

    return {
      tongSo: count,
      trangHienTai: parseInt(trang),
      tongSoTrang: Math.ceil(count / gioi_han),
      duLieu: rows,
    };
  }

  async layChiTietCongKhai(id) {
    const phong = await Phong.findOne({
      where: { id, trangThai: "trong" },
      include: [
        {
          model: LoaiPhong,
          as: "loaiPhong",
        },
      ],
    });

    if (!phong) {
      throw new LoiTuyChon("Không tìm thấy phòng khả dụng", 404);
    }

    return phong;
  }

  async layDanhSach(query) {
    const { trang = 1, gioi_han = 10, trang_thai, tang, loai_phong_id } = query;
    const offset = (trang - 1) * gioi_han;

    const dieuKien = {};
    if (trang_thai) dieuKien.trangThai = trang_thai;
    if (tang) dieuKien.tang = tang;
    if (loai_phong_id) dieuKien.loaiPhongId = loai_phong_id;

    const { count, rows } = await Phong.findAndCountAll({
      where: dieuKien,
      include: [
        {
          model: LoaiPhong,
          as: "loaiPhong",
        },
      ],
      limit: parseInt(gioi_han),
      offset: offset,
      order: [["soPhong", "ASC"]],
    });

    const phongIds = rows.map((phong) => phong.id);
    const cacDatPhong = phongIds.length
      ? await DatPhong.findAll({
          where: {
            phongId: { [Op.in]: phongIds },
            trangThai: {
              [Op.in]: ["choxacnhan", "daxacnhan", "danhan"],
            },
          },
          attributes: [
            "id",
            "phongId",
            "trangThai",
            "ngayNhanPhong",
            "ngayTraPhong",
          ],
          order: [
            ["ngayNhanPhong", "ASC"],
            ["ngayTao", "ASC"],
          ],
        })
      : [];

    const datPhongTheoPhong = cacDatPhong.reduce((acc, item) => {
      if (!acc[item.phongId]) {
        acc[item.phongId] = [];
      }
      acc[item.phongId].push(item);
      return acc;
    }, {});

    const duLieu = rows.map((phong) => {
      const phongJson = phong.toJSON();
      const trangThaiHienThi = this.xacDinhTrangThaiHienThi(
        phongJson,
        datPhongTheoPhong[phong.id] || [],
      );

      return {
        ...phongJson,
        trangThaiHienThi: trangThaiHienThi.ma,
        tenTrangThaiHienThi: trangThaiHienThi.ten,
        chiTietTrangThai: trangThaiHienThi.chiTiet,
      };
    });

    return {
      tongSo: count,
      trangHienTai: parseInt(trang),
      tongSoTrang: Math.ceil(count / gioi_han),
      duLieu,
    };
  }

  async layPhongTrong(ngayNhan, ngayTra) {
    const cacPhongDaDat = await DatPhong.findAll({
      where: {
        trangThai: {
          [Op.in]: ["daxacnhan", "danhan"],
        },
        [Op.or]: [
          {
            ngayNhanPhong: {
              [Op.between]: [ngayNhan, ngayTra],
            },
          },
          {
            ngayTraPhong: {
              [Op.between]: [ngayNhan, ngayTra],
            },
          },
          {
            [Op.and]: [
              { ngayNhanPhong: { [Op.lte]: ngayNhan } },
              { ngayTraPhong: { [Op.gte]: ngayTra } },
            ],
          },
        ],
      },
      attributes: ["phongId"],
    });

    const cacIdPhongDaDat = cacPhongDaDat.map((dp) => dp.phongId);

    const cacPhongTrong = await Phong.findAll({
      where: {
        id: { [Op.notIn]: cacIdPhongDaDat },
        trangThai: "trong",
      },
      include: [
        {
          model: LoaiPhong,
          as: "loaiPhong",
        },
      ],
    });

    return cacPhongTrong;
  }

  async layChiTiet(id) {
    const phong = await Phong.findByPk(id, {
      include: [
        {
          model: LoaiPhong,
          as: "loaiPhong",
        },
      ],
    });

    if (!phong) {
      throw new LoiTuyChon("Không tìm thấy phòng", 404);
    }

    return phong;
  }

  async taoMoi(duLieu) {
    const { soPhong, loaiPhongId, tang, trangThai, ghiChu } = duLieu;

    const phongTonTai = await Phong.findOne({ where: { soPhong } });
    if (phongTonTai) {
      throw new LoiTuyChon("Số phòng đã tồn tại", 400);
    }

    const loaiPhong = await LoaiPhong.findByPk(loaiPhongId);
    if (!loaiPhong) {
      throw new LoiTuyChon("Không tìm thấy loại phòng", 404);
    }

    const phongMoi = await Phong.create({
      soPhong,
      loaiPhongId,
      tang,
      trangThai: trangThai || "trong",
      ghiChu,
    });

    return await this.layChiTiet(phongMoi.id);
  }

  async capNhat(id, duLieu) {
    const phong = await Phong.findByPk(id);

    if (!phong) {
      throw new LoiTuyChon("Không tìm thấy phòng", 404);
    }

    await phong.update(duLieu);
    return await this.layChiTiet(id);
  }

  async xoa(id) {
    const phong = await Phong.findByPk(id);

    if (!phong) {
      throw new LoiTuyChon("Không tìm thấy phòng", 404);
    }

    await phong.destroy();
    return { thongBao: "Xóa phòng thành công" };
  }

  async capNhatTrangThai(id, trangThai) {
    const phong = await Phong.findByPk(id);

    if (!phong) {
      throw new LoiTuyChon("Không tìm thấy phòng", 404);
    }

    await phong.update({ trangThai });
    return await this.layChiTiet(id);
  }

  async kiemTraPhongCoSan(phongId, ngayNhan, ngayTra) {
    const datPhongTrung = await DatPhong.findOne({
      where: {
        phongId,
        trangThai: {
          [Op.in]: ["choxacnhan", "daxacnhan", "danhan"],
        },
        [Op.or]: [
          {
            ngayNhanPhong: {
              [Op.between]: [ngayNhan, ngayTra],
            },
          },
          {
            ngayTraPhong: {
              [Op.between]: [ngayNhan, ngayTra],
            },
          },
          {
            [Op.and]: [
              { ngayNhanPhong: { [Op.lte]: ngayNhan } },
              { ngayTraPhong: { [Op.gte]: ngayTra } },
            ],
          },
        ],
      },
    });

    return {
      coSan: !datPhongTrung,
      thongBao: datPhongTrung
        ? "Phòng đã có lịch đặt trong khoảng thời gian này"
        : "Phòng còn trống",
    };
  }
}

module.exports = new DichVuPhong();
