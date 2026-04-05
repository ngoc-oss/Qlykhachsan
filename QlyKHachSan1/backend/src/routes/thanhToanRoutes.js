const express = require("express");
const router = express.Router();
const thanhToanController = require("../controllers/thanhToanController");
const { xacThucToken, kiemTraVaiTro } = require("../middlewares/auth");

router.get(
  "/",
  xacThucToken,
  kiemTraVaiTro("admin", "letan"),
  thanhToanController.layDanhSach,
);

router.get(
  "/:id",
  xacThucToken,
  kiemTraVaiTro("admin", "letan"),
  thanhToanController.layChiTiet,
);

router.post(
  "/",
  xacThucToken,
  kiemTraVaiTro("admin", "letan"),
  thanhToanController.taoMoi,
);

router.patch(
  "/:id/xac-nhan",
  xacThucToken,
  kiemTraVaiTro("admin", "letan"),
  thanhToanController.xacNhan,
);

router.patch(
  "/:id/huy",
  xacThucToken,
  kiemTraVaiTro("admin", "letan"),
  thanhToanController.huy,
);

module.exports = router;
