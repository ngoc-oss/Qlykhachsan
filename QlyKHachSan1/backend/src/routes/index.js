const express = require("express");
const authRoutes = require("./authRoutes");
const phongRoutes = require("./phongRoutes");
const datPhongRoutes = require("./datPhongRoutes");
const khachHangRoutes = require("./khachHangRoutes");
const dichVuRoutes = require("./dichVuRoutes");
const thanhToanRoutes = require("./thanhToanRoutes");
const danhGiaRoutes = require("./danhGiaRoutes");
const nhanVienRoutes = require("./nhanVienRoutes");
const chatbotRoutes = require("./chatbotRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/phong", phongRoutes);
router.use("/dat-phong", datPhongRoutes);
router.use("/khach-hang", khachHangRoutes);
router.use("/dich-vu", dichVuRoutes);
router.use("/thanh-toan", thanhToanRoutes);
router.use("/danh-gia", danhGiaRoutes);
router.use("/nhan-vien", nhanVienRoutes);
router.use("/chatbot", chatbotRoutes);

router.get("/health", (req, res) => {
  res.json({
    thanhCong: true,
    thongBao: "Server đang hoạt động",
    thoiGian: new Date().toISOString(),
  });
});

module.exports = router;
