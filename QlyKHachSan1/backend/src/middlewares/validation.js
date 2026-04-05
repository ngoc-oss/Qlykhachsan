const { validationResult } = require("express-validator");

const kiemTraValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      thanhCong: false,
      thongBao: "Dữ liệu không hợp lệ",
      loi: errors.array().map((err) => ({
        truong: err.param,
        thongBao: err.msg,
      })),
    });
  }

  next();
};

module.exports = kiemTraValidation;
