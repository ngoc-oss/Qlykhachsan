/**
 * seed_knowledge.js — Đồng bộ dữ liệu từ hotelFacts.json sang knowledgeBase.json
 * Luồng: hotelFacts.json -> seed_knowledge.js -> knowledgeBase.json -> Index
 */

const fs   = require('fs');
const path = require('path');

const factsPath = path.join(__dirname, 'hotelFacts.json');
const kbPath    = path.join(__dirname, 'knowledgeBase.json');

function syncFactsToKnowledgeBase() {
  console.log('🔄 Đang đồng bộ dữ liệu từ hotelFacts.json sang knowledgeBase.json...');

  if (!fs.existsSync(factsPath)) {
    console.error('❌ Không tìm thấy file hotelFacts.json tại:', factsPath);
    return false;
  }

  const facts = JSON.parse(fs.readFileSync(factsPath, 'utf8'));
  let kb = [];
  if (fs.existsSync(kbPath)) {
    try {
      kb = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
    } catch {
      kb = [];
    }
  }

  // Chuyển đổi các sự thật nguyên tử từ hotelFacts.json thành các RAG chunks chất lượng cao
  const factChunks = [
    {
      id: "fact_hotel_profile",
      category: "chinh-sach",
      tags: ["thông tin khách sạn", "grand palace", "check-in", "check-out", "giờ nhận phòng", "giờ trả phòng", "early check-in", "late check-out"],
      title: "Thông tin tổng quan, Tiêu chuẩn và Giờ nhận/trả phòng",
      content: `${facts.hotel_profile.name} là ${facts.hotel_profile.standard} tọa lạc tại ${facts.hotel_profile.location}. Giờ check-in tiêu chuẩn là ${facts.hotel_profile.check_in_time}. Giờ check-out tiêu chuẩn là ${facts.hotel_profile.check_out_time}. Quy định Early Check-in: ${facts.hotel_profile.early_check_in}. Quy định Late Check-out: ${facts.hotel_profile.late_check_out}.`
    },
    {
      id: "policy_pet_strict",
      category: "chinh-sach",
      tags: ["thú cưng", "vật nuôi", "chó mèo", "mang thú", "động vật", "pet"],
      title: "Quy định về Thú cưng và Động vật nuôi trong khách sạn",
      content: `${facts.policies.pets.strict_rule} Phụ phí làm sạch và khử khuẩn phòng nếu vi phạm là ${facts.policies.pets.penalty_cleaning_fee.toLocaleString('vi-VN')} VNĐ. Ngoại lệ duy nhất: ${facts.policies.pets.exception}`
    },
    {
      id: "policy_smoking_vape_strict",
      category: "chinh-sach",
      tags: ["hút thuốc", "thuốc lá điện tử", "vape", "pod", "iqos", "shisha", "cấm hút thuốc", "hút vape trong phòng"],
      title: "Quy định cấm Hút thuốc lá và Thuốc lá điện tử (Vape, Pod) trong phòng",
      content: `${facts.policies.smoking.strict_rule} Khu vực được phép hút thuốc: ${facts.policies.smoking.designated_areas}. Phụ phí xử lý vi phạm khử mùi ozon trong phòng là ${facts.policies.smoking.penalty_cleaning_fee.toLocaleString('vi-VN')} VNĐ.`
    },
    {
      id: "policy_cancel_refund_strict",
      category: "chinh-sach",
      tags: ["hủy phòng", "hoàn tiền", "hủy trước 12 tiếng", "12 tiếng", "tỷ lệ hoàn tiền", "chính sách hủy", "đổi ngày"],
      title: "Chính sách Hủy phòng, Hoàn tiền và Hủy sát giờ (trước 12 tiếng)",
      content: `Chính sách hoàn tiền khi hủy phòng tại Grand Palace: (1) Hủy trước 48h: ${facts.policies.cancellation.prior_48h} (2) Hủy từ 24h đến 48h: ${facts.policies.cancellation.within_24_to_48h} (3) Hủy dưới 24h hoặc không đến (bao gồm hủy trước 12 tiếng): ${facts.policies.cancellation.under_24h_or_no_show} (4) Trường hợp bất khả kháng: ${facts.policies.cancellation.force_majeure}`
    },
    {
      id: "facility_infinity_pool",
      category: "dich-vu",
      tags: ["bể bơi vô cực", "hồ bơi", "infinity pool", "giờ mở cửa", "mấy giờ", "tầng thượng", "miễn phí"],
      title: "Thời gian mở cửa và Tiện ích Bể bơi vô cực (Infinity Pool)",
      content: `${facts.facilities.infinity_pool.name} tọa lạc tại ${facts.facilities.infinity_pool.location}. Giờ mở cửa: ${facts.facilities.infinity_pool.opening_hours}. Giá vé: ${facts.facilities.infinity_pool.pricing}. Tiện ích đi kèm: ${facts.facilities.infinity_pool.amenities}`
    },
    {
      id: "facility_helipad_rooftop",
      category: "dich-vu",
      tags: ["bãi đáp trực thăng", "trực thăng", "helipad", "tầng thượng", "khách vip", "chuyên cơ"],
      title: "Thông tin Bãi đáp trực thăng (Helipad) và Đón tiễn VIP",
      content: `${facts.facilities.helipad.description} Phương án đón tiễn khách VIP đi trực thăng/máy bay: ${facts.facilities.helipad.vip_transport}`
    },
    {
      id: "service_limousine_airport",
      category: "dich-vu",
      tags: ["limousine", "xe limousine", "9 chỗ", "đưa đón sân bay", "giá xe", "chi phí đón tiễn"],
      title: "Bảng giá và Dịch vụ xe Limousine VIP 9 chỗ đưa đón sân bay",
      content: `Dịch vụ xe ${facts.services.limousine_airport.vehicle_type}: Chiều đón: ${facts.services.limousine_airport.price_pickup}. Chiều tiễn: ${facts.services.limousine_airport.price_dropoff}. Trọn gói khứ hồi: ${facts.services.limousine_airport.price_roundtrip}. Tiện ích bao gồm: ${facts.services.limousine_airport.included} Yêu cầu đặt trước: ${facts.services.limousine_airport.notice_required}`
    },
    {
      id: "service_spa_massage_mud",
      category: "dich-vu",
      tags: ["spa", "massage đá nóng", "tắm bùn", "tắm bùn trọn gói", "royal spa", "xông hơi", "sauna"],
      title: "Dịch vụ Royal Spa, Massage đá nóng và Thông tin Tắm bùn khoáng",
      content: `Dịch vụ tại ${facts.services.spa_massage.brand}: Massage đá nóng bazan: ${facts.services.spa_massage.hot_stone_massage}. Các dịch vụ khác: ${facts.services.spa_massage.other_services}. Thông tin tắm bùn khoáng: ${facts.services.spa_massage.mud_bath_clarification}`
    },
    {
      id: "faq_paris_flight_info",
      category: "dich-vu",
      tags: ["thủ đô pháp", "paris", "pháp", "bay sang pháp", "thời gian bay", "vé máy bay", "quốc tế"],
      title: "Thông tin Thủ đô nước Pháp (Paris) và Thời gian bay từ Việt Nam",
      content: `Thủ đô nước Pháp là ${facts.frequently_asked.paris_france_flight.capital}. ${facts.frequently_asked.paris_france_flight.flight_time} Dịch vụ hỗ trợ: ${facts.frequently_asked.paris_france_flight.hotel_support}`
    },
    {
      id: "faq_hanoi_weather_info",
      category: "tour-du-lich",
      tags: ["thời tiết hà nội", "ngày mai", "dự báo thời tiết", "du lịch hà nội", "thích hợp du lịch"],
      title: "Dự báo thời tiết Hà Nội và Tư vấn lịch trình du lịch",
      content: `${facts.frequently_asked.hanoi_weather_travel.live_tracking} Gợi ý hoạt động: ${facts.frequently_asked.hanoi_weather_travel.recommendations}`
    },
    {
      id: "faq_vingroup_stock_info",
      category: "chinh-sach",
      tags: ["cổ phiếu", "vingroup", "vic", "giá cổ phiếu", "chứng khoán", "tài chính", "tăng hay giảm"],
      title: "Phạm vi hỗ trợ thông tin tài chính và Giá cổ phiếu (Vingroup / VIC)",
      content: facts.frequently_asked.vingroup_stock.support_scope
    }
  ];

  // Merge các factChunks vào kb (cập nhật nếu có id trùng, hoặc thêm mới)
  for (const chunk of factChunks) {
    const idx = kb.findIndex(x => x.id === chunk.id);
    if (idx >= 0) {
      kb[idx] = chunk;
    } else {
      kb.push(chunk);
    }
  }

  fs.writeFileSync(kbPath, JSON.stringify(kb, null, 2), 'utf8');
  console.log(`✅ Đồng bộ thành công! Tổng số chunks trong knowledgeBase.json: ${kb.length}`);
  return true;
}

if (require.main === module) {
  syncFactsToKnowledgeBase();
}

module.exports = { syncFactsToKnowledgeBase };
