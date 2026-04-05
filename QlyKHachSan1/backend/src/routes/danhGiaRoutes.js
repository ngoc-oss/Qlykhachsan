const express = require("express");
const router = express.Router();
const danhGiaController = require("../controllers/danhGiaController");
const { xacThucToken, kiemTraVaiTro } = require("../middlewares/auth");

router.get(
  "/",
  xacThucToken,
  kiemTraVaiTro("admin", "letan"),
  danhGiaController.layDanhSach,
);

router.get(
  "/:id",
  xacThucToken,
  kiemTraVaiTro("admin", "letan"),
  danhGiaController.layChiTiet,
);

router.post(
  "/",
  xacThucToken,
  kiemTraVaiTro("khach_hang", "admin", "letan"),
  danhGiaController.taoMoi,
);

router.put(
  "/:id",
  xacThucToken,
  kiemTraVaiTro("khach_hang", "admin", "letan"),
  danhGiaController.capNhat,
);

router.delete(
  "/:id",
  xacThucToken,
  kiemTraVaiTro("admin", "letan"),
  danhGiaController.xoa,
);

module.exports = router;
