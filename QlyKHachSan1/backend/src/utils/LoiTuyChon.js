class LoiTuyChon extends Error {
  constructor(thongBao, maLoi = 400) {
    super(thongBao);
    this.statusCode = maLoi;
    this.name = "LoiTuyChon";
  }
}

module.exports = LoiTuyChon;
