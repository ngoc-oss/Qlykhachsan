/**
 * generate100Dataset.js — Tạo bộ dữ liệu kiểm thử chuẩn 100 câu hỏi RAG & RAGAS
 * Bao gồm:
 * - 80 câu hỏi nghiệp vụ chuẩn (answerable: true) bao phủ toàn bộ 84 chunks kiến thức
 * - 20 câu hỏi bẫy / kiểm thử No-Answer & Chống Ảo Giác (answerable: false)
 */

const fs = require('fs');
const path = require('path');

const dataset = [
  // ─── 1. CHÍNH SÁCH CHECK-IN & CHECK-OUT (12 câu) ─────────────────────────
  {
    id: "eval_01_checkin_standard",
    question: "Giờ nhận phòng (check-in) tiêu chuẩn của khách sạn Grand Palace là mấy giờ?",
    ground_truth: "Giờ check-in tiêu chuẩn tại Grand Palace Hotel là 14:00 (2 giờ chiều). Khách cần xuất trình CMND/Hộ chiếu và đặt cọc để làm thủ tục nhận phòng.",
    expected_contexts: ["Chính sách Check-in"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_02_checkin_early_fee",
    question: "Tôi muốn nhận phòng sớm lúc 10 giờ sáng thì khách sạn tính phụ phí thế nào?",
    ground_truth: "Khách có thể yêu cầu early check-in từ 10:00 sáng tùy theo tình trạng phòng trống với phụ phí 50% giá phòng/đêm. Nếu đặt từ hôm trước và phòng sẵn có thì được miễn phí. Khách VIP/Kim Cương được ưu tiên.",
    expected_contexts: ["Chính sách Check-in Sớm (Early Check-in)", "Chính sách Check-in"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_03_checkin_deposit",
    question: "Khi làm thủ tục check-in tại lễ tân, khách cần đặt cọc tối thiểu bao nhiêu tiền?",
    ground_truth: "Khách cần xuất trình CMND/Hộ chiếu và thẻ tín dụng hoặc đặt cọc tiền mặt tối thiểu 500.000 VNĐ để đảm bảo các dịch vụ phát sinh trong thời gian lưu trú.",
    expected_contexts: ["Chính sách Check-in", "Chính sách Đặt cọc Đảm bảo Đặt phòng"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_04_checkout_standard",
    question: "Giờ trả phòng (check-out) tiêu chuẩn là mấy giờ trưa?",
    ground_truth: "Giờ check-out tiêu chuẩn tại khách sạn Grand Palace là 12:00 trưa hàng ngày.",
    expected_contexts: ["Chính sách Check-out", "Thông tin tổng quan, Tiêu chuẩn và Giờ nhận/trả phòng"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_05_checkout_late_free",
    question: "Tôi có thể check-out muộn lúc 13h30 chiều mà không mất phí không?",
    ground_truth: "Trả phòng muộn đến 14:00 được miễn phí tùy thuộc vào tình trạng phòng trống (cần báo trước lễ tân muộn nhất lúc 09:00 sáng). Khách VIP và Kim Cương luôn được miễn phí đến 14:00.",
    expected_contexts: ["Chính sách Check-out", "Chính sách Check-out Muộn (Late Check-out)"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_06_checkout_late_afternoon",
    question: "Nếu tôi trả phòng lúc 16:00 chiều thì khách sạn tính phí thế nào?",
    ground_truth: "Trả phòng từ 14:00 đến 18:00 sẽ phụ thu 50% giá phòng/đêm. Nếu sau 18:00 sẽ tính tròn 1 đêm đầy đủ theo giá niêm yết.",
    expected_contexts: ["Chính sách Check-out", "Chính sách Trả phòng muộn"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_07_checkout_late_night",
    question: "Nếu tôi giữ phòng đến sau 18:00 tối mới check-out thì tính tiền ra sao?",
    ground_truth: "Check-out sau 18:00 sẽ tính 100% tiền phòng thêm 1 đêm đầy đủ.",
    expected_contexts: ["Chính sách Check-out", "Quy định Trả phòng Muộn (Late Checkout)"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_08_vip_checkin_privilege",
    question: "Khách hạng thẻ Kim Cương có được ưu tiên nhận phòng sớm không?",
    ground_truth: "Khách VIP và hội viên Kim Cương được ưu tiên làm thủ tục check-in tại quầy riêng không cần chờ đợi, và được ưu tiên nhận phòng sớm miễn phí nếu phòng đã sẵn sàng.",
    expected_contexts: ["Chính sách Check-in", "Quy trình đón tiếp khách VIP và Kim Cương"],
    category: "thanh-vien",
    answerable: true
  },
  {
    id: "eval_09_checkin_early_before_9am",
    question: "Nếu tôi đến khách sạn nhận phòng từ trước 9 giờ sáng thì tính phí như thế nào?",
    ground_truth: "Nhận phòng sớm trước 09:00 sáng được xem là check-in siêu sớm và áp dụng tính phí 100% một đêm phòng đầy đủ theo quy định của khách sạn.",
    expected_contexts: ["Chính sách Check-in Sớm (Early Check-in)"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_10_late_checkout_deadline",
    question: "Khách muốn gia hạn check-out muộn cần thông báo cho lễ tân trước mấy giờ?",
    ground_truth: "Khách cần thông báo cho bộ phận lễ tân muộn nhất lúc 09:00 sáng cùng ngày để khách sạn kiểm tra tình trạng phòng và sắp xếp.",
    expected_contexts: ["Chính sách Check-out", "Chính sách Check-out Muộn (Late Check-out)"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_11_checkin_no_id",
    question: "Khách làm mất CMND/CCCD trên đường đi thì có thể check-in bằng giấy tờ gì thay thế?",
    ground_truth: "Khách có thể xuất trình Hộ chiếu, Giấy phép lái xe bản gốc hoặc ứng dụng định danh điện tử VNeID mức 2 đã kích hoạt hợp lệ để đối soát thông tin.",
    expected_contexts: ["Xử lý Trường hợp Khách hàng Không có Giấy tờ Tùy thân"],
    category: "quy-trinh-nv",
    answerable: true
  },
  {
    id: "eval_12_express_checkout",
    question: "Khách sạn có hỗ trợ thủ tục trả phòng nhanh (express check-out) không?",
    ground_truth: "Khách sạn có dịch vụ Express Check-out cho khách đã thanh toán trước hoặc đặt cọc bằng thẻ tín dụng; khách chỉ cần gửi lại chìa khóa/keycard tại quầy lễ tân.",
    expected_contexts: ["Quy trình check-out cho nhân viên lễ tân"],
    category: "quy-trinh-nv",
    answerable: true
  },

  // ─── 2. CHÍNH SÁCH HỦY PHÒNG & HOÀN TIỀN (10 câu) ────────────────────────
  {
    id: "eval_13_cancel_48h",
    question: "Tôi hủy đặt phòng trước 48 tiếng so với giờ nhận phòng thì có được hoàn 100% tiền cọc không?",
    ground_truth: "Đúng, nếu hủy phòng trước 48 giờ so với giờ check-in, khách sạn sẽ hoàn tiền 100% và không tính bất kỳ khoản phí phạt nào.",
    expected_contexts: ["Chính sách hủy đặt phòng và hoàn tiền"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_14_cancel_24_48h",
    question: "Nếu hủy phòng trong khoảng từ 24 đến 48 tiếng trước giờ check-in thì hoàn bao nhiêu %?",
    ground_truth: "Hủy phòng trong khung 24 đến 48 giờ trước giờ check-in sẽ được hoàn lại 50% tổng số tiền đặt phòng.",
    expected_contexts: ["Chính sách hủy đặt phòng và hoàn tiền"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_15_cancel_under_24h",
    question: "Hủy phòng sát giờ trong vòng 24 tiếng trước khi nhận phòng có được hoàn tiền không?",
    ground_truth: "Hủy trong vòng 24 giờ trước giờ check-in tỷ lệ hoàn tiền là 0% (không được hoàn tiền), khách sạn sẽ thu 100% tiền phòng đêm đầu tiên hoặc toàn bộ tiền cọc.",
    expected_contexts: ["Chính sách hủy đặt phòng và hoàn tiền"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_16_cancel_under_12h",
    question: "Nếu tôi muốn hủy phòng trước 12 tiếng so với giờ check-in thì khách sạn hoàn tiền bao nhiêu %?",
    ground_truth: "Hủy trước 12 tiếng thuộc khung hủy dưới 24 giờ, do đó tỷ lệ hoàn tiền là 0% (không hoàn tiền, tính phí 100% đêm đầu tiên).",
    expected_contexts: ["Quy định Hoàn tiền khi Hủy phòng trước 12 tiếng so với giờ Check-in", "Chính sách Hủy phòng, Hoàn tiền và Hủy sát giờ (trước 12 tiếng)"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_17_refund_processing_time",
    question: "Thời gian hoàn tiền về tài khoản ngân hàng của khách sau khi hủy phòng mất bao lâu?",
    ground_truth: "Thời gian xử lý hoàn tiền về tài khoản ngân hàng hoặc thẻ của quý khách thông thường từ 5 đến 7 ngày làm việc.",
    expected_contexts: ["Chính sách hủy đặt phòng và hoàn tiền"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_18_noshow_policy",
    question: "Khách đã đặt phòng nhưng không đến nhận phòng (no-show) thì bị xử lý như thế nào?",
    ground_truth: "Trường hợp vắng mặt không đến (no-show), khách sạn sẽ giữ phòng đến 12:00 trưa hôm sau và thu 100% tiền phòng đêm đầu tiên hoặc toàn bộ tiền cọc, sau đó tự động hủy các đêm còn lại nếu khách không liên hệ.",
    expected_contexts: ["Chính sách vắng mặt (No-Show)", "Chính sách hủy đặt phòng và hoàn tiền"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_19_force_majeure_cancel",
    question: "Trường hợp thiên tai bão lũ khiến chuyến bay bị hủy thì khách có được miễn phí hủy phòng không?",
    ground_truth: "Trường hợp bất khả kháng (thiên tai, dịch bệnh, hoãn/hủy chuyến bay có giấy tờ chứng minh hợp lệ), khách sạn hỗ trợ hoàn tiền 100% hoặc đổi ngày lưu trú miễn phí.",
    expected_contexts: ["Chính sách hủy đặt phòng và hoàn tiền"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_20_change_date_policy",
    question: "Khách có thể đổi ngày lưu trú thay vì hủy phòng không và có mất phí không?",
    ground_truth: "Khách được đổi ngày miễn phí nếu thông báo trước ít nhất 24 giờ và phụ thuộc vào tình trạng phòng trống (có thể áp dụng phụ thu nếu giá ngày mới cao hơn).",
    expected_contexts: ["Chính sách thay đổi ngày đặt phòng"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_21_cancel_group_booking",
    question: "Đối với khách đoàn từ 5 phòng trở lên, thời hạn hủy phòng miễn phí là bao lâu?",
    ground_truth: "Đối với khách đoàn (từ 5 phòng trở lên), khách cần thông báo hủy trước tối thiểu 7 ngày để được hoàn cọc 100%.",
    expected_contexts: ["Quy trình Phục vụ Khách đoàn"],
    category: "quy-trinh-nv",
    answerable: true
  },
  {
    id: "eval_22_deposit_guarantee",
    question: "Khách đặt cọc giữ phòng bằng chuyển khoản thì cần cọc bao nhiêu % giá trị đặt phòng?",
    ground_truth: "Khách sạn yêu cầu đặt cọc tối thiểu 50% tổng giá trị đặt phòng (hoặc 100% cho đêm đầu tiên) trong vòng 24 giờ kể từ khi tạo đơn để giữ phòng đảm bảo.",
    expected_contexts: ["Chính sách Đặt cọc Đảm bảo Đặt phòng"],
    category: "chinh-sach",
    answerable: true
  },

  // ─── 3. QUY ĐỊNH THÚ CƯNG & ĐỘNG VẬT NUÔI (6 câu) ────────────────────────
  {
    id: "eval_23_pet_dogs_cats",
    question: "Khách sạn có cho phép mang chó mèo vào phòng ngủ không?",
    ground_truth: "Grand Palace Hotel TUYỆT ĐỐI KHÔNG cho phép mang thú cưng, chó mèo vào phòng ngủ và khuôn viên khách sạn nhằm đảm bảo vệ sinh và an toàn sức khỏe.",
    expected_contexts: ["Quy định mang thú cưng", "Quy định về Thú cưng và Động vật nuôi trong khách sạn"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_24_pet_hamster",
    question: "Mình muốn mang một con chuột hamster nhỏ xíu vào phòng thôi, có được không? Vì nó không phải chó mèo.",
    ground_truth: "Khách sạn tuyệt đối cấm tất cả các loại thú cưng và động vật nuôi, bao gồm cả chuột hamster, thỏ, sóc hay chim nhỏ, không phân biệt kích cỡ kể cả khi nhốt trong lồng.",
    expected_contexts: ["Quy định về Thú cưng và Động vật nuôi trong khách sạn", "Quy định mang thú cưng"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_25_pet_fine",
    question: "Nếu cố tình giấu thú cưng mang vào phòng thì khách bị phạt bao nhiêu tiền?",
    ground_truth: "Khách vi phạm sẽ bị yêu cầu gửi thú nuôi ra ngoài và chịu phụ phí làm sạch sâu, khử trùng và khử mùi phòng là 500.000 VNĐ.",
    expected_contexts: ["Quy định mang thú cưng", "Quy định về Thú cưng và Động vật nuôi trong khách sạn"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_26_pet_guide_dog",
    question: "Khách khiếm thị có chó dẫn đường đi cùng thì khách sạn có tiếp nhận không?",
    ground_truth: "Ngoại lệ duy nhất là chó dẫn đường cho người khiếm thị được phép đi cùng khách, nhưng cần thông báo trước cho lễ tân khi đặt phòng để chuẩn bị phòng phù hợp.",
    expected_contexts: ["Quy định mang thú cưng"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_27_pet_birds_reptiles",
    question: "Tôi có thể mang lồng chim cảnh hoặc trăn cảnh nhỏ vào phòng khách sạn được không?",
    ground_truth: "Khách sạn tuyệt đối cấm mọi loài động vật nuôi, bao gồm cả chim cảnh, bò sát hay thú kiểng. Khách không được mang vào khách sạn.",
    expected_contexts: ["Quy định về Thú cưng và Động vật nuôi trong khách sạn"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_28_pet_boarding_support",
    question: "Khách sạn có dịch vụ gửi thú cưng hộ khách hoặc liên hệ cơ sở thú y lân cận không?",
    ground_truth: "Lễ tân hỗ trợ liên hệ và cung cấp danh bạ các trung tâm chăm sóc và khách sạn thú cưng uy tín gần khách sạn để khách gửi thú nuôi an toàn.",
    expected_contexts: ["Quy định mang thú cưng"],
    category: "dich-vu",
    answerable: true
  },

  // ─── 4. QUY ĐỊNH HÚT THUỐC & VAPE (6 câu) ─────────────────────────────────
  {
    id: "eval_29_smoking_room",
    question: "Khách sạn có phòng nào cho phép hút thuốc lá bên trong không?",
    ground_truth: "Grand Palace là khách sạn 100% không hút thuốc. Cấm tuyệt đối thuốc lá trong tất cả các phòng nghỉ và khu vực kín trong nhà.",
    expected_contexts: ["Quy định hút thuốc", "Quy định cấm Hút thuốc lá và Thuốc lá điện tử (Vape, Pod) trong phòng"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_30_vaping_pod",
    question: "Khách sạn có phòng nào cho phép hút thuốc lá điện tử (vape) bên trong không?",
    ground_truth: "Thuốc lá điện tử (Vape, Pod, IQOS) bị cấm tuyệt đối trong tất cả các phòng nghỉ giống như thuốc lá truyền thống. Hút trong phòng bị phạt 1.000.000 VNĐ.",
    expected_contexts: ["Quy định cấm Hút thuốc lá điện tử (Vape, Pod) trong tất cả các phòng", "Quy định cấm Hút thuốc lá và Thuốc lá điện tử (Vape, Pod) trong phòng"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_31_smoking_fine",
    question: "Phụ phí phạt hút thuốc lá hoặc thuốc lá điện tử trong phòng là bao nhiêu tiền?",
    ground_truth: "Mức phạt vi phạm hút thuốc hoặc vape trong phòng ngủ là 1.000.000 VNĐ/lần để chi trả chi phí khử mùi ion và giặt rèm, thảm chuyên dụng.",
    expected_contexts: ["Quy định hút thuốc", "Quy định cấm Hút thuốc lá điện tử (Vape, Pod) trong tất cả các phòng"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_32_smoking_area",
    question: "Nếu tôi muốn hút thuốc thì khách sạn có khu vực hút thuốc riêng ở đâu?",
    ground_truth: "Khách có nhu cầu hút thuốc có thể sử dụng khu vực ban công riêng thoáng khí (nếu phòng có ban công) hoặc khu vực sân vườn ngoài trời tại sảnh tầng 1.",
    expected_contexts: ["Quy định cấm Hút thuốc lá và Thuốc lá điện tử (Vape, Pod) trong phòng", "Quy định hút thuốc"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_33_smoking_detector",
    question: "Hệ thống báo khói trong phòng ngủ có tự động phát hiện khói vape và thuốc lá không?",
    ground_truth: "Hệ thống cảm biến khói quang điện tử gắn trần tại mỗi phòng rất nhạy bén, sẽ lập tức kích hoạt chuông cảnh báo và gửi tín hiệu về trung tâm điều hành PCCC khi phát hiện khói thuốc hoặc hơi vape đặc.",
    expected_contexts: ["Quy định cấm Hút thuốc lá điện tử (Vape, Pod) trong tất cả các phòng"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_34_iqos_heated_tobacco",
    question: "Thuốc lá nung nóng IQOS có được hút trong phòng không?",
    ground_truth: "Thuốc lá nung nóng IQOS cũng thuộc danh mục cấm sử dụng trong phòng ngủ, khách vui lòng hút tại khu vực hút thuốc ngoài trời.",
    expected_contexts: ["Quy định cấm Hút thuốc lá điện tử (Vape, Pod) trong tất cả các phòng"],
    category: "chinh-sach",
    answerable: true
  },

  // ─── 5. TIỆN ÍCH BỂ BƠI, GYM & SPA (12 câu) ──────────────────────────────
  {
    id: "eval_35_pool_hours",
    question: "Cho hỏi bể bơi vô cực của khách sạn mở cửa từ mấy giờ đến mấy giờ?",
    ground_truth: "Bể bơi vô cực tọa lạc tại tầng thượng (Rooftop) mở cửa từ 06:00 sáng đến 21:00 tối hàng ngày. Hoàn toàn miễn phí cho khách lưu trú.",
    expected_contexts: ["Thời gian mở cửa và Tiện ích Bể bơi vô cực (Infinity Pool)", "Thời gian mở cửa và Tiện ích Bể bơi vô cực (Infinity Sky Pool)"],
    category: "dich-vu",
    answerable: true
  },
  {
    id: "eval_36_pool_ticket_fee",
    question: "Khách đang lưu trú tại khách sạn có phải mua vé vào bơi tại bể bơi vô cực không?",
    ground_truth: "Bể bơi vô cực hoàn toàn miễn phí 100% cho tất cả khách đang lưu trú tại khách sạn.",
    expected_contexts: ["Thời gian mở cửa và Tiện ích Bể bơi vô cực (Infinity Pool)"],
    category: "dich-vu",
    answerable: true
  },
  {
    id: "eval_37_pool_amenities",
    question: "Khu vực bể bơi vô cực tầng thượng có sẵn khăn tắm và nhân viên cứu hộ không?",
    ground_truth: "Có, khách sạn cung cấp khăn tắm miễn phí, ghế tắm nắng và nhân viên cứu hộ trực 100% thời gian mở cửa từ 06:00 đến 21:00.",
    expected_contexts: ["Thời gian mở cửa và Tiện ích Bể bơi vô cực (Infinity Pool)"],
    category: "dich-vu",
    answerable: true
  },
  {
    id: "eval_38_gym_hours",
    question: "Phòng tập Gym của khách sạn mở cửa vào khung giờ nào?",
    ground_truth: "Phòng tập thể dục Gym hiện đại mở cửa từ 05:30 sáng đến 22:00 tối hàng ngày, trang bị đầy đủ máy chạy bộ, máy tập đa năng và tạ tay.",
    expected_contexts: ["Hồ bơi và Phòng tập Gym"],
    category: "dich-vu",
    answerable: true
  },
  {
    id: "eval_39_gym_fee",
    question: "Phòng tập Gym có tính phí đối với khách lưu trú không?",
    ground_truth: "Phòng gym hoàn toàn miễn phí cho khách lưu trú tại Grand Palace Hotel.",
    expected_contexts: ["Hồ bơi và Phòng tập Gym"],
    category: "dich-vu",
    answerable: true
  },
  {
    id: "eval_40_spa_hotstone_pricing",
    question: "Giá dịch vụ massage đá nóng bazan tại Royal Spa là bao nhiêu?",
    ground_truth: "Dịch vụ massage đá nóng bazan tại Royal Spa: gói 60 phút có giá 650.000 VNĐ, gói 90 phút có giá 900.000 VNĐ.",
    expected_contexts: ["Dịch vụ Royal Spa, Massage đá nóng và Thông tin Tắm bùn khoáng"],
    category: "dich-vu",
    answerable: true
  },
  {
    id: "eval_41_spa_sauna_steam",
    question: "Royal Spa có phòng xông hơi khô (Sauna) và xông hơi ướt (Steam bath) không?",
    ground_truth: "Có, Royal Spa trang bị phòng xông hơi khô đá muối hồng ngoại (Sauna) và xông hơi ướt thảo dược (Steam bath).",
    expected_contexts: ["Dịch vụ Royal Spa, Massage đá nóng và Thông tin Tắm bùn khoáng", "Dịch vụ Spa & Wellness"],
    category: "dich-vu",
    answerable: true
  },
  {
    id: "eval_42_spa_mud_bath_info",
    question: "Khách sạn có dịch vụ spa, massage đá nóng hay tắm bùn trọn gói không em?",
    ground_truth: "Khách sạn có dịch vụ massage đá nóng bazan và xông hơi tại Royal Spa. Khách sạn KHÔNG có bồn tắm bùn khoáng tại khuôn viên nhưng có liên kết tour trọn gói đưa đón khách đến khu tắm bùn khoáng nóng lân cận.",
    expected_contexts: ["Dịch vụ Royal Spa, Massage đá nóng và Thông tin Tắm bùn khoáng"],
    category: "dich-vu",
    answerable: true
  },
  {
    id: "eval_43_spa_hours",
    question: "Royal Spa mở cửa phục vụ khách từ mấy giờ đến mấy giờ?",
    ground_truth: "Royal Spa mở cửa phục vụ từ 09:00 sáng đến 22:00 tối hàng ngày. Khách nên đặt lịch trước 1 giờ qua quầy lễ tân hoặc hotline nội bộ.",
    expected_contexts: ["Dịch vụ Spa & Wellness"],
    category: "dich-vu",
    answerable: true
  },
  {
    id: "eval_44_pool_children_policy",
    question: "Trẻ em có được phép bơi tại bể bơi vô cực tầng thượng không?",
    ground_truth: "Trẻ em dưới 12 tuổi được phép bơi tại bể bơi vô cực nhưng bắt buộc phải có người lớn đi kèm giám sát trực tiếp và mặc áo phao cứu sinh.",
    expected_contexts: ["Thời gian mở cửa và Tiện ích Bể bơi vô cực (Infinity Pool)"],
    category: "dich-vu",
    answerable: true
  },
  {
    id: "eval_45_spa_vip_discount",
    question: "Hội viên hạng Vàng và Kim Cương có được giảm giá dịch vụ Spa không?",
    ground_truth: "Hội viên hạng Kim Cương được giảm 15% và hạng Vàng được giảm 10% trên tổng hóa đơn các dịch vụ trị liệu tại Royal Spa.",
    expected_contexts: ["Chương trình thành viên Grand Palace"],
    category: "thanh-vien",
    answerable: true
  },
  {
    id: "eval_46_pool_rooftop_bar",
    question: "Cạnh bể bơi vô cực tầng thượng có quầy bar phục vụ cocktail và đồ uống không?",
    ground_truth: "Có, cạnh bể bơi vô cực là Sky Lounge Bar ngoài trời phục vụ cocktail, mocktail, nước ép và đồ ăn nhẹ từ 10:00 sáng đến 23:00 đêm.",
    expected_contexts: ["Thời gian mở cửa và Tiện ích Bể bơi vô cực (Infinity Sky Pool)"],
    category: "dich-vu",
    answerable: true
  },

  // ─── 6. DỊCH VỤ ẨM THỰC, NHÀ HÀNG & PHÒNG (8 câu) ─────────────────────────
  {
    id: "eval_47_breakfast_buffet_time",
    question: "Khách sạn phục vụ buffet sáng vào khung giờ nào, tại đâu và giá bao nhiêu một người?",
    ground_truth: "Buffet sáng phục vụ tại Nhà hàng Grand Palace tầng 1 từ 06:30 đến 10:00 sáng hàng ngày. Giá vé 300.000 VNĐ/người lớn; trẻ em dưới 5 tuổi miễn phí; trẻ 6-12 tuổi tính 50%.",
    expected_contexts: ["Dịch vụ ăn sáng và Nhà hàng"],
    category: "dich-vu",
    answerable: true
  },
  {
    id: "eval_48_breakfast_included",
    question: "Làm sao để biết phòng tôi đặt đã bao gồm ăn sáng buffet miễn phí hay chưa?",
    ground_truth: "Quý khách có thể kiểm tra trên phiếu xác nhận đặt phòng (Booking Voucher) hoặc nhờ lễ tân tra cứu mã đặt phòng trong hệ thống.",
    expected_contexts: ["Dịch vụ ăn sáng và Nhà hàng"],
    category: "dich-vu",
    answerable: true
  },
  {
    id: "eval_49_room_service_hours",
    question: "Dịch vụ phục vụ ăn uống tại phòng (Room Service) có mở 24/24 không?",
    ground_truth: "Dịch vụ Room Service phục vụ từ 06:00 sáng đến 23:30 đêm. Sau 23:30 khách sạn cung cấp menu khuya với các món ăn nhẹ, mì và đồ uống đóng chai.",
    expected_contexts: ["Dịch vụ phòng (Room Service)"],
    category: "dich-vu",
    answerable: true
  },
  {
    id: "eval_50_minibar_complimentary",
    question: "Những đồ uống nào trong minibar của phòng ngủ là hoàn toàn miễn phí?",
    ground_truth: "Mỗi phòng được miễn phí 02 chai nước suối tinh khiết, trà túi lọc và cà phê gói hòa tan mỗi ngày đặt trên khay kệ bàn trà. Các loại nước ngọt, bia, rượu vang và đồ ăn vặt trong tủ lạnh minibar có tính phí theo bảng giá.",
    expected_contexts: ["Quy định sử dụng và thanh toán Minibar", "Quy Định Sử Dụng Minibar"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_51_restaurant_specialties",
    question: "Nhà hàng Grand Palace có phục vụ các món ăn đặc sản vùng miền Thái Nguyên không?",
    ground_truth: "Có, nhà hàng phục vụ các món đặc sản nổi tiếng như: Gà đồi nướng mật ong rừng, bánh coong phù, xôi ngũ sắc và thưởng thức các loại trà Tân Cương trứ danh.",
    expected_contexts: ["Dịch vụ ăn sáng và Nhà hàng"],
    category: "dich-vu",
    answerable: true
  },
  {
    id: "eval_52_minibar_settlement",
    question: "Tiền đồ uống minibar được thanh toán vào lúc nào?",
    ground_truth: "Khi khách làm thủ tục check-out, nhân viên buồng phòng sẽ kiểm tra số lượng đồ minibar đã sử dụng và lễ tân sẽ tổng hợp vào hóa đơn thanh toán cuối cùng.",
    expected_contexts: ["Quy trình kiểm kê và tính phí Minibar", "Quy trình check-out cho nhân viên lễ tân"],
    category: "quy-trinh-nv",
    answerable: true
  },
  {
    id: "eval_53_vegetarian_food",
    question: "Nhà hàng có phục vụ các món ăn chay thanh đạm không?",
    ground_truth: "Có, thực đơn nhà hàng luôn có các món chay dinh dưỡng và quầy buffet sáng có góc ẩm thực chay riêng biệt phục vụ quý khách.",
    expected_contexts: ["Dịch vụ ăn sáng và Nhà hàng"],
    category: "dich-vu",
    answerable: true
  },
  {
    id: "eval_54_room_service_order",
    question: "Muốn gọi đồ ăn lên phòng tôi cần bấm phím số mấy trên điện thoại bàn?",
    ground_truth: "Quý khách nhấc máy điện thoại bàn trong phòng và bấm phím số 2 (Room Service) hoặc phím 0 (Lễ tân) để đặt món ăn.",
    expected_contexts: ["Dịch vụ phòng (Room Service)"],
    category: "dich-vu",
    answerable: true
  },

  // ─── 7. GIẶT LÀ, ĐƯA ĐÓN & VẬN CHUYỂN (10 câu) ────────────────────────────
  {
    id: "eval_55_laundry_express_time",
    question: "Dịch vụ giặt ủi đồ nhanh của khách sạn mất mấy tiếng và có phụ phí gì không?",
    ground_truth: "Dịch vụ giặt nhanh của Grand Palace xử lý trong vòng 4 giờ (phụ phí 50% so với giá thường), nếu gửi trước 10:00 nhận lại trước 14:00. Dịch vụ ủi express xử lý trong 2 giờ giá 25.000 VNĐ/món.",
    expected_contexts: ["Dịch vụ Giặt là"],
    category: "dich-vu",
    answerable: true
  },
  {
    id: "eval_56_laundry_standard_time",
    question: "Dịch vụ giặt là tiêu chuẩn trả đồ cho khách trong vòng bao lâu?",
    ground_truth: "Dịch vụ giặt thường tiêu chuẩn trả đồ sạch sẽ trong vòng 24 giờ kể từ khi tiếp nhận đồ.",
    expected_contexts: ["Dịch vụ Giặt là"],
    category: "dich-vu",
    answerable: true
  },
  {
    id: "eval_57_laundry_diamond_benefit",
    question: "Khách hàng hạng Kim Cương có được miễn phí giặt là không?",
    ground_truth: "Khách hàng hội viên hạng Kim Cương được miễn phí giặt 3 món đồ/ngày trong suốt kỳ lưu trú.",
    expected_contexts: ["Dịch vụ Giặt là", "Chương trình thành viên Grand Palace"],
    category: "thanh-vien",
    answerable: true
  },
  {
    id: "eval_58_limousine_airport_pricing",
    question: "Tôi muốn đặt dịch vụ đưa đón bằng xe limousine 9 chỗ từ sân bay về khách sạn thì giá thế nào?",
    ground_truth: "Giá xe Limousine VIP 9 chỗ đưa đón sân bay: Chiều đón từ sân bay về khách sạn là 850.000 VNĐ/chuyến; chiều tiễn ra sân bay là 800.000 VNĐ/chuyến; khứ hồi 2 chiều là 1.500.000 VNĐ. Giá đã gồm tài xế, khăn lạnh, nước suối và phí cầu đường.",
    expected_contexts: ["Dịch vụ và Bảng giá đưa đón sân bay bằng xe Limousine VIP 9 chỗ", "Bảng giá và Dịch vụ xe Limousine VIP 9 chỗ đưa đón sân bay"],
    category: "dich-vu",
    answerable: true
  },
  {
    id: "eval_59_limousine_booking_notice",
    question: "Khách cần đặt trước xe Limousine đón sân bay bao lâu?",
    ground_truth: "Quý khách vui lòng thông báo lịch trình và đặt trước ít nhất 2 đến 3 tiếng trước giờ hạ cánh để bộ phận vận chuyển sắp xếp xe đón chu đáo.",
    expected_contexts: ["Dịch vụ và Bảng giá đưa đón sân bay bằng xe Limousine VIP 9 chỗ"],
    category: "dich-vu",
    answerable: true
  },
  {
    id: "eval_60_helipad_rooftop_fact",
    question: "Khách sạn mình có bãi đáp trực thăng ở tầng thượng cho khách VIP không?",
    ground_truth: "Khách sạn Grand Palace không có bãi đáp trực thăng (Helipad) ở tầng thượng. Tầng thượng là khu vực dành cho Bể bơi vô cực và Sky Lounge. Khách VIP đi trực thăng sẽ hạ cánh tại sân bay trực thăng lân cận và khách sạn bố trí xe Limousine đón tiễn riêng.",
    expected_contexts: ["Thông tin về Bãi đáp trực thăng (Helipad) trên tầng thượng", "Thông tin Bãi đáp trực thăng (Helipad) và Đón tiễn VIP"],
    category: "dich-vu",
    answerable: true
  },
  {
    id: "eval_61_parking_fee",
    question: "Khách sạn có chỗ đỗ xe ô tô miễn phí cho khách lưu trú không?",
    ground_truth: "Khách sạn có hầm đỗ xe ô tô và bãi đỗ xe rộng rãi ngoài trời hoàn toàn miễn phí cho khách lưu trú, có bảo vệ trông giữ 24/24.",
    expected_contexts: ["Dịch vụ bãi đỗ xe"],
    category: "dich-vu",
    answerable: true
  },
  {
    id: "eval_62_ev_charging",
    question: "Khách sạn có trạm sạc xe điện VinFast / EV tại bãi đỗ xe không?",
    ground_truth: "Tại tầng hầm B1 khách sạn có trang bị các trụ sạc xe điện cho khách lưu trú với chi phí tính theo biểu giá thực tế.",
    expected_contexts: ["Dịch vụ bãi đỗ xe"],
    category: "dich-vu",
    answerable: true
  },
  {
    id: "eval_63_paris_flight_duration",
    question: "Thủ đô của nước Pháp là gì và từ khách sạn bay sang đó mất bao lâu?",
    ground_truth: "Thủ đô của nước Pháp là Paris. Thời gian bay từ Việt Nam sang Paris mất khoảng 12 đến 14 tiếng (bay thẳng) hoặc 16 đến 22 tiếng (bay quá cảnh). Khách sạn hỗ trợ xe đưa đón sân bay 24/7 và tư vấn vé máy bay.",
    expected_contexts: ["Thông tin Thủ đô nước Pháp (Paris) và Thời gian bay từ Việt Nam"],
    category: "dich-vu",
    answerable: true
  },
  {
    id: "eval_64_motorcycle_rental",
    question: "Khách sạn có hỗ trợ khách thuê xe máy tự lái để dạo quanh thành phố không?",
    ground_truth: "Quầy Lễ tân/Concierge hỗ trợ liên kết dịch vụ thuê xe máy đời mới (xe số và xe ga) giao tận sảnh khách sạn với giá từ 120.000 đến 180.000 VNĐ/ngày.",
    expected_contexts: ["Dịch vụ đưa đón và vận chuyển"],
    category: "dich-vu",
    answerable: true
  },

  // ─── 8. CÁC HẠNG PHÒNG, GIÁ CẢ & TIỆN NGHI (8 câu) ────────────────────────
  {
    id: "eval_65_room_types_list",
    question: "Khách sạn Grand Palace hiện có những loại phòng nghỉ nào?",
    ground_truth: "Khách sạn có các hạng phòng: Standard, Deluxe City View, Suite Ban Công, Executive Suite và Presidential Suite (Phòng Tổng Thống) với đầy đủ tiện nghi tiêu chuẩn 5 sao.",
    expected_contexts: ["Các loại phòng và giá"],
    category: "phong",
    answerable: true
  },
  {
    id: "eval_66_room_deluxe_price",
    question: "Phòng Deluxe City View có diện tích bao nhiêu m2 và giá niêm yết khoảng bao nhiêu?",
    ground_truth: "Phòng Deluxe City View có diện tích khoảng 35 - 40m2 với tầm nhìn toàn cảnh thành phố, giá niêm yết từ 1.200.000 đến 1.600.000 VNĐ/đêm.",
    expected_contexts: ["Các loại phòng và giá"],
    category: "phong",
    answerable: true
  },
  {
    id: "eval_67_president_suite_perks",
    question: "Phòng Presidential Suite (Phòng Tổng Thống) có những tiện ích đặc biệt nào?",
    ground_truth: "Phòng Tổng Thống diện tích trên 150m2 gồm phòng khách sang trọng, phòng ngủ Master, phòng tắm jacuzzi massage, phòng làm việc riêng và có quản gia phục vụ riêng 24/7.",
    expected_contexts: ["Các loại phòng và giá", "Quy định và Đặc quyền Phòng VIP"],
    category: "phong",
    answerable: true
  },
  {
    id: "eval_68_children_bed_policy",
    question: "Trẻ em 8 tuổi ở cùng phòng với bố mẹ có bị phụ thu không?",
    ground_truth: "Trẻ em từ 6 đến 11 tuổi ở chung giường với bố mẹ phụ thu 150.000 VNĐ/đêm (đã bao gồm ăn sáng). Trẻ từ 12 tuổi trở lên tính như người lớn và yêu cầu kê thêm giường phụ (extra bed).",
    expected_contexts: ["Chính sách lưu trú cho trẻ em", "Quy Định Phụ Thu"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_69_extra_bed_price",
    question: "Giá kê thêm một giường phụ (extra bed) trong phòng là bao nhiêu tiền một đêm?",
    ground_truth: "Phụ thu giường phụ (Extra Bed) là 350.000 VNĐ/đêm (đã bao gồm 01 suất ăn sáng buffet tại nhà hàng).",
    expected_contexts: ["Quy Định Phụ Thu"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_70_tv_smart_channels",
    question: "TV trong phòng khách sạn có kết nối truyền hình vệ tinh và Youtube/Netflix không?",
    ground_truth: "Các phòng đều trang bị Smart TV 55 inch kết nối internet tốc độ cao, hỗ trợ ứng dụng Youtube, kết nối Netflix cá nhân và truyền hình cáp trên 100 kênh quốc tế.",
    expected_contexts: ["Quy định về Tiêu chuẩn và Vận hành TV trong phòng"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_71_wifi_speed_password",
    question: "Mật khẩu WiFi khách sạn là gì và tốc độ mạng thế nào?",
    ground_truth: "WiFi miễn phí phủ sóng toàn khách sạn. Tên mạng: 'GrandPalace_Guest', không đặt mật khẩu, khách chỉ cần mở trình duyệt và nhập số phòng cùng họ tên để đăng nhập với tốc độ lên đến 100 Mbps.",
    expected_contexts: ["Dịch vụ WiFi", "Quy định về Dịch vụ Wi-Fi trong phòng"],
    category: "dich-vu",
    answerable: true
  },
  {
    id: "eval_72_hot_water_system",
    question: "Hệ thống nước nóng trong phòng tắm vận hành thế nào, có cần bật bình nóng lạnh không?",
    ground_truth: "Khách sạn sử dụng hệ thống cấp nước nóng trung tâm tuần hoàn năng lượng mặt trời kết hợp bơm nhiệt công nghiệp, nước nóng có sẵn 24/7 ngay khi vặn vòi mà không cần bật công tắc.",
    expected_contexts: ["Quy định về Hệ thống Nước Nóng trong phòng tắm"],
    category: "chinh-sach",
    answerable: true
  },

  // ─── 9. TOUR DU LỊCH, THÀNH VIÊN & NGHIỆP VỤ (8 câu) ──────────────────────
  {
    id: "eval_73_tour_thai_nguyen_tea",
    question: "Khách sạn có tour tham quan đồi chè Thái Nguyên không em?",
    ground_truth: "Khách sạn có tour 1 ngày tham quan đồi chè Tân Cương Thái Nguyên: tham quan đồi chè xanh bạt ngàn, trải nghiệm hái và sao chè cùng nghệ nhân, thưởng thức trà hảo hạng. Giá tour 450.000 VNĐ/người.",
    expected_contexts: ["Tour tham quan Thái Nguyên — Vùng chè nổi tiếng"],
    category: "tour-du-lich",
    answerable: true
  },
  {
    id: "eval_74_tour_nui_coc_lake",
    question: "Tour du lịch Hồ Núi Cốc của khách sạn gồm những hoạt động gì?",
    ground_truth: "Tour khám phá Hồ Núi Cốc gồm: du thuyền ngắm cảnh lòng hồ thơ mộng, tham quan quần thể chùa Thác Vàng, khu du lịch huyền thoại Chuyện tình Ba Hàng và thưởng thức cá hồ nướng đặc sản.",
    expected_contexts: ["Tour Hồ Núi Cốc — Thiên nhiên thơ mộng"],
    category: "tour-du-lich",
    answerable: true
  },
  {
    id: "eval_75_tour_atk_dinh_hoa",
    question: "Tour ATK Định Hóa khởi hành lúc mấy giờ và có hướng dẫn viên không?",
    ground_truth: "Tour Di tích Lịch sử ATK Định Hóa (Thủ đô Gió ngàn) khởi hành lúc 07:30 sáng từ khách sạn, có xe đưa đón riêng và hướng dẫn viên thuyết minh lịch sử suốt hành trình.",
    expected_contexts: ["Tour ATK Định Hóa — Di tích lịch sử"],
    category: "tour-du-lich",
    answerable: true
  },
  {
    id: "eval_76_membership_tiers",
    question: "Chương trình thành viên Grand Palace có những hạng thẻ nào và tích điểm ra sao?",
    ground_truth: "Chương trình thành viên gồm 4 hạng: Bạc (Silver), Vàng (Gold), Bạch Kim (Platinum) và Kim Cương (Diamond). Cứ mỗi 100.000 VNĐ chi tiêu tích 10 điểm thưởng để đổi phòng và quà tặng.",
    expected_contexts: ["Chương trình thành viên Grand Palace"],
    category: "thanh-vien",
    answerable: true
  },
  {
    id: "eval_77_lost_and_found_retention",
    question: "Đồ vật khách bỏ quên tại phòng được khách sạn lưu kho bảo quản trong bao lâu?",
    ground_truth: "Đồ có giá trị cao (tiền, vàng, điện thoại, laptop, trang sức) được lưu két sắt an ninh trong 12 tháng; đồ thông thường lưu kho 6 tháng. Sau thời hạn sẽ xử lý theo quy chế tài sản thất lạc.",
    expected_contexts: ["Quy trình xử lý đồ vật thất lạc / bỏ quên", "Quy Định Về Tài Sản Thất Lạc"],
    category: "quy-trinh-nv",
    answerable: true
  },
  {
    id: "eval_78_damaged_property_fee",
    question: "Nếu khách vô ý làm vỡ cốc thủy tinh hoặc làm ố bẩn ga trải giường thì xử lý thế nào?",
    ground_truth: "Nhân viên lập biên bản kiểm tra thực tế và áp dụng biểu phí bồi thường quy định: cốc thủy tinh đền 50.000 VNĐ, ga trải giường bị ố phụ thu giặt sâu 150.000 VNĐ hoặc đền theo giá mua mới nếu rách hỏng.",
    expected_contexts: ["Quy trình xử lý khi khách làm hỏng tài sản"],
    category: "quy-trinh-nv",
    answerable: true
  },
  {
    id: "eval_79_noise_regulations",
    question: "Quy định về giữ gìn trật tự và chống ồn ban đêm của khách sạn bắt đầu từ mấy giờ?",
    ground_truth: "Giờ yên tĩnh (Quiet Hours) bắt đầu từ 22:00 đêm đến 06:30 sáng hôm sau. Khách không bật nhạc lớn hoặc tụ tập gây ồn làm ảnh hưởng đến các phòng lân cận.",
    expected_contexts: ["Quy Định Về Tiếng Ồn"],
    category: "chinh-sach",
    answerable: true
  },
  {
    id: "eval_80_vat_invoice_issuance",
    question: "Khách muốn xuất hóa đơn VAT giá trị gia tăng thì cần cung cấp thông tin gì?",
    ground_truth: "Khách cần cung cấp Tên công ty, Mã số thuế và Địa chỉ đăng ký kinh doanh cho nhân viên lễ tân ngay khi check-in hoặc chậm nhất trước khi check-out để xuất hóa đơn điện tử.",
    expected_contexts: ["Quy trình check-out cho nhân viên lễ tân"],
    category: "quy-trinh-nv",
    answerable: true
  },

  // ─── 10. 20 CÂU KIỂM THỬ NO-ANSWER & CHỐNG ẢO GIÁC (answerable: false) ────
  {
    id: "eval_noans_81_casino",
    question: "Khách sạn mình có sòng bạc casino hoạt động thâu đêm cho khách nước ngoài không?",
    ground_truth: "Hiện tại trong dữ liệu/tài liệu nội bộ của khách sạn Grand Palace chưa tìm thấy thông tin về dịch vụ sòng bạc casino. Quý khách vui lòng liên hệ quầy lễ tân để được kiểm tra trực tiếp.",
    expected_contexts: [],
    category: "dich-vu",
    answerable: false
  },
  {
    id: "eval_noans_82_gas_cooking",
    question: "Tôi có thể mang bếp gas mini và bình gas du lịch vào phòng tự nấu lẩu ăn khuya được không?",
    ground_truth: "Hiện tại trong dữ liệu/tài liệu nội bộ của khách sạn chưa tìm thấy thông tin cho phép mang bếp gas nấu ăn trong phòng. Để đảm bảo an toàn PCCC, khách vui lòng liên hệ lễ tân hoặc dùng dịch vụ ẩm thực Room Service.",
    expected_contexts: [],
    category: "chinh-sach",
    answerable: false
  },
  {
    id: "eval_noans_83_private_beach",
    question: "Bãi biển riêng và khu lặn biển ngắm san hô của khách sạn cách sảnh bao xa?",
    ground_truth: "Hiện tại trong dữ liệu/tài liệu nội bộ của khách sạn Grand Palace chưa tìm thấy thông tin về bãi biển riêng hay dịch vụ lặn ngắm san hô (khách sạn tọa lạc tại Thái Nguyên). Quý khách có thể thư giãn tại Bể bơi vô cực tầng thượng.",
    expected_contexts: [],
    category: "dich-vu",
    answerable: false
  },
  {
    id: "eval_noans_84_dryclean_30m",
    question: "Khách sạn có dịch vụ giặt hấp áo vest lấy ngay siêu tốc trong 30 phút không em?",
    ground_truth: "Hiện tại trong dữ liệu/tài liệu nội bộ của khách sạn chưa tìm thấy thông tin về gói dịch vụ giặt hấp 30 phút. Khách sạn cung cấp dịch vụ giặt thường (24h), giặt nhanh (4h) và ủi express (2h).",
    expected_contexts: [],
    category: "dich-vu",
    answerable: false
  },
  {
    id: "eval_noans_85_tennis_court",
    question: "Khách sạn có sân tennis đạt chuẩn quốc tế có dàn đèn để đặt lịch chơi buổi tối không?",
    ground_truth: "Hiện tại trong dữ liệu/tài liệu nội bộ của khách sạn chưa tìm thấy thông tin về sân tennis. Khách sạn có phòng gym và hồ bơi tầng thượng, quý khách có thể liên hệ lễ tân để được hỗ trợ tìm sân tennis lân cận.",
    expected_contexts: [],
    category: "dich-vu",
    answerable: false
  },
  {
    id: "eval_noans_86_cinema_imax",
    question: "Rạp chiếu phim 3D / IMAX nằm ở tầng mấy của khách sạn và giá vé bao nhiêu?",
    ground_truth: "Hiện tại trong dữ liệu/tài liệu nội bộ của khách sạn chưa tìm thấy thông tin về rạp chiếu phim 3D hoặc phòng chiếu IMAX.",
    expected_contexts: [],
    category: "dich-vu",
    answerable: false
  },
  {
    id: "eval_noans_87_hot_air_balloon",
    question: "Khách sạn có tour bay khinh khí cầu ngắm toàn cảnh thành phố Thái Nguyên không?",
    ground_truth: "Hiện tại trong dữ liệu/tài liệu nội bộ của khách sạn chưa tìm thấy thông tin về dịch vụ bay khinh khí cầu. Quý khách vui lòng liên hệ quầy lễ tân để được tư vấn các tour hiện có.",
    expected_contexts: [],
    category: "tour-du-lich",
    answerable: false
  },
  {
    id: "eval_noans_88_helicopter_charter",
    question: "Tôi có thể thuê trực thăng riêng đón từ khuôn viên sảnh khách sạn bay về Hà Nội không?",
    ground_truth: "Hiện tại trong dữ liệu/tài liệu nội bộ của khách sạn chưa tìm thấy thông tin về dịch vụ thuê trực thăng cất cánh từ sảnh. Khách sạn có dịch vụ xe Limousine VIP 9 chỗ đưa đón chuyên nghiệp.",
    expected_contexts: [],
    category: "dich-vu",
    answerable: false
  },
  {
    id: "eval_noans_89_supercar_rental",
    question: "Khách sạn có dịch vụ cho thuê siêu xe tự lái Lamborghini hay Ferrari không?",
    ground_truth: "Hiện tại trong dữ liệu/tài liệu nội bộ của khách sạn chưa tìm thấy thông tin về dịch vụ cho thuê siêu xe thể thao tự lái.",
    expected_contexts: [],
    category: "dich-vu",
    answerable: false
  },
  {
    id: "eval_noans_90_wild_animal_pet",
    question: "Tôi có thể mang trăn cảnh bạch tạng hoặc rồng Nam Mỹ vào nuôi trong phòng không?",
    ground_truth: "Hiện tại trong dữ liệu/tài liệu nội bộ của khách sạn quy định tuyệt đối cấm mọi loại thú cưng và động vật nuôi, không được phép mang vào phòng khách sạn.",
    expected_contexts: [],
    category: "chinh-sach",
    answerable: false
  },
  {
    id: "eval_noans_91_snow_skiing",
    question: "Khu trượt tuyết nhân tạo mùa hè của khách sạn nằm ở khu vực nào?",
    ground_truth: "Hiện tại trong dữ liệu/tài liệu nội bộ của khách sạn chưa tìm thấy thông tin về khu trượt tuyết nhân tạo.",
    expected_contexts: [],
    category: "dich-vu",
    answerable: false
  },
  {
    id: "eval_noans_92_crypto_payment",
    question: "Tôi có thể thanh toán tiền phòng bằng tiền điện tử Bitcoin hoặc USDT được không?",
    ground_truth: "Hiện tại trong dữ liệu/tài liệu nội bộ của khách sạn chưa tìm thấy thông tin về phương thức thanh toán bằng tiền mã hóa Bitcoin/USDT. Khách sạn chấp nhận tiền mặt VND, thẻ ngân hàng và chuyển khoản.",
    expected_contexts: [],
    category: "chinh-sach",
    answerable: false
  },
  {
    id: "eval_noans_93_fireworks_balcony",
    question: "Tôi có được tự bắn pháo hoa từ ban công phòng để kỷ niệm sinh nhật không?",
    ground_truth: "Hiện tại trong dữ liệu/tài liệu nội bộ của khách sạn cấm mọi hành vi gây nguy cơ cháy nổ, việc tự ý đốt pháo hoa tại ban công phòng hoàn toàn không được phép.",
    expected_contexts: [],
    category: "chinh-sach",
    answerable: false
  },
  {
    id: "eval_noans_94_river_yacht",
    question: "Khách sạn có dịch vụ du thuyền 5 sao dạo chơi trên sông Cầu không?",
    ground_truth: "Hiện tại trong dữ liệu/tài liệu nội bộ của khách sạn chưa tìm thấy thông tin về dịch vụ du thuyền 5 sao trên sông Cầu.",
    expected_contexts: [],
    category: "tour-du-lich",
    answerable: false
  },
  {
    id: "eval_noans_95_tattoo_service",
    question: "Tại Royal Spa có dịch vụ xăm hình nghệ thuật tattoo không?",
    ground_truth: "Hiện tại trong dữ liệu/tài liệu nội bộ của khách sạn chưa tìm thấy thông tin về dịch vụ xăm hình nghệ thuật tại Royal Spa.",
    expected_contexts: [],
    category: "dich-vu",
    answerable: false
  },
  {
    id: "eval_noans_96_wave_pool",
    question: "Khách sạn có hồ bơi tạo sóng nhân tạo dành cho trẻ em không?",
    ground_truth: "Hiện tại trong dữ liệu/tài liệu nội bộ của khách sạn chưa tìm thấy thông tin về hồ bơi tạo sóng nhân tạo. Khách sạn hiện có Bể bơi vô cực tầng thượng phục vụ du khách.",
    expected_contexts: [],
    category: "dich-vu",
    answerable: false
  },
  {
    id: "eval_noans_97_driving_license",
    question: "Lễ tân khách sạn có dịch vụ thi hộ giấy phép lái xe máy cho khách không?",
    ground_truth: "Hiện tại trong dữ liệu/tài liệu nội bộ của khách sạn không có dịch vụ thi hộ giấy phép lái xe. Khách sạn chỉ cung cấp các dịch vụ lưu trú và hỗ trợ du lịch hợp pháp.",
    expected_contexts: [],
    category: "quy-trinh-nv",
    answerable: false
  },
  {
    id: "eval_noans_98_hunting_gun",
    question: "Khách sạn có cho mượn súng săn để khách đi săn thú trên núi không?",
    ground_truth: "Hiện tại trong dữ liệu/tài liệu nội bộ của khách sạn tuyệt đối cấm tàng trữ vũ khí và không có dịch vụ cho mượn súng săn theo quy định pháp luật.",
    expected_contexts: [],
    category: "chinh-sach",
    answerable: false
  },
  {
    id: "eval_noans_99_book_3_years_ahead",
    question: "Tôi có thể đặt phòng trước 3 năm mà không cần đặt cọc tiền không?",
    ground_truth: "Hiện tại trong dữ liệu/tài liệu nội bộ của khách sạn chưa tìm thấy quy định cho phép giữ phòng trước 3 năm mà không cần đặt cọc.",
    expected_contexts: [],
    category: "chinh-sach",
    answerable: false
  },
  {
    id: "eval_noans_100_space_shuttle",
    question: "Khách sạn có tour du lịch ngắm cực quang bằng tàu ngầm hoặc phi thuyền không?",
    ground_truth: "Hiện tại trong dữ liệu/tài liệu nội bộ của khách sạn chưa tìm thấy thông tin về dịch vụ tàu ngầm hay phi thuyền ngắm cực quang.",
    expected_contexts: [],
    category: "tour-du-lich",
    answerable: false
  }
];

const outputPath = path.join(__dirname, 'testDataset.json');
fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2), 'utf8');

console.log(`✅ Đã tạo thành công bộ dữ liệu kiểm thử chuẩn 100 câu hỏi: ${outputPath}`);
console.log(`- 80 câu hỏi nghiệp vụ chuẩn (answerable: true)`);
console.log(`- 20 câu hỏi No-Answer & Chống Ảo Giác (answerable: false)`);
