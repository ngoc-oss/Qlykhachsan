/**
 * retrievalService.js — Module trích xuất tài liệu (Retrieval Stage)
 * Luồng: User Query -> normalizeQuery() -> Hybrid Retrieval (TF-IDF + BM25/Exact match) -> Threshold -> Top 10
 */

// ─── Vietnamese Stopwords (Bao gồm cả có dấu & không dấu) ──────────────────
const STOPWORDS = new Set([
  'và','của','là','có','cho','với','trong','các','được','không','này','để',
  'một','những','về','tại','theo','khi','từ','đến','ra','vào','đây','đó',
  'thì','mà','hay','hoặc','như','nếu','đã','sẽ','đang','bị','bởi','vì',
  'tôi','bạn','anh','chị','em','khách','sạn','ạ','dạ','nhé','ơi',
  'ở','lên','xuống','trên','dưới','sau','trước','ngoài','giữa',
  'rất','cũng','đều','chỉ','còn','lại','đi','thêm','hơn','nhất','nhưng',
  'mình','hoạt','động',
  // Dạng không dấu tương ứng
  'va','cua','la','co','cho','voi','trong','cac','duoc','khong','nay','de',
  'mot','nhung','ve','tai','theo','khi','tu','den','ra','vao','day','do',
  'thi','ma','hay','hoac','nhu','neu','da','se','dang','bi','boi','vi',
  'toi','ban','anh','chi','em','khach','san','a','da','nhe','oi',
  'o','len','xuong','tren','duoi','sau','truoc','ngoai','giua',
  'rat','cung','deu','chi','con','lai','di','them','hon','nhat',
  'minh','hoat','dong'
]);

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

function removeViDiacritics(str) {
  return String(str || '').replace(/[\u0080-\uFFFF]/g, ch => VI_MAP[ch] || ch);
}

/**
 * 1. normalizeQuery(query) — Chuẩn hóa câu truy vấn của người dùng
 * Sinh ra cả token có dấu và không dấu để tăng tối đa khả năng match
 */
function normalizeQuery(query) {
  if (!query || typeof query !== 'string') return { text: '', tokens: [] };

  const rawLower = query.toLowerCase().trim();
  const cleaned  = rawLower.replace(/[^a-z0-9\sáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]/gu, ' ');
  const rawTokens = cleaned.split(/\s+/).filter(t => t.length > 0);

  const tokens = [];
  const seen = new Set();

  for (const t of rawTokens) {
    if (STOPWORDS.has(t)) continue;
    if (!seen.has(t)) {
      seen.add(t);
      tokens.push(t);
    }
    // Token không dấu
    const unaccent = removeViDiacritics(t);
    if (unaccent !== t && !seen.has(unaccent)) {
      seen.add(unaccent);
      tokens.push(unaccent);
    }
  }

  // ─── Semantic Concept Expansion (Mở rộng ngữ nghĩa thực thể) ───────────────
  // Khi người dùng hỏi tên động vật cụ thể -> tự động liên kết với khái niệm "thú cưng", "vật nuôi"
  if (/hamster|chuột|sóc|thỏ|nhím|chó|mèo|cún|chim|vẹt|bò sát|trăn|kỳ đà|pet/i.test(cleaned)) {
    ['thú cưng', 'vật nuôi', 'động vật', 'pet'].forEach(tok => {
      if (!seen.has(tok)) { seen.add(tok); tokens.push(tok); }
    });
  }
  // Khi hỏi về thuốc lá điện tử -> liên kết với khái niệm "hút thuốc", "thuốc lá"
  if (/vape|pod|iqos|shisha|thuốc lào/i.test(cleaned)) {
    ['hút thuốc', 'thuốc lá', 'cấm hút'].forEach(tok => {
      if (!seen.has(tok)) { seen.add(tok); tokens.push(tok); }
    });
  }
  // Khi hỏi về các loại phòng, hạng phòng của khách sạn
  if (/loại phòng|hạng phòng|các phòng|phòng nào|danh sách phòng|loai phong|hang phong|những phòng/i.test(cleaned)) {
    ['loại phòng', 'loai phong', 'phòng đơn', 'phòng đôi', 'suite', 'vip'].forEach(tok => {
      if (!seen.has(tok)) { seen.add(tok); tokens.push(tok); }
    });
  }

  return {
    raw: query,
    cleaned,
    tokens
  };
}

