const ragService = require('./src/services/ragService');
ragService.buildIndex();

const { evaluateRagasSingle } = require('./src/evaluation/ragEvaluation');
const { generateResponse, evaluateRAG } = require('./src/services/troLyAiService');

async function testFlow() {
  console.log('--- TEST 1: CHẠY HỘI THOẠI & SINH 2 CÂU TRẢ LỜI CHO GEMINI & CHATGPT ---');
  const question = "Khách sạn mình có bãi đáp trực thăng ở tầng thượng cho khách VIP không?";
  
  const chatRes = await generateResponse(question, null, [], null, 'customer');
  console.log(`Số lượng câu trả lời nhận được: ${chatRes.allAnswers.length}`);
  chatRes.allAnswers.forEach((ans, i) => {
    console.log(`\n[Model ${i + 1}] ${ans.name}:\n${ans.text}`);
  });

  if (chatRes.allAnswers.length >= 2) {
    console.log('\n--- TEST 2: ĐÁNH GIÁ RAGAS ĐỘC LẬP CHO TỪNG MODEL ---');
    const eval1 = await evaluateRAG(
      question,
      chatRes.allAnswers[0].text,
      chatRes.contextText,
      "Khách sạn không có bãi đáp trực thăng ở tầng thượng.",
      chatRes.allAnswers[0].name
    );

    const eval2 = await evaluateRAG(
      question,
      chatRes.allAnswers[1].text,
      chatRes.contextText,
      "Khách sạn không có bãi đáp trực thăng ở tầng thượng.",
      chatRes.allAnswers[1].name
    );

    console.log('\n📊 SO SÁNH ĐIỂM RAGAS GIỮA 2 MODEL:');
    console.table([
      {
        Model: chatRes.allAnswers[0].name,
        Precision: eval1.context_precision,
        Recall: eval1.context_recall,
        Faithfulness: eval1.faithfulness,
        Relevancy: eval1.response_relevancy,
        Correctness: eval1.answer_correctness,
        Overall: eval1.overall_score
      },
      {
        Model: chatRes.allAnswers[1].name,
        Precision: eval2.context_precision,
        Recall: eval2.context_recall,
        Faithfulness: eval2.faithfulness,
        Relevancy: eval2.response_relevancy,
        Correctness: eval2.answer_correctness,
        Overall: eval2.overall_score
      }
    ]);

    console.log('\n--- TEST 3: TEST CACHE KEY ĐA CHIỀU ---');
    console.log('Gọi lại evaluate cho Model 1 với cùng câu hỏi & câu trả lời:');
    const eval1_cached = await evaluateRAG(
      question,
      chatRes.allAnswers[0].text,
      chatRes.contextText,
      "Khách sạn không có bãi đáp trực thăng ở tầng thượng.",
      chatRes.allAnswers[0].name
    );
    console.log(`Kết quả lấy từ cache trùng khớp: ${eval1_cached.overall_score === eval1.overall_score}`);
  }

  console.log('\n--- TEST 4: KIỂM TRA QUY TẮC ANSWERABLE: FALSE ---');
  const unmentionedQ = "Khách sạn có dịch vụ giặt hấp vest lấy ngay trong 30 phút không?";
  const unmentionedContext = "[Dịch vụ phòng]: Khách sạn có dịch vụ dọn phòng hàng ngày từ 08:00 đến 17:00.";
  
  const badAns = "Khách sạn không có dịch vụ này.";
  const goodAns = "Hiện tại trong dữ liệu/tài liệu nội bộ của khách sạn chưa tìm thấy thông tin về dịch vụ giặt hấp vest lấy ngay 30 phút. Quý khách vui lòng liên hệ lễ tân để được kiểm tra chính xác.";

  const badEval = await evaluateRagasSingle({
    question: unmentionedQ,
    answer: badAns,
    context: unmentionedContext,
    groundTruth: "",
    modelName: "Bad Assertion Model"
  });

  const goodEval = await evaluateRagasSingle({
    question: unmentionedQ,
    answer: goodAns,
    context: unmentionedContext,
    groundTruth: "",
    modelName: "Compliant Answerable Model"
  });

  console.log(`Faithfulness (Tự suy luận không tồn tại): ${badEval.faithfulness}/10`);
  console.log(`Faithfulness (Nói rõ chưa tìm thấy trong dữ liệu): ${goodEval.faithfulness}/10`);
}

testFlow().then(() => console.log('\n✅ HOÀN TẤT TẤT CẢ CÁC BƯỚC TEST!')).catch(console.error);
