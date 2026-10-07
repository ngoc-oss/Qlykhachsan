/**
 * troLyAiRoutes.js — Route cho chatbot AI có tích hợp RAG
 * Mount tại: /api/ai-chat
 *
 * Body nhận vào:
 *  - message    {string}  — Câu hỏi người dùng (bắt buộc)
 *  - history    {Array}   — Lịch sử hội thoại (optional)
 *  - customerId {number}  — ID khách hàng để cá nhân hóa (optional)
 *  - mode       {string}  — 'customer' | 'staff' | 'general' (optional, default: 'general')
 *
 * Response:
 *  - response   {string}  — Câu trả lời AI
 *  - sources    {string[]}— Tên các tài liệu RAG được dùng
 *  - ragUsed    {boolean} — Có dùng RAG không
 */

const express    = require('express');
const router     = express.Router();
const { generateResponse, evaluateRAG, compareModels } = require('../services/troLyAiService');

// ─── In-memory data access (injected by server.js) ───────────────────────────
// Server.js sẽ gắn memKhachHangs và memDatPhongs vào app.locals
function getCustomerInfo(req, customerId) {
  try {
    if (!customerId) return null;
    const id = parseInt(customerId);
    if (isNaN(id)) return null;

    const { memKhachHangs, memDatPhongs, memPhongs } = req.app.locals;

    // Tìm khách hàng
    const kh = (memKhachHangs || []).find(k => k.id === id);
    if (!kh) return null;

    // Tìm đặt phòng hiện tại (đang ở)
    const dp = (memDatPhongs || []).find(d => d.khachHangId === id && d.trangThai === 'dang-o');
    let phongHienTai = null;
    if (dp) {
      const phong = (memPhongs || []).find(p => p.id === dp.phongId);
      phongHienTai = phong ? `${phong.loai} - Phòng ${phong.soPhong} (Tầng ${phong.tang})` : null;
    }

    return { ...kh, phongHienTai };
  } catch {
    return null;
  }
}

// ─── POST /api/ai-chat (main endpoint) ───────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { message, history, customerId, mode } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Thiếu tin nhắn' });
    }

    // Lấy thông tin khách hàng nếu có customerId
    const customerInfo = getCustomerInfo(req, customerId);

    // Xác định mode
    const chatMode = ['customer', 'staff', 'general'].includes(mode) ? mode : 'general';

    const result = await generateResponse(message, undefined, history, customerInfo, chatMode);

    // Hỗ trợ cả response dạng cũ (string) và mới (object)
    if (typeof result === 'string') {
      return res.json({ response: result, sources: [], ragUsed: false });
    }

    res.json(result);
  } catch (error) {
    console.error('AI route error:', error);
    res.status(500).json({ error: 'Lỗi server AI' });
  }
});

// ─── POST /api/ai-chat/ai-chat (backward compat) ─────────────────────────────
router.post('/ai-chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Thiếu tin nhắn' });
    }
    const result = await generateResponse(message, undefined, history);
    if (typeof result === 'string') {
      return res.json({ response: result, sources: [], ragUsed: false });
    }
    res.json(result);
  } catch (error) {
    console.error('AI route error:', error);
    res.status(500).json({ error: 'Lỗi server AI' });
  }
});
// ─── POST /api/ai-chat/evaluate (RAGAS 5 Tiêu Chí) ─────────────────────────────
router.post('/evaluate', async (req, res) => {
  try {
    const { question, answer, context, groundTruth, modelName } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'Thiếu dữ liệu để chấm điểm' });
    }
    const result = await evaluateRAG(question, answer, context, groundTruth || "", modelName || "");
    res.json(result);
  } catch (error) {
    console.error('AI Evaluate error:', error);
    res.status(500).json({ error: 'Lỗi server chấm điểm' });
  }
});

// ─── POST /api/ai-chat/compare (So sánh & Đánh giá Đa Góc Cạnh 2 Model) ─────────
router.post('/compare', async (req, res) => {
  try {
    const { question, answers, context, groundTruth } = req.body;
    if (!question || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Thiếu dữ liệu câu hỏi hoặc danh sách câu trả lời của các model' });
    }
    const result = await compareModels(question, answers, context || "", groundTruth || "");
    res.json(result);
  } catch (error) {
    console.error('AI Compare error:', error);
    res.status(500).json({ error: 'Lỗi server so sánh model' });
  }
});

// ─── GET /api/ai-chat/benchmark ───────────────────────────────────────────────
router.get('/benchmark', async (req, res) => {
  try {
    const { runBatchBenchmark } = require('../evaluation/ragEvaluation');
    const result = await runBatchBenchmark();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
