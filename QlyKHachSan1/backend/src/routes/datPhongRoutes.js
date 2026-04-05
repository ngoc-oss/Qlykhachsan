const express = require("express");
const router = express.Router();
const datPhongController = require("../controllers/datPhongController");
const { xacThucToken, kiemTraVaiTro } = require("../middlewares/auth");

router.post("/cong-khai", datPhongController.taoMoiCongKhai);

router.get(
  "/",
  xacThucToken,
  kiemTraVaiTro("admin", "letan", "nhanvien"),
  datPhongController.layDanhSach,
);
router.get(
  "/cua-toi",
  xacThucToken,
  kiemTraVaiTro("khach_hang"),
  datPhongController.layLichSuCuaToi,
);
router.get(
  "/:id",
  xacThucToken,
  kiemTraVaiTro("admin", "letan", "nhanvien"),
  datPhongController.layChiTiet,
);
router.post(
  "/",
  xacThucToken,
  kiemTraVaiTro("admin", "letan", "khach_hang"),
  datPhongController.taoMoi,
);
router.patch(
  "/:id/xac-nhan",
  xacThucToken,
  kiemTraVaiTro("admin", "letan"),
  datPhongController.xacNhan,
);
router.patch(
  "/:id/check-in",
  xacThucToken,
  kiemTraVaiTro("admin", "letan"),
  datPhongController.checkIn,
);
router.patch(
  "/:id/check-out",
  xacThucToken,
  kiemTraVaiTro("admin", "letan"),
  datPhongController.checkOut,
);
router.patch(
  "/:id/huy",
  xacThucToken,
  kiemTraVaiTro("admin", "letan"),
  datPhongController.huy,
);

module.exports = router;
