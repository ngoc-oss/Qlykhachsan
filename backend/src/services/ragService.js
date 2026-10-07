/**
 * ragService.js — RAG Engine thuần JavaScript (TF-IDF + Cosine Similarity)
 * Không cần vector database, hoạt động hoàn toàn in-memory.
 *
 * Chức năng:
 *  - buildIndex()       : Xây TF-IDF index từ knowledgeBase.json khi server khởi động
 *  - retrieve(query)    : Tìm top-K chunks liên quan nhất
 *  - buildRAGPrompt()   : Tạo prompt có ngữ cảnh cho LLM
 *  - getStats()         : Thống kê index hiện tại
 */

const fs   = require('fs');
const path = require('path');
const retrievalService = require('./retrievalService');
const rerankerService  = require('./rerankerService');

// ─── Constants ───────────────────────────────────────────────────────────────
const KB_PATH = path.resolve(__dirname, '../data/knowledgeBase.json');
const TOP_K   = 3;  // Chuẩn RAG 2-stage: Reranker lọc ra Top 3 chunks tinh túy nhất

// ─── Vietnamese stopwords ────────────────────────────────────────────────────
const STOPWORDS = new Set([
  'và','của','là','có','cho','với','trong','các','được','không','này','để',
  'một','những','về','tại','theo','khi','từ','đến','ra','vào','đây','đó',
  'thì','mà','hay','hoặc','như','nếu','đã','sẽ','đang','bị','bởi','vì',
  'tôi','bạn','anh','chị','em','khách','sạn','ạ','dạ','nhé','ơi',
  'ở','lên','xuống','trên','dưới','sau','trước','ngoài','trong','giữa',
  'rất','cũng','đều','chỉ','còn','lại','đi','thêm','hơn','nhất','nhưng',
]);

// ─── State ───────────────────────────────────────────────────────────────────
let _chunks   = [];   // Mảng chunk đầy đủ
let _tfidf    = [];   // TF-IDF vectors song song với _chunks
let _idf      = {};   // IDF map: term → giá trị IDF
let _isBuilt  = false;

// ─── Helpers: Text Processing ────────────────────────────────────────────────

// Bảng chuyển tiếng Việt có dấu → không dấu (để match chéo)
const VI_MAP = {
  à:'a',á:'a',â:'a',ã:'a',ả:'a',ạ:'a',ă:'a',ắ:'a',ặ:'a',ằ:'a',ẳ:'a',ẵ:'a',
  ấ:'a',ầ:'a',ẩ:'a',ẫ:'a',ậ:'a',
  è:'e',é:'e',ê:'e',ẽ:'e',ẻ:'e',ẹ:'e',ế:'e',ề:'e',ể:'e',ễ:'e',ệ:'e',
  ì:'i',í:'i',î:'i',ĩ:'i',ỉ:'i',ị:'i',
  ò:'o',ó:'o',ô:'o',õ:'o',ỏ:'o',ọ:'o',ơ:'o',ớ:'o',ờ:'o',ở:'o',ỡ:'o',ợ:'o',
  ố:'o',ồ:'o',ổ:'o',ỗ:'o',ộ:'o',
  ù:'u',ú:'u',û:'u',ũ:'u',ủ:'u',ụ:'u',ư:'u',ứ:'u',ừ:'u',ử:'u',ữ:'u',ự:'u',
  ỳ:'y',ý:'y',ỷ:'y',ỹ:'y',ỵ:'y',
  đ:'d',
};

/**
 * Bỏ dấu tiếng Việt
 */
function removeViDiacritics(str) {
  return str.replace(/[\u0080-\uFFFF]/g, ch => VI_MAP[ch] || ch);
}

/**
 * Chuẩn hóa text: lowercase, bỏ dấu, bỏ dấu câu, tách token, lọc stopword.
 * Sinh ra SONG SONG cả token gốc (có dấu) và token không dấu để tăng recall.
 */
function tokenize(text) {
  const lower = String(text || '').toLowerCase();
  const nodiac = removeViDiacritics(lower);

  const processStr = (s) => s
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t));

  const tokensOrig  = processStr(lower);
  const tokensNoDia = processStr(nodiac);

  // Hợp nhất không trùng
  const combined = [...new Set([...tokensOrig, ...tokensNoDia])];
  return combined;
}

