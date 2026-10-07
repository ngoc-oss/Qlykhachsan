const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middlewares/authMiddleware');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Thiếu username hoặc password' });

    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(401).json({ error: 'Tài khoản không tồn tại' });

    const ok = await user.checkPassword(password);
    if (!ok) return res.status(401).json({ error: 'Sai mật khẩu' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, hoTen: user.hoTen },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, hoTen: user.hoTen, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout (client-side just deletes token, but provide endpoint)
router.post('/logout', authMiddleware, (req, res) => {
  res.json({ message: 'Đăng xuất thành công' });
});

module.exports = router;
