/**
 * ragRoutes.js — API quản lý RAG Knowledge Base
 * Mount tại: /api/rag
 */

const express = require('express');
const router  = express.Router();
const ragService = require('../services/ragService');

// ─── GET /api/rag/status ──────────────────────────────────────────────────────
// Xem trạng thái index hiện tại (public — không cần auth để tiện debug)
router.get('/status', (req, res) => {
  try {
    const stats = ragService.getStats();
    res.json({
      success: true,
      ...stats,
      message: stats.isBuilt
        ? `✅ RAG sẵn sàng — ${stats.totalChunks} chunks, ${stats.totalTerms} terms`
        : '⚠️  RAG chưa được xây index',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/rag/search?q=...&topK=3&category=... ──────────────────────────────
// Test tìm kiếm chunk — yêu cầu đăng nhập (staff+)
const authMW = (req, res, next) => {
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'GrandPalacePMS_2026';
  const h = req.headers['authorization'] || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Cần đăng nhập' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' }); }
};

router.get('/search', authMW, async (req, res) => {
  try {
    const { q, topK, category } = req.query;
    if (!q) return res.status(400).json({ error: 'Thiếu tham số q (query)' });

    const k       = parseInt(topK) || 4;
    const results = await ragService.retrieve(q, k, category || null);

    res.json({
      success: true,
      query:   q,
      topK:    k,
      found:   results.length,
      results: results.map(r => ({
        id:       r.id,
        title:    r.title,
        category: r.category,
        score:    Math.round(r.score * 1000) / 1000,
        preview:  (r.content || '').slice(0, 120) + '...',
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/rag/rebuild ──────────────────────────────────────────────────
// Rebuild index sau khi chỉnh sửa knowledgeBase.json — yêu cầu role admin
router.post('/rebuild', authMW, (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Chỉ admin mới có quyền rebuild RAG index.' });
  }
  try {
    const ok = ragService.rebuildIndex();
    if (ok) {
      const stats = ragService.getStats();
      res.json({
        success: true,
        message: `✅ Rebuild thành công: ${stats.totalChunks} chunks, ${stats.totalTerms} terms`,
        stats,
      });
    } else {
      res.status(500).json({
        success: false,
        message: '❌ Rebuild thất bại — kiểm tra knowledgeBase.json',
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/rag/categories ──────────────────────────────────────────────────
// Danh sách tất cả categories trong knowledge base
router.get('/categories', (req, res) => {
  try {
    const stats = ragService.getStats();
    res.json({
      success: true,
      categories: stats.categories,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
