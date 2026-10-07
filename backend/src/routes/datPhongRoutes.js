const express = require('express');
const router = express.Router();
const DatPhong = require('../models/DatPhong');
const KhachHang = require('../models/KhachHang');
const Phong = require('../models/Phong');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// GET /api/dat-phong
router.get('/', async (req, res) => {
  try {
    const list = await DatPhong.findAll({
      include: [
        { model: KhachHang, as: 'khachHang', attributes: ['id','hoTen','sdt','email'] },
        { model: Phong, as: 'phong', attributes: ['id','soPhong','loai','tang','gia'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(list);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/dat-phong
router.post('/', async (req, res) => {
  try {
    const dp = await DatPhong.create(req.body);
    res.status(201).json(dp);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/dat-phong/:id
router.put('/:id', async (req, res) => {
  try {
    const dp = await DatPhong.findByPk(req.params.id);
    if (!dp) return res.status(404).json({ error: 'Không tìm thấy đặt phòng' });
    await dp.update(req.body);
    // Sync phong status
    if (req.body.trangThai) {
      const phong = await Phong.findByPk(dp.phongId);
      if (phong) {
        const map = { 'dang-o': 'dang-o', 'da-tra': 'don-dep', 'huy': 'trong', 'da-dat': phong.trangThai };
        await phong.update({ trangThai: map[req.body.trangThai] || phong.trangThai });
      }
    }
    res.json(dp);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/dat-phong/:id
router.delete('/:id', async (req, res) => {
  try {
    const dp = await DatPhong.findByPk(req.params.id);
    if (!dp) return res.status(404).json({ error: 'Không tìm thấy đặt phòng' });
    await dp.destroy();
    res.json({ message: 'Đã xóa đặt phòng' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