/**
 * Tính Term Frequency cho một mảng token
 */
function computeTF(tokens) {
  const freq = {};
  for (const t of tokens) freq[t] = (freq[t] || 0) + 1;
  const total = tokens.length || 1;
  const tf = {};
  for (const t in freq) tf[t] = freq[t] / total;
  return tf;
}

/**
 * Xây IDF từ tất cả documents
 */
function computeIDF(allTokenSets) {
  const N   = allTokenSets.length;
  const df  = {};
  for (const tokens of allTokenSets) {
    const unique = new Set(tokens);
    for (const t of unique) df[t] = (df[t] || 0) + 1;
  }
  const idf = {};
  for (const t in df) {
    idf[t] = Math.log((N + 1) / (df[t] + 1)) + 1; // smoothed IDF
  }
  return idf;
}

/**
 * Tính TF-IDF vector từ TF và IDF
 */
function tfidfVector(tf, idf) {
  const vec = {};
  for (const t in tf) {
    if (idf[t]) vec[t] = tf[t] * idf[t];
  }
  return vec;
}

/**
 * Cosine Similarity giữa 2 TF-IDF vectors
 */
function cosineSim(vecA, vecB) {
  // Dot product
  let dot = 0;
  for (const t in vecA) {
    if (vecB[t]) dot += vecA[t] * vecB[t];
  }
  // Magnitudes
  const magA = Math.sqrt(Object.values(vecA).reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(Object.values(vecB).reduce((s, v) => s + v * v, 0));
  if (!magA || !magB) return 0;
  return dot / (magA * magB);
}

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Xây TF-IDF index từ knowledgeBase.json và nạp Dense Embeddings vào RAM.
 * Được gọi 1 lần khi server khởi động.
 */
function buildIndex() {
  try {
    if (!fs.existsSync(KB_PATH)) {
      console.warn('⚠️  RAG: Không tìm thấy knowledgeBase.json, bỏ qua RAG.');
      return false;
    }

    const raw   = fs.readFileSync(KB_PATH, 'utf8');
    _chunks     = JSON.parse(raw);

    if (!Array.isArray(_chunks) || _chunks.length === 0) {
      console.warn('⚠️  RAG: knowledgeBase.json rỗng.');
      return false;
    }

    // Tokenize từng chunk (kết hợp title + tags + content)
    const allTokenSets = _chunks.map(chunk => {
      const text = [
        chunk.title || '',
        (chunk.tags || []).join(' '),
        chunk.content || '',
      ].join(' ');
      return tokenize(text);
    });

    // Tính IDF
    _idf = computeIDF(allTokenSets);

    // Tính TF-IDF cho từng chunk
    _tfidf = allTokenSets.map(tokens => {
      const tf = computeTF(tokens);
      return tfidfVector(tf, _idf);
    });

    // Nạp Knowledge Embeddings vào RAM (in-memory)
    const embeddingService = require('./embeddingService');
    const embeddings = embeddingService.loadKnowledgeEmbeddings();
    const embCount = Array.isArray(embeddings) ? embeddings.length : 0;

    _isBuilt = true;
    const categories = [...new Set(_chunks.map(c => c.category))];
    console.log(`✅ RAG index đã xây xong: ${_chunks.length} chunks | ${Object.keys(_idf).length} terms | ${embCount} dense embeddings | Categories: ${categories.join(', ')}`);
    return true;
  } catch (err) {
    console.error('❌ RAG buildIndex lỗi:', err.message);
    return false;
  }
}

/**
 * Tìm kiếm tài liệu liên quan theo quy trình RAG 2 Giai đoạn:
 * 1. Retrieval: Hybrid Search (TF-IDF + Dense Embedding Cosine Similarity -> Reciprocal Rank Fusion RRF) -> Top 10
 * 2. Reranking: Semantic Coverage + Intent Alignment + Diversity (MMR) -> Top 3 (ngưỡng Dynamic Threshold)
 *
 * @param {string} query          — Câu hỏi của người dùng
 * @param {number} topK           — Số chunk tinh chọn (mặc định: 3)
 * @param {string} category       — Lọc category (optional)
 * @param {Object} options        — Tùy chọn { retrievalMode: 'hybrid' | 'lexical' }
 * @returns {Promise<Array>}      — Mảng Top 3 chunks chất lượng cao nhất
 */
async function retrieve(query, topK = TOP_K, category = null, options = {}) {
  if (!_isBuilt || !query) return [];

  const retrievalMode = options.retrievalMode || 'hybrid';

  // Giai đoạn 1: Thu thập Top 10 ứng viên tiềm năng qua RRF hoặc Lexical
  const candidates = await retrievalService.retrieveCandidates(query, _chunks, _tfidf, _idf, {
    topK: 10,
    retrievalMode,
    category
  });

  if (!candidates || candidates.length === 0) return [];

  // Giai đoạn 2: Xếp hạng lại và trích xuất Top 3 tinh túy nhất với Dynamic Threshold
  const reranked = rerankerService.rerank(query, candidates, { topK });

  return reranked.map(r => ({
    ...r,
    score: r.rerankScore || r.retrievalScore || 1
  }));
}

/**
 * Phiên bản synchronous của retrieve (chỉ dùng thuần Lexical TF-IDF)
 * Dùng cho các luồng synchronous cũ nếu cần
 */
function retrieveSync(query, topK = TOP_K, category = null) {
  if (!_isBuilt || !query) return [];

  const candidates = retrievalService.hybridRetrieve(query, _chunks, _tfidf, _idf, {
    topK: 10,
    threshold: 0.08,
    category
  });

  if (!candidates || candidates.length === 0) return [];

  const reranked = rerankerService.rerank(query, candidates, { topK });
  return reranked.map(r => ({
    ...r,
    score: r.rerankScore || r.retrievalScore || 1
  }));
}


/**
 * Xây prompt RAG có cấu trúc để gửi cho LLM
 * @param {string}  userQuery      — Câu hỏi gốc
 * @param {Array}   chunks         — Kết quả từ retrieve()
 * @param {Object}  customerInfo   — Thông tin khách hàng (optional)
 * @param {string}  mode           — 'customer' | 'staff' | 'general'
 * @param {Object}  realtimeData   — Dữ liệu thời gian thực { currentGuests, stats } (optional)
 * @returns {string}               — Prompt đầy đủ
 */
function buildRAGPrompt(userQuery, chunks, customerInfo = null, mode = 'customer', realtimeData = null) {
  const modeInstruction = {
    customer: 'Bạn là Lễ tân ảo thông minh của Khách sạn Grand Palace. Ưu tiên trả lời dựa vào tài liệu nội bộ khi có thông tin phù hợp. Nếu tài liệu nội bộ không đủ thông tin, hãy dùng kiến thức chung của bạn để trả lời một cách hữu ích — đừng từ chối hay bảo khách hàng đi hỏi chỗ khác.',
    staff:    'Bạn là Trợ lý nghiệp vụ cho nhân viên Khách sạn Grand Palace. Ưu tiên trả lời theo đúng quy trình trong tài liệu nội bộ. Nếu tài liệu chưa có thông tin, dùng kiến thức chuyên môn để hỗ trợ.',
    general:  'Bạn là Trợ lý AI thông minh của Khách sạn Grand Palace. Kết hợp thông tin từ tài liệu nội bộ và kiến thức chung để trả lời đầy đủ, hữu ích nhất có thể.',
  };

  let prompt = `${modeInstruction[mode] || modeInstruction.customer}\n\n`;

  // ─ Ngữ cảnh từ Knowledge Base
  if (chunks.length > 0) {
    prompt += `📚 THÔNG TIN TỪ TÀI LIỆU NỘI BỘ KHÁCH SẠN:\n`;
    prompt += `${'─'.repeat(50)}\n`;
    chunks.forEach((chunk, i) => {
      prompt += `[${i + 1}] ${chunk.title}\n`;
      prompt += `${chunk.content}\n\n`;
    });
    prompt += `${'─'.repeat(50)}\n\n`;
    prompt += `📌 QUY TẮC QUAN TRỌNG VỀ DỊCH VỤ / DỮ LIỆU NỘI BỘ (answerable: false):
- Nếu khách hỏi về một dịch vụ/tiện ích/chính sách của khách sạn mà TÀI LIỆU NỘI BỘ Ở TRÊN KHÔNG ĐỀ CẬP:
  👉 TUYỆT ĐỐI KHÔNG được tự suy luận rằng dịch vụ đó "không tồn tại" chỉ vì tài liệu không nhắc tới.
  👉 BẮT BUỘC trả lời rõ ràng: "Hiện tại trong dữ liệu/tài liệu nội bộ của khách sạn chưa tìm thấy thông tin về dịch vụ này."
- Chỉ khẳng định khách sạn không có khi tài liệu CÓ NÊU RÕ là không có (ví dụ: bãi đáp trực thăng tầng thượng, bồn tắm bùn tại khuôn viên).
- Với câu hỏi kiến thức chung ngoài khách sạn (địa lý, nấu ăn, lịch sử...): thoải mái giải đáp bằng kiến thức chung của bạn.\n\n`;
  } else {
    // Không có tài liệu liên quan
    prompt += `📌 LƯU Ý KHI KHÔNG CÓ TÀI LIỆU NỘI BỘ (answerable: false):
- Nếu hỏi về dịch vụ/tiện ích riêng của khách sạn mà không có dữ liệu: BẮT BUỘC trả lời: "Hiện tại trong dữ liệu nội bộ của khách sạn chưa tìm thấy thông tin về dịch vụ này." TUYỆT ĐỐI KHÔNG tự suy luận là khách sạn không tồn tại dịch vụ đó.
- Nếu là câu hỏi kiến thức phổ thông xã hội/đời sống: Hãy trả lời dựa trên kiến thức chung của bạn một cách thân thiện và chính xác.\n\n`;
  }

  prompt += `⚡ NGUYÊN TẮC TRẢ LỜI NGẮN GỌN & TRỰC DIỆN (BẮT BUỘC TUYỆT ĐỐI):
- Với các câu hỏi đơn giản (hỏi giờ mở cửa, hỏi giá xe, hỏi có được mang vào không, hỏi tỷ lệ hoàn tiền...):
  👉 Trả lời CỰC KỲ NGẮN GỌN, ĐI THẲNG VÀO TRỌNG TÂM TRONG 1 - 2 CÂU.
  👉 Trả lời trực tiếp ngay ở câu đầu tiên (Ví dụ: "Dạ không được mang vào phòng ạ...", "Dạ bể bơi mở cửa từ 06:00 đến 21:00 hàng ngày và miễn phí cho khách lưu trú ạ.", "Dạ tỷ lệ hoàn tiền là 0% (không được hoàn tiền) ạ...").
  👉 KHÔNG chào hỏi rườm rà, KHÔNG liệt kê lan man các quy định không liên quan, KHÔNG thêm đoạn kết dài dòng.
- Về động vật nuôi: Khi khách hỏi về bất kỳ loài động vật nào (như chuột hamster, sóc, thỏ, vẹt, chim...), hãy tự suy luận chúng là thú cưng/vật nuôi và áp dụng quy định cấm thú cưng của khách sạn.
- Chỉ dùng gạch đầu dòng khi khách yêu cầu bảng giá nhiều loại xe hoặc hướng dẫn quy trình nhiều bước.\n\n`;

  // ─ Danh sách khách đang lưu trú thời gian thực (dành cho staff/admin)
  if (realtimeData && realtimeData.currentGuests && realtimeData.currentGuests.length > 0) {
    const guests = realtimeData.currentGuests;
    prompt += `🏨 DANH SÁCH KHÁCH ĐANG LƯU TRÚ (THỜI GIAN THỰC — ${realtimeData.stats?.thoiGianHienTai || new Date().toLocaleString('vi-VN')}):\n`;
    prompt += `${'─'.repeat(60)}\n`;
    guests.forEach((g, i) => {
      prompt += `[${i + 1}] Phòng ${g.soPhong} (${g.loaiPhong}, Tầng ${g.tang}):\n`;
      prompt += `    • Khách: ${g.hoTen}${g.quocTich && g.quocTich !== 'Viet Nam' ? ' 🌍 ' + g.quocTich : ''}\n`;
      prompt += `    • SDT: ${g.sdt || 'N/A'} | CMND/Hộ chiếu: ${g.cmnd || 'N/A'}\n`;
      prompt += `    • Hạng thành viên: ${g.hang || 'Mới'} | Lưu trú lần thứ: ${g.soLanO || 1}\n`;
      prompt += `    • Check-in: ${g.checkIn} → Check-out dự kiến: ${g.checkOut}\n`;
      prompt += `    • Tổng tiền: ${Number(g.tongTien || 0).toLocaleString('vi-VN')}đ\n`;
      if (g.ghiChu) prompt += `    • Ghi chú: ${g.ghiChu}\n`;
    });
    prompt += `${'─'.repeat(60)}\n`;
    prompt += `📊 TỔNG QUAN: ${realtimeData.stats?.khachDangO || guests.length} khách đang ở | ${realtimeData.stats?.phongDangO || '?'} phòng có khách | ${realtimeData.stats?.phongTrong || '?'} phòng trống / ${realtimeData.stats?.tongSoPhong || '?'} phòng tổng\n\n`;
    prompt += `💡 QUY TẮC TRA CỨU THÔNG TIN KHÁCH (BẮT BUỘC):\n`;
    prompt += `- Khi được hỏi "phòng X đang có ai ở", "khách Y đang ở phòng mấy", "liệt kê khách đang ở"... → TRA CỨU CHÍNH XÁC trong bảng trên và trả lời đầy đủ.\n`;
    prompt += `- Khi hỏi về số phòng trống/số khách → Dùng số liệu TỔNG QUAN phía trên.\n`;
    prompt += `- TUYỆT ĐỐI không bịa thêm thông tin khách ngoài danh sách trên.\n\n`;
  }

  // ─ Thông tin khách hàng (cá nhân hóa)
  if (customerInfo) {
    prompt += `👤 THÔNG TIN KHÁCH HÀNG HIỆN TẠI:\n`;
    prompt += `${'─'.repeat(30)}\n`;
    prompt += `• Tên: ${customerInfo.hoTen || 'N/A'}\n`;
    prompt += `• Hạng thành viên: ${customerInfo.hang || 'Mới'}\n`;
    prompt += `• Số lần lưu trú: ${customerInfo.soLanO || 0} lần\n`;
    prompt += `• Tổng chi tiêu: ${Number(customerInfo.tongChiTieu || 0).toLocaleString('vi-VN')}đ\n`;
    if (customerInfo.ghiChu) {
      prompt += `• Ghi chú đặc biệt: ${customerInfo.ghiChu}\n`;
    }
    if (customerInfo.phongHienTai) {
      prompt += `• Phòng đang ở: ${customerInfo.phongHienTai}\n`;
    }
    prompt += `${'─'.repeat(30)}\n`;
    prompt += `💡 Hãy CÁ NHÂN HÓA câu trả lời phù hợp với hạng thành viên và lịch sử của khách. Gợi ý các ưu đãi/dịch vụ phù hợp với hạng ${customerInfo.hang || 'Mới'}.\n\n`;
  }

  // ─ Câu hỏi
  prompt += `❓ CÂU HỎI: ${userQuery}`;

  return prompt;
}

/**
 * Trả về thống kê của RAG index hiện tại
 */
function getStats() {
  const categories = {};
  for (const chunk of _chunks) {
    const cat = chunk.category || 'unknown';
    categories[cat] = (categories[cat] || 0) + 1;
  }
  return {
    isBuilt:    _isBuilt,
    totalChunks: _chunks.length,
    totalTerms:  Object.keys(_idf).length,
    categories,
    kbPath:      KB_PATH,
  };
}

/**
 * Rebuild index (dùng khi knowledge base bị chỉnh sửa)
 */
function rebuildIndex() {
  _chunks  = [];
  _tfidf   = [];
  _idf     = {};
  _isBuilt = false;
  return buildIndex();
}

/**
 * Kiểm tra RAG có sẵn sàng không
 */
function isReady() {
  return _isBuilt && _chunks.length > 0;
}

module.exports = {
  buildIndex,
  rebuildIndex,
  retrieve,
  buildRAGPrompt,
  getStats,
  isReady,
};
