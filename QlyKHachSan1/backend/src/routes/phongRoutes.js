const express = require("express");
const router = express.Router();
const phongController = require("../controllers/phongController");
const { xacThucToken, kiemTraVaiTro } = require("../middlewares/auth");

router.get("/cong-khai", phongController.layDanhSachCongKhai);
router.get("/cong-khai/phong-trong", phongController.layPhongTrongCongKhai);
router.get("/cong-khai/:id", phongController.layChiTietCongKhai);
router.get(
  "/cong-khai/:id/kiem-tra-co-san",
  phongController.kiemTraPhongCoSanCongKhai,
);

router.get("/", xacThucToken, phongController.layDanhSach);
router.get("/phong-trong", xacThucToken, phongController.layPhongTrong);
router.get("/:id", xacThucToken, phongController.layChiTiet);
router.post("/", xacThucToken, kiemTraVaiTro("admin"), phongController.taoMoi);
router.put(
  "/:id",
  xacThucToken,
  kiemTraVaiTro("admin"),
  phongController.capNhat,
);
router.delete(
  "/:id",
  xacThucToken,
  kiemTraVaiTro("admin"),
  phongController.xoa,
);
router.patch(
  "/:id/trang-thai",
  xacThucToken,
  kiemTraVaiTro("admin", "letan"),
  phongController.capNhatTrangThai,
);

module.exports = router;
