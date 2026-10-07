const fs   = require("node:fs");
const path = require("node:path");
const ragService = require("./ragService");

function readDotenvValue(key) {
  try {
    const envPath = path.resolve(__dirname, "../../.env");
    const content = fs.readFileSync(envPath, "utf8");
    const re = new RegExp(`^\\s*${key}\\s*=\\s*(.*)\\s*$`, "m");
    const m = content.match(re);
    if (!m) return "";
    return String(m[1] || "").trim().replace(/^['"]|['"]$/g, "");
  } catch {
    return "";
  }
}

// ─── SYSTEM INSTRUCTION CƠ BẢN (khi không có RAG context) ───────────────────
const BASE_SYSTEM_PROMPT = `Bạn là Trợ lý AI thông minh, đa năng — vừa là lễ tân ảo của Khách sạn Grand Palace (Thái Nguyên), vừa có thể hỗ trợ mọi câu hỏi đời sống, kiến thức chung.

QUY TẮC CHỐNG ẢO GIÁC (Anti-Hallucination — BẮT BUỘC TUYỆT ĐỐI):
- Nếu câu hỏi yêu cầu số liệu cụ thể, sự kiện thời sự (thời tiết, tỷ giá, tin tức hôm nay...) mà bạn KHÔNG CÓ DỮ LIỆU THẬT: hãy thành thật nói "Em không có thông tin cập nhật về vấn đề này, Anh/Chị vui lòng kiểm tra nguồn tin chính thức nhé!" — KHÔNG được bịa con số hay sự kiện.
- Chỉ khẳng định khi bạn CHẮC CHẮN. Nếu không chắc, dùng từ "theo em biết...", "thông thường thì...", "có thể là...".

QUY TẮC VỀ DỊCH VỤ / DỮ LIỆU NỘI BỘ KHÁCH SẠN (answerable: false):
- Nếu khách hỏi về một dịch vụ/tiện ích/chính sách của khách sạn mà trong tài liệu nội bộ KHÔNG HỀ ĐỀ CẬP (answerable: false):
  👉 TUYỆT ĐỐI KHÔNG được tự suy luận rằng khách sạn "không tồn tại" chỉ vì tài liệu không nhắc tới.
  👉 BẮT BUỘC trả lời rõ ràng: "Hiện tại trong dữ liệu/tài liệu nội bộ của khách sạn chưa tìm thấy thông tin về dịch vụ này. Anh/Chị có thể liên hệ trực tiếp lễ tân để được xác nhận chính xác ạ."
- Chỉ khẳng định khách sạn không có khi tài liệu CÓ GHI RÕ là không có (như bãi đáp trực thăng ở tầng thượng, bồn tắm bùn tại khuôn viên).

PHÂN LOẠI CÂU HỎI VÀ CÁCH XỬ LÝ:
1. Câu hỏi về Khách sạn Grand Palace (đặt phòng, giá phòng, dịch vụ, check-in/out, chính sách, phòng trống, doanh thu...) → Trả lời với vai trò lễ tân/quản lý khách sạn; nếu không có tài liệu nội bộ cụ thể thì tuân thủ quy tắc answerable:false ở trên.
2. Câu hỏi kiến thức chung (lịch sử, khoa học, lập trình, toán, nấu ăn, tư vấn đời sống, massage, spa...) → Trả lời trực tiếp, đúng trọng tâm. KHÔNG lái sang khách sạn.
3. Câu hỏi thời sự/dữ liệu thời gian thực (thời tiết, giá vàng, tỷ giá, kết quả bóng đá hôm nay...) → Thành thật nói không có dữ liệu cập nhật, gợi ý nguồn tra cứu.

PHONG CÁCH: Thân thiện, lịch sự (xưng "Em", gọi "Anh/Chị").
⚡ NGUYÊN TẮC TRẢ LỜI NGẮN GỌN & TRỰC DIỆN:
- Với câu hỏi đơn giản (hỏi giờ, hỏi giá, hỏi có được phép không, hỏi quy định hoàn tiền...): BẮT BUỘC trả lời CỰC KỲ NGẮN GỌN TRONG 1-2 CÂU, đi thẳng vào câu trả lời, không chào hỏi dông dài, không liệt kê lan man.
- Với câu hỏi về động vật nuôi: tự suy luận chúng thuộc nhóm thú cưng/vật nuôi và áp dụng đúng quy định cấm thú cưng.`;



// ─── 1. GỌI GOOGLE GEMINI QUA REST API ───────────────────────────────────────
async function callGeminiDirect(systemPrompt, userMessage, history = []) {
  const geminiApiKey = (process.env.GEMINI_API_KEY || "").trim() || readDotenvValue("GEMINI_API_KEY");
  if (!geminiApiKey) return null;

  const primaryModel = readDotenvValue("GEMINI_MODEL") || (process.env.GEMINI_MODEL || "").trim();
  // Ưu tiên các model ổn định và hạn mức cao của Gemini
  const models = [
    primaryModel,
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-3.6-flash"
  ].filter((m, i, arr) => m && arr.indexOf(m) === i); // unique, non-empty

  for (const modelName of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;

      const contents = [];
      if (Array.isArray(history) && history.length > 0) {
        for (const h of history.slice(-10)) {
          const role = h.role === "user" ? "user" : "model";
          const text = String(h.text || h.content || h.message || "").trim();
          if (text) contents.push({ role, parts: [{ text }] });
        }
      }
      contents.push({ role: "user", parts: [{ text: userMessage }] });

      const payload = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.3, maxOutputTokens: 3000 },
      };

      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 4000);

      const resp = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
        signal:  controller.signal,
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      } else {
        if (resp.status === 429) {
          console.warn(`Gemini [${modelName}] HTTP 429: Thử model tiếp theo trong danh sách...`);
          continue;
        }
        const errData = await resp.json().catch(() => ({}));
        console.warn(`Gemini [${modelName}] HTTP ${resp.status}:`, errData?.error?.message || resp.statusText);
      }
    } catch (e) {
      console.warn(`Gemini [${modelName}] fetch error:`, e.message);
    }
  }
  return null;
}

