/**
 * embeddingService.js — Module xử lý Dense Semantic Embedding cho RAG
 * 
 * Sử dụng Google Gemini Embedding API (models/gemini-embedding-001, vector 3072 chiều)
 * Không sử dụng Vector Database ngoài — lưu trữ & tìm kiếm in-memory cực nhanh cho ~84 chunks.
 *
 * Tính năng:
 * 1. getEmbedding(text): Sinh embedding cho câu query, có in-memory cache.
 * 2. generateKnowledgeEmbeddings(chunks): Sinh batch embedding cho toàn bộ knowledgeBase và lưu file.
 * 3. loadKnowledgeEmbeddings(): Đọc embeddings từ file JSON vào RAM khi khởi động.
 * 4. cosineSimilarity(vecA, vecB): Tính khoảng cách Cosine Similarity.
 * 5. semanticRetrieve(queryVec, chunks, embeddings, options): Trích xuất theo ngữ nghĩa.
 */

const fs   = require('fs');
const path = require('path');

const EMBEDDINGS_PATH = path.resolve(__dirname, '../data/knowledgeEmbeddings.json');
const KB_PATH         = path.resolve(__dirname, '../data/knowledgeBase.json');
const EMBEDDING_MODEL = 'models/gemini-embedding-001';

// Bộ nhớ đệm cho query embedding để tránh gọi lặp lại cùng một câu hỏi
const queryEmbeddingCache = new Map();
const MAX_CACHE_SIZE = 500;

// Bộ nhớ đệm in-memory cho toàn bộ knowledge embeddings
let _cachedKnowledgeEmbeddings = null;

function readDotenvValue(key) {
  try {
    const envPath = path.resolve(__dirname, '../../.env');
    const content = fs.readFileSync(envPath, 'utf8');
    const re = new RegExp(`^\\s*${key}\\s*=\\s*(.*)\\s*$`, 'm');
    const m = content.match(re);
    if (!m) return '';
    return String(m[1] || '').trim().replace(/^['"]|['"]$/g, '');
  } catch {
    return '';
  }
}

function getGeminiApiKey() {
  return (process.env.GEMINI_API_KEY || '').trim() || readDotenvValue('GEMINI_API_KEY');
}

/**
 * 1. Sinh vector embedding cho một chuỗi văn bản (dùng cho user query)
 * @param {string} text - Câu hỏi hoặc chuỗi cần embed
 * @returns {Promise<Array<number>|null>} Vector embedding hoặc null nếu lỗi
 */
async function getEmbedding(text) {
  if (!text || typeof text !== 'string') return null;
  const cleanText = text.trim();
  if (!cleanText) return null;

  // Kiểm tra cache
  if (queryEmbeddingCache.has(cleanText)) {
    return queryEmbeddingCache.get(cleanText);
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.warn('⚠️  EmbeddingService: Chưa cấu hình GEMINI_API_KEY.');
    return null;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`;
    const payload = {
      model: EMBEDDING_MODEL,
      content: {
        parts: [{ text: cleanText }]
      }
    };

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 4000);

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      console.warn(`⚠️  Embedding API trả về lỗi [${resp.status}]:`, errText.slice(0, 150));
      return null;
    }

    const data = await resp.json();
    const values = data?.embedding?.values;
    if (Array.isArray(values) && values.length > 0) {
      // Lưu vào cache
      if (queryEmbeddingCache.size >= MAX_CACHE_SIZE) {
        const firstKey = queryEmbeddingCache.keys().next().value;
        queryEmbeddingCache.delete(firstKey);
      }
      queryEmbeddingCache.set(cleanText, values);
      return values;
    }

    return null;
  } catch (err) {
    console.warn('⚠️  EmbeddingService getEmbedding lỗi (sẽ fallback về TF-IDF):', err.message);
    return null;
  }
}

/**
 * 2. Tính Cosine Similarity giữa 2 vector
 * @param {Array<number>} vecA 
 * @param {Array<number>} vecB 
 * @returns {number} Giá trị độ tương đồng từ -1.0 đến 1.0
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i];
    const b = vecB[i];
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 3. Tải Knowledge Embeddings từ file JSON vào bộ nhớ đệm
 * @param {boolean} forceReload - Ép nạp lại từ đĩa
 * @returns {Array<Object>|null}
 */
function loadKnowledgeEmbeddings(forceReload = false) {
  if (_cachedKnowledgeEmbeddings && !forceReload) {
    return _cachedKnowledgeEmbeddings;
  }

  try {
    if (!fs.existsSync(EMBEDDINGS_PATH)) {
      console.warn(`⚠️  Không tìm thấy ${EMBEDDINGS_PATH}. Cần sinh embedding trước.`);
      return null;
    }

    const raw = fs.readFileSync(EMBEDDINGS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      _cachedKnowledgeEmbeddings = parsed;
      console.log(`✅ EmbeddingService: Đã nạp ${_cachedKnowledgeEmbeddings.length} knowledge embeddings vào RAM.`);
      return _cachedKnowledgeEmbeddings;
    }
  } catch (err) {
    console.error('❌ Lỗi khi đọc knowledgeEmbeddings.json:', err.message);
  }
  return null;
}

/**
 * 4. Sinh vector embedding cho tất cả knowledge chunks và lưu ra file JSON
 * Sử dụng batchEmbedContents để gửi mỗi lần 15-20 chunks, tối ưu tốc độ & rate limit.
 * @param {Array<Object>} chunks - Danh sách chunks từ knowledgeBase.json
 * @returns {Promise<boolean>}
 */
async function generateKnowledgeEmbeddings(chunks) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Chưa cấu hình GEMINI_API_KEY trong .env');
  }

  let chunkList = chunks;
  if (!chunkList || !Array.isArray(chunkList) || chunkList.length === 0) {
    if (fs.existsSync(KB_PATH)) {
      chunkList = JSON.parse(fs.readFileSync(KB_PATH, 'utf8'));
    } else {
      throw new Error(`Không tìm thấy knowledgeBase tại ${KB_PATH}`);
    }
  }

  console.log(`\n⏳ Bắt đầu sinh Dense Embeddings cho ${chunkList.length} chunks (model: ${EMBEDDING_MODEL})...`);

  const BATCH_SIZE = 15;
  const results = [];

  for (let i = 0; i < chunkList.length; i += BATCH_SIZE) {
    const batch = chunkList.slice(i, i + BATCH_SIZE);
    const requests = batch.map(chunk => {
      const textToEmbed = [
        chunk.title || '',
        (chunk.tags || []).join(', '),
        chunk.content || ''
      ].filter(Boolean).join('\n');

      return {
        model: EMBEDDING_MODEL,
        content: {
          parts: [{ text: textToEmbed }]
        }
      };
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/${EMBEDDING_MODEL}:batchEmbedContents?key=${apiKey}`;
    
    let retries = 3;
    let success = false;

    while (retries > 0 && !success) {
      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests })
        });

        if (resp.ok) {
          const data = await resp.json();
          const embeddings = data?.embeddings || [];
          if (embeddings.length === batch.length) {
            for (let j = 0; j < batch.length; j++) {
              results.push({
                id: batch[j].id,
                title: batch[j].title,
                category: batch[j].category,
                embedding: embeddings[j].values
              });
            }
            success = true;
            console.log(`  ✓ Đã sinh embeddings [${results.length}/${chunkList.length}] chunks`);
          } else {
            throw new Error(`Số lượng embeddings trả về (${embeddings.length}) không khớp batch (${batch.length})`);
          }
        } else {
          const errText = await resp.text();
          console.warn(`  ⚠️ Batch API error (${resp.status}): ${errText.slice(0, 100)}. Chờ thử lại...`);
          await new Promise(res => setTimeout(res, 2000));
          retries--;
        }
      } catch (err) {
        console.warn(`  ⚠️ Lỗi gửi batch: ${err.message}. Thử lại...`);
        await new Promise(res => setTimeout(res, 2000));
        retries--;
      }
    }

    if (!success) {
      throw new Error(`Thất bại khi sinh embedding cho batch bắt đầu tại index ${i}`);
    }

    // Delay nhẹ giữa các batch để giữ an toàn rate limit
    await new Promise(res => setTimeout(res, 300));
  }

  // Ghi kết quả ra file
  fs.writeFileSync(EMBEDDINGS_PATH, JSON.stringify(results, null, 2), 'utf8');
  console.log(`🎉 Đã lưu thành công ${results.length} embeddings vào ${EMBEDDINGS_PATH}`);
  _cachedKnowledgeEmbeddings = results;
  return true;
}

