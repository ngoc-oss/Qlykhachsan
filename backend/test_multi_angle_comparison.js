require('dotenv').config();
const ragService = require('./src/services/ragService');
ragService.buildIndex();

const { generateResponse, compareModels } = require('./src/services/troLyAiService');

async function runTest() {
  console.log('=== TEST 1: CÂU HỎI VỀ TIỆN ÍCH CÓ THẬT (HỒ BƠI VÔ CỰC) ===');
  const q1 = "Hồ bơi vô cực của khách sạn mở cửa từ mấy giờ và ở tầng mấy?";
  const res1 = await generateResponse(q1, null, [], null, 'customer');

  console.log(`\nSố model phản hồi: ${res1.allAnswers.length}`);
  res1.allAnswers.forEach((ans, idx) => {
    console.log(`\n[${ans.name}]:\n${ans.text}`);
  });

  console.log('\n--- ĐÁNH GIÁ SO SÁNH ĐA GÓC CẠNH CHO CÂU 1 ---');
  const comp1 = await compareModels(q1, res1.allAnswers, res1.contextText);
  console.log('🛡️ Zero Hallucination Verified:', comp1.antiHallucinationVerified);
  console.log('\n📐 CÁC GÓC CẠNH SO SÁNH:');
  comp1.angles.forEach(a => {
    console.log(`- ${a.title}:`);
    console.log(`  Model 1 (${comp1.modelDetails[0].name}): ${a.score1} | Model 2 (${comp1.modelDetails[1].name}): ${a.score2} => Winner: ${a.winner}`);
    console.log(`  Chi tiết 1: ${a.detail1}`);
    console.log(`  Chi tiết 2: ${a.detail2}`);
  });
  console.log(`\n💡 Khuyến nghị: ${comp1.recommendation}`);

  console.log('\n\n=== TEST 2: CÂU HỎI NGOÀI DỮ LIỆU (ANSWERABLE: FALSE) - CHỐNG ẢO GIÁC ===');
  const q2 = "Khách sạn có cho nuôi thú cưng là chuột hamster không?";
  const res2 = await generateResponse(q2, null, [], null, 'customer');

  console.log(`\nSố model phản hồi: ${res2.allAnswers.length}`);
  res2.allAnswers.forEach((ans, idx) => {
    console.log(`\n[${ans.name}]:\n${ans.text}`);
  });

  const comp2 = await compareModels(q2, res2.allAnswers, res2.contextText);
  console.log('\n📐 CÁC GÓC CẠNH SO SÁNH CÂU 2:');
  comp2.angles.forEach(a => {
    console.log(`- ${a.title}: M1=${a.score1} vs M2=${a.score2} => Winner: ${a.winner}`);
  });

  console.log('\n✅ TEST HOÀN TẤT!');
}

runTest().catch(console.error);
