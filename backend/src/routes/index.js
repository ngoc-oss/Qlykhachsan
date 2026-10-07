const express = require('express');
const router = express.Router();

const authRoutes      = require('./authRoutes');
const troLyAiRoutes   = require('./troLyAiRoutes');
const phongRoutes     = require('./phongRoutes');
const khachHangRoutes = require('./khachHangRoutes');
const datPhongRoutes  = require('./datPhongRoutes');
const diaDiemRoutes   = require('./diaDiemRoutes');

router.use('/auth',       authRoutes);
router.use('/ai-chat',    troLyAiRoutes);
router.use('/phong',      phongRoutes);
router.use('/khach-hang', khachHangRoutes);
router.use('/dat-phong',  datPhongRoutes);
router.use('/dia-diem',   diaDiemRoutes);

module.exports = router;