/**
 * 2. hybridRetrieve(query, chunks, tfidfVectors, idfMap, options)
 * Kết hợp Cosine TF-IDF + Keyword Overlap + Boost Title/Tags + Lọc Threshold
 * Trả về danh sách Top 10 ứng viên tốt nhất.
 */
function hybridRetrieve(query, chunks, tfidfVectors, idfMap, options = {}) {
  const {
    topK = 10,
    threshold = 0.08,
    category = null
  } = options;

  if (!chunks || chunks.length === 0) return [];

  const norm = normalizeQuery(query);
  const qTokens = norm.tokens;
  if (qTokens.length === 0) return [];

  // Tính vector TF-IDF cho câu truy vấn
  const qTf = {};
  for (const t of qTokens) qTf[t] = (qTf[t] || 0) + 1;

  const qVec = {};
  let qNormSq = 0;
  for (const [t, count] of Object.entries(qTf)) {
    const idf = idfMap[t] || Math.log(chunks.length + 1);
    const val = (count / qTokens.length) * idf;
    qVec[t] = val;
    qNormSq += val * val;
  }
  const qMag = Math.sqrt(qNormSq);

  const scored = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (category && chunk.category !== category) continue;

    const docVec = tfidfVectors[i] || {};
    let dot = 0;
    let docNormSq = 0;

    for (const [term, val] of Object.entries(docVec)) {
      docNormSq += val * val;
      if (qVec[term]) {
        dot += val * qVec[term];
      }
    }

    const docMag = Math.sqrt(docNormSq);
    let cosine = (qMag > 0 && docMag > 0) ? (dot / (qMag * docMag)) : 0;

    // Keyword Match Boost (Tiêu đề, tags & nội dung)
    let keywordBonus = 0;
    const titleNorm = normalizeQuery(chunk.title).tokens;
    const tagsNorm = normalizeQuery((chunk.tags || []).join(' ')).tokens;
    const contentNorm = normalizeQuery(chunk.content).tokens;

    for (const token of qTokens) {
      if (titleNorm.includes(token))   keywordBonus += 0.25;
      if (tagsNorm.includes(token))    keywordBonus += 0.20;
      if (contentNorm.includes(token)) keywordBonus += 0.05;
    }

    // Exact phrase bonus nếu cụm từ người dùng xuất hiện nguyên vẹn trong chunk
    const queryLower = norm.cleaned;
    if (queryLower.length > 5 && (chunk.content.toLowerCase().includes(queryLower) || chunk.title.toLowerCase().includes(queryLower))) {
      keywordBonus += 0.5;
    }

    const hybridScore = cosine + keywordBonus;

    // Áp dụng Threshold lọc bỏ chunk quá thấp
    if (hybridScore >= threshold) {
      scored.push({
        ...chunk,
        retrievalScore: Math.round(hybridScore * 1000) / 1000,
        cosineScore: Math.round(cosine * 1000) / 1000,
        keywordBonus: Math.round(keywordBonus * 1000) / 1000,
      });
    }
  }

  // Sắp xếp giảm dần và lấy Top K (Top 10)
  scored.sort((a, b) => b.retrievalScore - a.retrievalScore);
  return scored.slice(0, topK);
}

/**
 * 3. reciprocalRankFusion(lexicalResults, semanticResults, options)
 * Hợp nhất hai bảng xếp hạng (Lexical & Dense Semantic) bằng thuật toán Reciprocal Rank Fusion (RRF)
 * Công thức: RRF_score(d) = sum_{m in models} 1 / (k + rank_m(d)), với k = 60
 *
 * @param {Array<Object>} lexicalResults - Danh sách từ TF-IDF / Keyword
 * @param {Array<Object>} semanticResults - Danh sách từ Cosine Embedding
 * @param {Object} options - { k: 60, topK: 10 }
 * @returns {Array<Object>} Top K ứng viên sau hợp nhất
 */
