const moment = require("moment");

const taoMaDatPhong = () => {
  const ngayGio = moment().format("YYMMDDHHmmss");
  const soNgauNhien = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `BK${ngayGio}${soNgauNhien}`;
};

const taoMaThanhToan = () => {
  const ngayGio = moment().format("YYMMDDHHmmss");
  const soNgauNhien = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `PAY${ngayGio}${soNgauNhien}`;
};

const tinhSoNgay = (ngayBatDau, ngayKetThuc) => {
  const batDau = moment(ngayBatDau);
  const ketThuc = moment(ngayKetThuc);
  return ketThuc.diff(batDau, "days");
};

const kiemTraNgayHopLe = (ngayBatDau, ngayKetThuc) => {
  const batDau = moment(ngayBatDau);
  const ketThuc = moment(ngayKetThuc);
  const hienTai = moment();

  if (batDau.isBefore(hienTai, "day")) {
    return { hopLe: false, thongBao: "Ngày nhận phòng phải từ hôm nay trở đi" };
  }

  if (ketThuc.isSameOrBefore(batDau)) {
    return {
      hopLe: false,
      thongBao: "Ngày trả phòng phải sau ngày nhận phòng",
    };
  }

  return { hopLe: true };
};

const dinhDangTien = (soTien) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(soTien);
};

module.exports = {
  taoMaDatPhong,
  taoMaThanhToan,
  tinhSoNgay,
  kiemTraNgayHopLe,
  dinhDangTien,
};