/**
 * 5. Semantic Retrieval: Tìm kiếm các chunk liên quan nhất dựa trên Cosine Similarity
 * @param {Array<number>} queryEmbedding - Vector của câu hỏi
 * @param {Array<Object>} chunks - Danh sách chunks gốc
 * @param {Array<Object>} [knowledgeEmbeddings] - Danh sách embeddings (nếu null sẽ lấy từ cache)
 * @param {Object} [options] - { topK: 15, threshold: 0.25, category: null }
 * @returns {Array<Object>} Danh sách chunk kèm semanticScore
 */
function semanticRetrieve(queryEmbedding, chunks, knowledgeEmbeddings = null, options = {}) {
  const {
    topK = 15,
    threshold = 0.25,
    category = null
  } = options;

  if (!queryEmbedding || !Array.isArray(queryEmbedding)) return [];

  const embList = knowledgeEmbeddings || loadKnowledgeEmbeddings();
  if (!embList || embList.length === 0) return [];

  // Tạo map id -> embedding vector
  const embMap = new Map();
  for (const item of embList) {
    if (item.id && item.embedding) {
      embMap.set(item.id, item.embedding);
    }
  }

  const scored = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (category && chunk.category !== category) continue;

    const chunkVec = embMap.get(chunk.id);
    if (!chunkVec) continue;

    const similarity = cosineSimilarity(queryEmbedding, chunkVec);
    if (similarity >= threshold) {
      scored.push({
        ...chunk,
        semanticScore: Math.round(similarity * 1000) / 1000
      });
    }
  }

  // Sắp xếp giảm dần theo Cosine Similarity
  scored.sort((a, b) => b.semanticScore - a.semanticScore);
  return scored.slice(0, topK);
}

module.exports = {
  getEmbedding,
  cosineSimilarity,
  loadKnowledgeEmbeddings,
  generateKnowledgeEmbeddings,
  semanticRetrieve,
  EMBEDDINGS_PATH
};
