const { sequelize } = require("./src/config/database");
const { LoaiPhong, Phong } = require("./src/models");

async function seedData() {
  try {
    const soLuong = await LoaiPhong.count();
    if (soLuong > 0) {
      console.log("Dữ liệu mẫu đã tồn tại, bỏ qua seed.");
      process.exit(0);
    }

    const loaiPhongDeluxe = await LoaiPhong.create({
      tenLoaiPhong: "Deluxe",
      moTa: "Phòng cao cấp với view đẹp, giường King size, phòng tắm riêng biệt và ban công rộng rãi.",
      giaGoc: 1500000,
      giaHienTai: 1200000,
      dienTich: 35,
      soNguoiToiDa: 2,
      soGiuong: 1,
      tienNghi: JSON.stringify([
        "WiFi miễn phí",
        "Điều hòa",
        "TV 43 inch",
        "Minibar",
        "Ban công",
      ]),
      trangThai: "hoatdong",
    });

    const loaiPhongStandard = await LoaiPhong.create({
      tenLoaiPhong: "Standard",
      moTa: "Phòng tiêu chuẩn thoải mái, phù hợp cho gia đình nhỏ hoặc cặp đôi.",
      giaGoc: 800000,
      giaHienTai: 650000,
      dienTich: 25,
      soNguoiToiDa: 2,
      soGiuong: 1,
      tienNghi: JSON.stringify([
        "WiFi miễn phí",
        "Điều hòa",
        "TV 32 inch",
        "Tủ lạnh nhỏ",
      ]),
      trangThai: "hoatdong",
    });

    const loaiPhongSuite = await LoaiPhong.create({
      tenLoaiPhong: "Suite",
      moTa: "Phòng Suite sang trọng với phòng khách riêng, bồn tắm nằm và view toàn cảnh thành phố.",
      giaGoc: 2500000,
      giaHienTai: 2000000,
      dienTich: 50,
      soNguoiToiDa: 4,
      soGiuong: 2,
      tienNghi: JSON.stringify([
        "WiFi miễn phí",
        "Điều hòa trung tâm",
        "TV 55 inch",
        "Minibar cao cấp",
        "Bồn tắm nằm",
        "Phòng khách riêng",
        "Ban công lớn",
      ]),
      trangThai: "hoatdong",
    });

    const danhSachPhong = [];

    for (let i = 1; i <= 5; i++) {
      danhSachPhong.push({
        soPhong: `30${i}`,
        loaiPhongId: loaiPhongDeluxe.id,
        tang: 3,
        trangThai: "trong",
      });
    }

    for (let i = 1; i <= 8; i++) {
      danhSachPhong.push({
        soPhong: `20${i}`,
        loaiPhongId: loaiPhongStandard.id,
        tang: 2,
        trangThai: "trong",
      });
    }

    for (let i = 1; i <= 3; i++) {
      danhSachPhong.push({
        soPhong: `40${i}`,
        loaiPhongId: loaiPhongSuite.id,
        tang: 4,
        trangThai: "trong",
      });
    }

    await Phong.bulkCreate(danhSachPhong);

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

seedData();
