const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { xacThucToken } = require("../middlewares/auth");

router.post("/dang-ky", authController.dangKy);
router.post("/dang-nhap", authController.dangNhap);
router.get("/thong-tin", xacThucToken, authController.layThongTinCaNhan);
router.put("/cap-nhat", xacThucToken, authController.capNhatThongTin);
router.put("/doi-mat-khau", xacThucToken, authController.doiMatKhau);

module.exports = router;
