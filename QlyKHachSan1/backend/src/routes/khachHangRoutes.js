const express = require("express");
const router = express.Router();
const khachHangController = require("../controllers/khachHangController");
const { xacThucToken, kiemTraVaiTro } = require("../middlewares/auth");

router.get(
  "/",
  xacThucToken,
  kiemTraVaiTro("admin", "letan"),
  khachHangController.layDanhSach,
);

router.get(
  "/:id",
  xacThucToken,
  kiemTraVaiTro("admin", "letan"),
  khachHangController.layChiTiet,
);

router.post(
  "/",
  xacThucToken,
  kiemTraVaiTro("admin"),
  khachHangController.taoMoi,
);

router.put(
  "/:id",
  xacThucToken,
  kiemTraVaiTro("admin"),
  khachHangController.capNhat,
);

router.delete(
  "/:id",
  xacThucToken,
  kiemTraVaiTro("admin"),
  khachHangController.xoa,
);

module.exports = router;
