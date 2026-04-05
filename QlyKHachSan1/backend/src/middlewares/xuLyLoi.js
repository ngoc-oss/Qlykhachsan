const xuLyLoi = (err, req, res, next) => {
  if (err.name === "SequelizeValidationError") {
    const cacLoi = err.errors.map((e) => e.message);
    return res.status(400).json({
      thanhCong: false,
      thongBao: "Dữ liệu không hợp lệ",
      chiTiet: cacLoi,
    });
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      thanhCong: false,
      thongBao: "Dữ liệu đã tồn tại trong hệ thống",
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      thanhCong: false,
      thongBao: "Token không hợp lệ",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      thanhCong: false,
      thongBao: "Token đã hết hạn",
    });
  }

  res.status(err.statusCode || 500).json({
    thanhCong: false,
    thongBao: err.message || "Đã xảy ra lỗi server",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = xuLyLoi;
