const express = require('express');
const router = express.Router();
const KhachHang = require('../models/KhachHang');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// GET /api/khach-hang
router.get('/', async (req, res) => {
  try {
    const list = await KhachHang.findAll({ order: [['createdAt', 'DESC']] });
    res.json(list);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/khach-hang
router.post('/', async (req, res) => {
  try {
    const kh = await KhachHang.create(req.body);
    res.status(201).json(kh);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/khach-hang/:id
router.put('/:id', async (req, res) => {
  try {
    const kh = await KhachHang.findByPk(req.params.id);
    if (!kh) return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    await kh.update(req.body);
    res.json(kh);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/khach-hang/:id
router.delete('/:id', async (req, res) => {
  try {
    const kh = await KhachHang.findByPk(req.params.id);
    if (!kh) return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    await kh.destroy();
    res.json({ message: 'Đã xóa khách hàng' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
