const jwt = require("jsonwebtoken");
const { NguoiDung } = require("../models");

const xacThucToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        thanhCong: false,
        thongBao: "Không tìm thấy token xác thực",
      });
    }

    const giaiMa = jwt.verify(token, process.env.JWT_SECRET);
    const nguoiDung = await NguoiDung.findByPk(giaiMa.id);

    if (!nguoiDung || nguoiDung.trangThai !== "hoatdong") {
      return res.status(401).json({
        thanhCong: false,
        thongBao: "Token không hợp lệ hoặc tài khoản bị khóa",
      });
    }

    req.nguoiDung = nguoiDung;
    next();
  } catch (error) {
    return res.status(401).json({
      thanhCong: false,
      thongBao: "Token không hợp lệ hoặc đã hết hạn",
    });
  }
};

const kiemTraVaiTro = (...cacVaiTroChoPhep) => {
  return (req, res, next) => {
    if (!req.nguoiDung) {
      return res.status(401).json({
        thanhCong: false,
        thongBao: "Vui lòng đăng nhập",
      });
    }

    if (!cacVaiTroChoPhep.includes(req.nguoiDung.vaiTro)) {
      return res.status(403).json({
        thanhCong: false,
        thongBao: "Bạn không có quyền thực hiện thao tác này",
      });
    }

    next();
  };
};

module.exports = { xacThucToken, kiemTraVaiTro };
