const express = require("express");
const router = express.Router();
const dichVuController = require("../controllers/dichVuController");
const { xacThucToken, kiemTraVaiTro } = require("../middlewares/auth");

router.get(
  "/",
  xacThucToken,
  kiemTraVaiTro("admin", "letan"),
  dichVuController.layDanhSach,
);

router.get(
  "/:id",
  xacThucToken,
  kiemTraVaiTro("admin", "letan"),
  dichVuController.layChiTiet,
);

router.post("/", xacThucToken, kiemTraVaiTro("admin"), dichVuController.taoMoi);

router.put(
  "/:id",
  xacThucToken,
  kiemTraVaiTro("admin"),
  dichVuController.capNhat,
);

router.delete(
  "/:id",
  xacThucToken,
  kiemTraVaiTro("admin"),
  dichVuController.xoa,
);

module.exports = router;
