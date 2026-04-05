const express = require("express");
const router = express.Router();
const nhanVienController = require("../controllers/nhanVienController");
const { xacThucToken, kiemTraVaiTro } = require("../middlewares/auth");

router.get(
  "/",
  xacThucToken,
  kiemTraVaiTro("admin"),
  nhanVienController.layDanhSach,
);

router.get(
  "/:id",
  xacThucToken,
  kiemTraVaiTro("admin"),
  nhanVienController.layChiTiet,
);

router.post(
  "/",
  xacThucToken,
  kiemTraVaiTro("admin"),
  nhanVienController.taoMoi,
);

router.put(
  "/:id",
  xacThucToken,
  kiemTraVaiTro("admin"),
  nhanVienController.capNhat,
);

router.put(
  "/:id/doi-mat-khau",
  xacThucToken,
  kiemTraVaiTro("admin"),
  nhanVienController.doiMatKhau,
);

router.delete(
  "/:id",
  xacThucToken,
  kiemTraVaiTro("admin"),
  nhanVienController.xoa,
);

module.exports = router;