function reciprocalRankFusion(lexicalResults = [], semanticResults = [], options = {}) {
  const { k = 60, topK = 10 } = options;

  const docMap = new Map();

  // 1. Duyệt danh sách Lexical (TF-IDF)
  lexicalResults.forEach((doc, idx) => {
    const rank = idx + 1; // 1-based rank
    const rrfContribution = 1 / (k + rank);

    docMap.set(doc.id, {
      chunk: doc,
      rrfScore: rrfContribution,
      lexicalRank: rank,
      semanticRank: null,
      lexicalScore: doc.retrievalScore || 0,
      semanticScore: 0
    });
  });

  // 2. Duyệt danh sách Semantic (Cosine Embedding)
  semanticResults.forEach((doc, idx) => {
    const rank = idx + 1; // 1-based rank
    const rrfContribution = 1 / (k + rank);

    if (docMap.has(doc.id)) {
      const existing = docMap.get(doc.id);
      existing.rrfScore += rrfContribution;
      existing.semanticRank = rank;
      existing.semanticScore = doc.semanticScore || 0;
    } else {
      docMap.set(doc.id, {
        chunk: doc,
        rrfScore: rrfContribution,
        lexicalRank: null,
        semanticRank: rank,
        lexicalScore: 0,
        semanticScore: doc.semanticScore || 0
      });
    }
  });

  // 3. Chuyển map thành mảng và sắp xếp giảm dần theo RRF Score
  const fused = Array.from(docMap.values());
  fused.sort((a, b) => b.rrfScore - a.rrfScore);

  // 4. Định dạng lại từng candidate cho rerankerService
  return fused.slice(0, topK).map((item, idx) => {
    const chunk = item.chunk;
    // Chuẩn hóa điểm tương thích với threshold của rerankerService
    // Kết hợp cả lexicalScore + semanticScore + rrfScore
    const baseRetrievalScore = (item.lexicalScore || 0) + ((item.semanticScore || 0) * 3.2);

    const adjustedRetrievalScore = Math.round((baseRetrievalScore + (item.rrfScore * 25)) * 1000) / 1000;

    return {
      ...chunk,
      retrievalScore: adjustedRetrievalScore,
      rrfScore: Math.round(item.rrfScore * 100000) / 100000,
      rrfRank: idx + 1,
      lexicalRank: item.lexicalRank,
      semanticRank: item.semanticRank,
      lexicalScore: item.lexicalScore,
      semanticScore: item.semanticScore
    };
  });
}

/**
 * 4. retrieveCandidates(query, chunks, tfidfVectors, idfMap, options)
 * Bộ trích xuất ứng viên linh hoạt: Hỗ trợ cả 'hybrid' (Lexical + Semantic RRF) và 'lexical' (chỉ TF-IDF)
 * Tự động fallback về TF-IDF nếu embedding API lỗi hoặc chưa sẵn sàng.
 */
async function retrieveCandidates(query, chunks, tfidfVectors, idfMap, options = {}) {
  const {
    topK = 10,
    retrievalMode = 'hybrid', // 'hybrid' | 'lexical'
    category = null
  } = options;

  // Nhánh 1: Chạy Lexical Retrieval (TF-IDF + Keyword)
  // Lấy Top 15 để có tập ứng viên phong phú cho RRF
  const lexicalTopK = (retrievalMode === 'hybrid') ? 15 : topK;
  const lexicalCandidates = hybridRetrieve(query, chunks, tfidfVectors, idfMap, {
    topK: lexicalTopK,
    threshold: 0.08,
    category
  });

  // Nếu người dùng chọn chế độ thuần Lexical, trả về luôn
  if (retrievalMode === 'lexical') {
    return lexicalCandidates.slice(0, topK);
  }

  // Nhánh 2: Dense Semantic Retrieval
  try {
    const embeddingService = require('./embeddingService');
    const queryEmbedding = await embeddingService.getEmbedding(query);

    if (queryEmbedding && Array.isArray(queryEmbedding)) {
      const semanticCandidates = embeddingService.semanticRetrieve(queryEmbedding, chunks, null, {
        topK: 15,
        threshold: 0.25,
        category
      });

      // Kết hợp 2 nguồn qua Reciprocal Rank Fusion
      const fusedCandidates = reciprocalRankFusion(lexicalCandidates, semanticCandidates, {
        k: 60,
        topK
      });

      if (fusedCandidates.length > 0) {
        return fusedCandidates;
      }
    } else {
      console.warn('⚠️  [RetrievalService] Không lấy được query embedding, tự động fallback về Lexical (TF-IDF).');
    }
  } catch (err) {
    console.warn('⚠️  [RetrievalService] Lỗi Semantic Retrieval, tự động fallback về Lexical:', err.message);
  }

  // Fallback an toàn về Lexical Top 10
  return lexicalCandidates.slice(0, topK);
}

module.exports = {
  normalizeQuery,
  hybridRetrieve,
  reciprocalRankFusion,
  retrieveCandidates,
  removeViDiacritics,
  STOPWORDS
};

