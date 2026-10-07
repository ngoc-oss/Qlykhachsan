const express = require('express');
const router = express.Router();
const Phong = require('../models/Phong');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Middleware chỉ cho phép Admin
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Chỉ quản trị viên (admin) mới có quyền thực hiện thao tác này.' });
  }
  next();
};

// GET /api/phong — Tất cả đều xem được
router.get('/', async (req, res) => {
  try {
    const phongs = await Phong.findAll({ order: [['tang', 'ASC'], ['soPhong', 'ASC']] });
    res.json(phongs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/phong — Chỉ Admin
router.post('/', adminOnly, async (req, res) => {
  try {
    const p = await Phong.create(req.body);
    res.status(201).json(p);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/phong/:id — Chỉ Admin
router.put('/:id', adminOnly, async (req, res) => {
  try {
    const p = await Phong.findByPk(req.params.id);
    if (!p) return res.status(404).json({ error: 'Không tìm thấy phòng' });
    await p.update(req.body);
    res.json(p);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/phong/:id — Chỉ Admin
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const p = await Phong.findByPk(req.params.id);
    if (!p) return res.status(404).json({ error: 'Không tìm thấy phòng' });
    await p.destroy();
    res.json({ message: 'Đã xóa phòng' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
