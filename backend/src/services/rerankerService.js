/**
 * rerankerService.js — Module Xếp hạng lại (Reranking Stage)
 * Luồng: Top 10 candidates -> Semantic Entity Coverage + Intent Alignment + Diversity (MMR) -> Top 3
 */

const { normalizeQuery } = require('./retrievalService');

/**
 * Phân tích ý định câu hỏi để gán trọng số phù hợp
 */
function analyzeIntent(queryLower) {
  const isPricing = /giá|bao nhiêu|tiền|chi phí|phụ phí|bảng giá|phạt/i.test(queryLower);
  const isTime    = /mấy giờ|thời gian|bao lâu|giờ|mở cửa|đóng cửa|khi nào/i.test(queryLower);
  const isRule    = /được không|có được|cho phép|cấm|quy định|chính sách/i.test(queryLower);
  const isBooking = /đặt phòng|hủy|hoàn tiền|check-in|check-out/i.test(queryLower);

  return { isPricing, isTime, isRule, isBooking };
}

/**
 * rerank(query, candidates, options)
 * @param {string} query - Câu hỏi của người dùng
 * @param {Array} candidates - Danh sách Top 10 chunks từ retrievalService
 * @param {Object} options - Tùy chọn { topK: 3 }
 * @returns {Array} Top 3 chunks sau khi được chấm điểm lại
 */
function rerank(query, candidates, options = {}) {
  const { topK = 3 } = options;

  if (!candidates || candidates.length === 0) return [];

  const norm = normalizeQuery(query);
  const qTokens = norm.tokens;
  const intent = analyzeIntent(norm.cleaned);

  // Chấm điểm Cross-Scoring cho từng candidate
  const reranked = candidates.map(chunk => {
    let score = chunk.retrievalScore || 0;
    const contentLower = (chunk.content || '').toLowerCase();
    const titleLower   = (chunk.title || '').toLowerCase();

    // 1. Semantic Coverage: Tỷ lệ token của câu hỏi xuất hiện trong chunk
    let matchCount = 0;
    for (const tok of qTokens) {
      if (contentLower.includes(tok) || titleLower.includes(tok)) {
        matchCount++;
      }
    }
    const coverageRatio = qTokens.length > 0 ? (matchCount / qTokens.length) : 0;
    score += coverageRatio * 1.5;

    // 2. Intent Alignment: Khớp loại hình câu hỏi
    if (intent.isPricing && (/\d+[\.,]?\d*\s*(vnđ|đồng|triệu|nghìn|k|%)/i.test(contentLower) || /giá|phí|tiền/i.test(contentLower))) {
      score += 0.8;
    }
    if (intent.isTime && (/\d{1,2}:\d{2}|\d+\s*(tiếng|giờ|phút|ngày)/i.test(contentLower) || /mở cửa|hoạt động/i.test(contentLower))) {
      score += 0.8;
    }
    if (intent.isRule && (/tuyệt đối cấm|không cho phép|quy định|chấp thuận|ngoại lệ/i.test(contentLower))) {
      score += 0.8;
    }

    // 3. Title Match Bonus (Nếu từ khóa cốt lõi nằm trên tiêu đề)
    for (const tok of qTokens) {
      if (titleLower.includes(tok)) score += 0.3;
    }

    return {
      ...chunk,
      rerankScore: Math.round(score * 1000) / 1000,
      coverageRatio: Math.round(coverageRatio * 100) / 100
    };
  });

  // Sắp xếp theo rerankScore giảm dần
  reranked.sort((a, b) => b.rerankScore - a.rerankScore);

  // 4. Lựa chọn theo NGƯỠNG THÍCH ỨNG (Dynamic Threshold + Tối đa Top 3)
  // Nếu ứng viên đứng đầu điểm quá thấp (< 1.8 và độ phủ < 0.15) -> câu hỏi nằm ngoài phạm vi, không chọn chunk nào
  if (reranked.length === 0 || (reranked[0].retrievalScore < 1.8 && reranked[0].coverageRatio < 0.15)) {
    return [];
  }

  const topScore = reranked[0].rerankScore;
  // Ngưỡng tối thiểu: chunk tiếp theo phải đạt ít nhất 55% điểm của chunk đứng đầu và >= 2.0
  const minThreshold = Math.max(2.0, topScore * 0.55);

  const selected = [];
  for (const item of reranked) {
    if (selected.length >= topK) break;

    // Nếu điểm không đạt ngưỡng thích ứng thì dừng lại
    if (item.rerankScore < minThreshold) {
      break;
    }

    // Kiểm tra trùng lặp nội dung với các chunk đã chọn
    let isTooRedundant = false;
    for (const picked of selected) {
      if (picked.id === item.id || picked.title === item.title) {
        isTooRedundant = true;
        break;
      }
    }

    if (!isTooRedundant) {
      selected.push({
        ...item,
        finalRank: selected.length + 1
      });
    }
  }

  // Nếu chưa có chunk nào đạt minThreshold nhưng top candidate đạt ngưỡng cơ bản
  if (selected.length === 0 && reranked[0].retrievalScore >= 2.2) {
    selected.push({ ...reranked[0], finalRank: 1 });
  }

  return selected;
}

module.exports = {
  analyzeIntent,
  rerank
};
