/**
 * Script tái sinh toàn bộ Dense Embeddings từ knowledgeBase.json
 * Chạy: node regen_embeddings.js
 */
require('dotenv').config();
const { generateKnowledgeEmbeddings } = require('./src/services/embeddingService');

(async () => {
  console.log('🔄 Đang tái sinh embeddings cho toàn bộ knowledge base...');
  try {
    const ok = await generateKnowledgeEmbeddings(null); // null → tự đọc knowledgeBase.json
    if (ok) {
      console.log('✅ Tái sinh embeddings thành công! Backend sẽ tự nạp lại khi restart.');
    } else {
      console.error('❌ Tái sinh embeddings thất bại.');
    }
  } catch (e) {
    console.error('❌ Lỗi:', e.message);
  }
})();