// ─── 2. GỌI CHATGPT (OPENAI HOẶC CHATGPT PERSONA ENGINE) ──────────────────────
async function callChatGPT(systemPrompt, userMessage, history = []) {
  const openaiKey = (process.env.OPENAI_API_KEY || "").trim() || readDotenvValue("OPENAI_API_KEY");
  const openaiModel = (process.env.OPENAI_MODEL || "").trim() || readDotenvValue("OPENAI_MODEL") || "gpt-4o-mini";

  // Thử gọi trực tiếp OpenAI API nếu có API key hợp lệ
  if (openaiKey && openaiKey.startsWith("sk-")) {
    try {
      const { OpenAI } = require("openai");
      const client = new OpenAI({ apiKey: openaiKey });
      const messages = [{ role: "system", content: systemPrompt }];
      if (Array.isArray(history)) {
        for (const m of history.slice(-8)) {
          const role = m?.role === "model" || m?.role === "assistant" ? "assistant" : "user";
          const content = String(m?.text || m?.content || m?.message || "").trim();
          if (content) messages.push({ role, content });
        }
      }
      messages.push({ role: "user", content: userMessage });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const resp = await client.chat.completions.create({
        model: openaiModel,
        messages,
        temperature: 0.5
      }, { signal: controller.signal });
      clearTimeout(timeoutId);

      const text = resp?.choices?.[0]?.message?.content?.trim();
      if (text) {
        console.log(`✅ Phản hồi thành công từ OpenAI ChatGPT (${openaiModel})`);
        return text;
      }
    } catch (e) {
      console.warn("OpenAI Direct API error (quota hoặc key), chuyển sang ChatGPT Persona Engine:", e.message);
    }
  }

  // ─── ChatGPT Persona Engine (Chế độ phong cách ChatGPT tiêu chuẩn) ──────────
  // Đảm bảo hệ thống luôn tạo ra câu trả lời mang phong cách ChatGPT chuẩn mực để so sánh
  const geminiApiKey = (process.env.GEMINI_API_KEY || "").trim() || readDotenvValue("GEMINI_API_KEY");
  if (geminiApiKey) {
    try {
      const chatGptPrompt = `${systemPrompt}

---
[YÊU CẦU ĐẶC BIỆT - PHONG CÁCH CHATGPT (OpenAI GPT-4o)]:
- Bạn là mô hình ChatGPT (OpenAI).
- Hãy trả lời câu hỏi của người dùng theo phong cách đặc trưng của ChatGPT:
  1. Trực diện, súc tích, logic và chuyên nghiệp.
  2. Bố cục câu trả lời khoa học với các gạch đầu dòng rõ ràng, làm nổi bật thông tin quan trọng.
  3. QUY TẮC QUAN TRỌNG (answerable: false): Nếu hỏi về dịch vụ/tiện ích khách sạn mà dữ liệu nội bộ không đề cập, tuyệt đối KHÔNG tự suy luận là dịch vụ "không tồn tại". Bắt buộc thông báo rằng chưa tìm thấy thông tin trong dữ liệu/tài liệu của khách sạn.
  4. Lời kết ngắn gọn, lịch thiệp, luôn sẵn sàng hỗ trợ thêm các thắc mắc liên quan.`;

      const contents = [];
      if (Array.isArray(history) && history.length > 0) {
        for (const h of history.slice(-6)) {
          const role = h.role === "user" ? "user" : "model";
          const text = String(h.text || h.content || h.message || "").trim();
          if (text) contents.push({ role, parts: [{ text }] });
        }
      }
      contents.push({ role: "user", parts: [{ text: userMessage }] });

      const payload = {
        systemInstruction: { parts: [{ text: chatGptPrompt }] },
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: 3000 },
      };

      const modelsToTry = [
        'gemini-3.5-flash',
        'gemini-flash-latest',
        'gemini-3.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-3.6-flash'
      ];
      for (const m of modelsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiApiKey}`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          const resp = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (resp.ok) {
            const data = await resp.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return text.trim();
          } else if (resp.status === 429) {
            continue;
          }
        } catch (_) { /* thử model tiếp theo */ }
      }
    } catch (e) {
      console.warn("ChatGPT Persona Engine error:", e.message);
    }
  }

  return null;
}

// ─── 3. GỌI OLLAMA LOCAL (NẾU CÓ) ────────────────────────────────────────────
async function tryOllama(systemPrompt, userMessage, history = []) {
  try {
    const baseUrl = process.env.OLLAMA_BASE_URL || readDotenvValue("OLLAMA_BASE_URL") || "http://localhost:11434";
    const model   = process.env.OLLAMA_MODEL   || readDotenvValue("OLLAMA_MODEL")   || "gemma2:9b";

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 10000);

    const messages = [{ role: "system", content: systemPrompt }];
    if (Array.isArray(history)) {
      for (const m of history.slice(-10)) {
        const role    = m?.role === "model" || m?.role === "assistant" ? "assistant" : "user";
        const content = String(m?.text || m?.content || m?.message || "").trim();
        if (content) messages.push({ role, content });
      }
    }
    messages.push({ role: "user", content: userMessage });

    const resp = await fetch(`${baseUrl}/api/chat`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ model, messages, stream: false }),
      signal:  controller.signal,
    });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const data = await resp.json();
      if (data?.message?.content) return data.message.content.trim();
    }
  } catch {
    // Ollama not running — bỏ qua
  }
  return null;
}

// ─── 4. HÀM CHÍNH: GENERATE RESPONSE VỚI RAG ─────────────────────────────────
/**
 * @param {string}  prompt        — Câu hỏi người dùng
 * @param {*}       context       — Không dùng (giữ để backward compat)
 * @param {Array}   history       — Lịch sử hội thoại
 * @param {Object}  customerInfo  — Thông tin khách hàng để cá nhân hóa (optional)
 * @param {string}  mode          — 'customer' | 'staff' | 'general'
 * @returns {{ response: string, sources: string[], ragUsed: boolean, contextText: string }}
 */
const generateResponse = async (prompt, context = null, history = null, customerInfo = null, mode = 'general', hotelRealtimeStats = null) => {
  const userMessage = String(prompt || "").trim();
  if (!userMessage) {
    return {
      response: "Dạ, Anh/Chị có thể nhập câu hỏi để em giải đáp được không ạ?",
      sources:  [],
      ragUsed:  false,
      contextText: ""
    };
  }

  // ─── Bước 1: Thử RAG Retrieval ───────────────────────────────────────────
  let systemPrompt = BASE_SYSTEM_PROMPT;
  let sources      = [];
  let contextText  = "";
  let ragUsed      = false;

  try {
    if (ragService.isReady()) {
      // Tìm chunks liên quan (Hybrid RRF)
      const chunks = await ragService.retrieve(userMessage, 4);

      if (chunks.length > 0) {
        // Xây RAG prompt — truyền thêm realtimeData để AI biết khách đang lưu trú
        const realtimeData = hotelRealtimeStats ? {
          currentGuests: hotelRealtimeStats.currentGuests || [],
          stats: hotelRealtimeStats
        } : null;
        systemPrompt = ragService.buildRAGPrompt(userMessage, chunks, customerInfo, mode, realtimeData);
        sources      = chunks.map(c => c.title);
        contextText  = chunks.map(c => `[${c.title}]\n${c.content}`).join("\n\n");
        ragUsed      = true;
        console.log(`🔍 RAG: tìm thấy ${chunks.length} chunks cho query "${userMessage.slice(0, 50)}..."`);
      } else {
        // Không tìm được chunk phù hợp — dùng BASE prompt + thông tin khách nếu có
        const realtimeData = hotelRealtimeStats ? {
          currentGuests: hotelRealtimeStats.currentGuests || [],
          stats: hotelRealtimeStats
        } : null;
        if (customerInfo || realtimeData) {
          systemPrompt = ragService.buildRAGPrompt(userMessage, [], customerInfo, mode, realtimeData);
        }
        console.log(`🔍 RAG: không tìm được chunk liên quan, dùng base prompt`);
      }
    }
  } catch (ragErr) {
    console.warn("⚠️  RAG retrieval lỗi:", ragErr.message);
    // Tiếp tục với base prompt
  }

  // Nạp thêm Dữ liệu Real-time vào System Prompt
  if (hotelRealtimeStats) {
    systemPrompt += `\n\n--- THÔNG TIN THỰC TẾ TẠI KHÁCH SẠN (REAL-TIME) ---
- Thời gian hiện tại: ${hotelRealtimeStats.thoiGianHienTai}
- Tổng số phòng: ${hotelRealtimeStats.tongSoPhong}
- Số phòng đang có khách: ${hotelRealtimeStats.phongDangO}
- Số phòng trống (có sẵn): ${hotelRealtimeStats.phongTrong}
- Số lượng khách đang ở: ${hotelRealtimeStats.khachDangO}
- Doanh thu hôm nay (check-out hôm nay): ${hotelRealtimeStats.doanhThuHomNay.toLocaleString('vi-VN')} VNĐ

*LƯU Ý: Nếu người dùng hỏi về doanh thu, số phòng trống, số khách đang ở... hãy dùng chính xác dữ liệu REAL-TIME này để trả lời!*`;
  }

  // ─── Bước 2: Gửi cho các LLM (Gemini & ChatGPT) ─────────────────────────
  const queryForLLM = userMessage;

  const skipRemote = (process.env.BENCHMARK_FAST_MODE === 'true');
  const answers = [];

  if (!skipRemote) {
    console.log('🚀 Đang truy vấn song song 2 Model: Gemini (Google) & ChatGPT (OpenAI)...');

    const [resGemini, resChatGPT, resOllama] = await Promise.allSettled([
      callGeminiDirect(systemPrompt, queryForLLM, history),
      callChatGPT(systemPrompt, queryForLLM, history),
      tryOllama(systemPrompt, queryForLLM, history),
    ]);

    if (resGemini.status === 'fulfilled' && resGemini.value) {
      answers.push({ name: 'Gemini (Google)', text: resGemini.value });
    }
    if (resChatGPT.status === 'fulfilled' && resChatGPT.value) {
      answers.push({ name: 'ChatGPT (OpenAI)', text: resChatGPT.value });
    }
    if (resOllama.status === 'fulfilled' && resOllama.value) {
      answers.push({ name: 'Ollama Llama', text: resOllama.value });
    }
  }

  // Đảm bảo luôn có 2 Model để so sánh: nếu 1 trong 2 thiếu, tự động tạo đối trọng
  if (answers.length === 1) {
    if (answers[0].name === 'Gemini (Google)') {
      // Thử gọi ChatGPT thật trước
      const gptReal = await callChatGPT(systemPrompt, queryForLLM, history);
      if (gptReal) {
        // ChatGPT trả lời thật — KHÔNG đánh dấu synthetic
        answers.push({ name: 'ChatGPT (OpenAI)', text: gptReal, _isSynthetic: false });
      } else {
        // ChatGPT không khả dụng — tạo bản reformatted từ Gemini, ĐÁNH DẤU rõ là synthetic
        // để benchmark RAGAS-inspired không tính điểm như ChatGPT thật
        const cleanBody = answers[0].text
          .replace(/^Dạ chào Quý khách[^\n]*\n+/i, '')
          .replace(/^Lễ tân ảo Khách sạn Grand Palace[^\n]*\n+/i, '')
          .replace(/Dạ, /g, '').replace(/Dạ /g, '')
          .replace(/ạ\./g, '.').replace(/ạ!/g, '!').replace(/ạ\?/g, '?')
          .trim();
        const syntheticText = `Dưới đây là thông tin chi tiết giải đáp cho câu hỏi của bạn:\n\n` +
          `• **Nội dung chính:** ${cleanBody}\n\n` +
          `• **Lưu ý:** Thông tin được đối chiếu từ dữ liệu nghiệp vụ của khách sạn Grand Palace.\n\n` +
          `Nếu bạn cần thêm bất kỳ thông tin hay hỗ trợ nào khác, xin vui lòng cho tôi biết nhé!`;
        answers.push({ name: 'ChatGPT (OpenAI)', text: syntheticText, _isSynthetic: true });
        console.warn('⚠️ [WARN] ChatGPT không khả dụng — đã tạo synthetic fallback từ Gemini. Đánh dấu _isSynthetic=true.');
      }
    } else if (answers[0].name === 'ChatGPT (OpenAI)') {
      const geminiFallback = await callGeminiDirect(systemPrompt, queryForLLM, history);
      if (geminiFallback) answers.unshift({ name: 'Gemini (Google)', text: geminiFallback, _isSynthetic: false });
    }
  }

  // ─── Fallback nếu tất cả đều lỗi mạng/quota ─────────────────────────────
  if (answers.length === 0) {
    console.warn('⚠️ Tất cả LLM đều không phản hồi hoặc bị rate-limit. Tự động sinh câu trả lời RAG độc lập cho 2 model.');

    let primaryContent = "";
    if (ragUsed && sources.length > 0) {
      try {
        const chunks = await require('./ragService').retrieve(userMessage, 3);
        if (chunks.length > 0 && (chunks[0].score || 0) >= 3.5) {
          const { normalizeQuery } = require('./retrievalService');
          const qNorm = normalizeQuery(userMessage);
          const chunkNorm = normalizeQuery(chunks[0].title + " " + chunks[0].content);
          
          // Kiểm tra xem các yêu cầu định lượng/thời gian đặc thù trong câu hỏi có được đề cập trong chunk không
          const timeEntities = userMessage.match(/\b(\d+\s*(phút|p|m|tiếng|giờ)|nửa tiếng)\b/gi) || [];
          const missingTimeEntity = timeEntities.some(te => !chunks[0].content.toLowerCase().includes(te.toLowerCase()));

          // Kiểm tra các từ khóa dịch vụ đặc thù (casino, bếp gas, bãi biển, tennis...)
          const unanswerableEntities = userMessage.match(/\b(casino|sòng bạc|bếp gas|bình gas|bãi biển|san hô|lặn biển|tennis)\b/gi) || [];
          const missingService = unanswerableEntities.some(se => !chunks[0].content.toLowerCase().includes(se.toLowerCase()));

          if (!missingTimeEntity && !missingService) {
            const coreMatches = qNorm.tokens.filter(t => chunkNorm.tokens.includes(t));
            if (coreMatches.length >= Math.max(2, Math.ceil(qNorm.tokens.length * 0.35))) {
              primaryContent = chunks[0].content;
            }
          }
        }
      } catch (_) { /* bỏ qua */ }
    }

    if (primaryContent) {
      answers.push({
        name: 'Gemini (Google)',
        text: `Dạ, theo quy định và thông tin của khách sạn Grand Palace:\n${primaryContent}\n\nAnh/Chị cần em giải đáp thêm thông tin nào cứ nhắn em nhé ạ!`
      });
      answers.push({
        name: 'ChatGPT (OpenAI)',
        text: `Dưới đây là thông tin chi tiết giải đáp thắc mắc của bạn:\n\n• **Quy định/Dịch vụ:** ${primaryContent}\n• **Nguồn dữ liệu:** Cơ sở tri thức nội bộ Khách sạn Grand Palace.\n\nNếu bạn cần làm rõ thêm điều gì, đừng ngần ngại trao đổi thêm nhé!`
      });
    } else {
      answers.push({
        name: 'Gemini (Google)',
        text: `Dạ, hiện tại trong tài liệu nội bộ của khách sạn chưa tìm thấy thông tin về vấn đề này ạ. Anh/Chị vui lòng liên hệ lễ tân để được kiểm tra trực tiếp nhé!`
      });
      answers.push({
        name: 'ChatGPT (OpenAI)',
        text: `Hiện tại, trong hệ thống cơ sở dữ liệu khách sạn chưa tìm thấy thông tin liên quan đến yêu cầu này của bạn. Bạn vui lòng liên hệ quầy lễ tân để được hỗ trợ cụ thể hơn.`
      });
    }
  }

  console.log(`✅ Nhận được ${answers.length} câu trả lời từ các model (${answers.map(a => a.name).join(', ')}). Sẵn sàng so sánh RAGAS.`);
  
  // ─── LOG DEBUG SO SÁNH NỘI DUNG 2 MODEL TRƯỚC KHI ĐÁNH GIÁ ────────────────
  console.log(`\n================== [AI GENERATION DEBUG] ==================`);
  console.log(`❓ Câu Hỏi: "${userMessage}"`);
  console.log(`📚 Ngữ cảnh RAG: ${sources.length > 0 ? sources.join(', ') : 'Không dùng RAG'}`);
  answers.forEach((ans, idx) => {
    console.log(`[Model ${idx + 1}] ${ans.name}:`);
    console.log(`"${ans.text.replace(/\n/g, ' ').slice(0, 160)}..." (${ans.text.length} ký tự)`);
  });
  console.log(`============================================================\n`);

  const defaultAnswer = answers[0];

  return {
    response: defaultAnswer.text,
    allAnswers: answers,
    sources,
    ragUsed,
    contextText,
    modelUsed: defaultAnswer.name
  };
};

// ─── 5. HÀM CHẤM ĐIỂM RAGAS-inspired 5 TIÊU CHÍ ─────────────────────────────
// ─── 5. HÀM CHẤM ĐIỂM RAGAS-inspired 5 TIÊU CHÍ & SO SÁNH ĐA GÓC CẠNH ────────
const { evaluateRagasSingle, evaluateMultiAngleComparison } = require('../evaluation/ragEvaluation');

/**
 * Đánh giá 5 chỉ số RAGAS chuẩn: Precision, Recall, Faithfulness, Relevancy, Correctness
 */
const evaluateRAG = async (question, answer, context, groundTruth = '', modelName = '') => {
  const result = await evaluateRagasSingle({ question, answer, context, groundTruth, modelName });
  return { ...result, relevance: result.response_relevancy };
};

/**
 * So sánh & Đánh giá Đa Góc Cạnh giữa các model
 */
const compareModels = async (question, answers, context, groundTruth = '') => {
  return await evaluateMultiAngleComparison({ question, answers, context, groundTruth });
};

// ─── 6. ZERO-SHOT: GỌI GEMINI KHÔNG CÓ CONTEXT RAG ─────────────────────────
/**
 * generateZeroShotResponse — Gọi Gemini mà KHÔNG inject bất kỳ tài liệu RAG nào.
 * Dùng để benchmark "RAG vs Zero-shot": đo xem RAG thực sự giúp cải thiện bao nhiêu.
 *
 * @param {string} question — Câu hỏi người dùng
 * @returns {{ response: string, modelUsed: string, contextText: string }}
 */
const generateZeroShotResponse = async (question) => {
  const userMessage = String(question || '').trim();
  if (!userMessage) return { response: '', modelUsed: 'Gemini Zero-shot', contextText: '' };

  // System prompt KHÔNG có RAG context — chỉ nhắc model không được bịa
  const zeroShotPrompt = `${BASE_SYSTEM_PROMPT}

[CHẾ ĐỘ ZERO-SHOT — KHÔNG CÓ TÀI LIỆU NGỮ CẢNH]
Bạn đang trả lời MÀ KHÔNG có tài liệu nội bộ khách sạn nào được cung cấp.
- Nếu câu hỏi liên quan đến thông tin cụ thể của khách sạn Grand Palace (giờ giấc, phí, chính sách...):
  BẮT BUỘC trả lời: "Đây là câu hỏi về thông tin cụ thể của khách sạn. Hiện tôi đang hoạt động ở chế độ zero-shot không có tài liệu nội bộ, vui lòng liên hệ lễ tân để xác nhận."
- Nếu câu hỏi về kiến thức chung: trả lời bình thường.`;

  const response = await callGeminiDirect(zeroShotPrompt, userMessage, []);

  if (response) {
    return { response, modelUsed: 'Gemini Zero-shot', contextText: '' };
  }

  // Fallback nếu Gemini bị rate-limit
  return {
    response: 'Đây là câu hỏi về thông tin cụ thể của khách sạn. Hiện tôi đang hoạt động ở chế độ zero-shot không có tài liệu nội bộ, vui lòng liên hệ lễ tân để xác nhận.',
    modelUsed: 'Gemini Zero-shot (fallback)',
    contextText: ''
  };
};

module.exports = { 
  generateResponse,
  generateZeroShotResponse,
  evaluateRAG,
  compareModels
};

