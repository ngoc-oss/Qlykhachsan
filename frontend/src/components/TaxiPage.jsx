import React, { useState } from 'react';

const TAXI_PROVIDERS = [
  {
    id: 'xanhsm',
    name: 'Xanh SM',
    fullName: 'Xanh SM Taxi Điện (GSM VinFast)',
    slogan: '100% xe điện thông minh, không mùi xăng, không tiếng ồn, êm ái',
    logo: '⚡',
    color: '#0284c7',
    badge: 'Khuyên Dùng',
    hotline: '1900 2088',
    website: 'https://www.xanhsm.com',
    appStore: 'https://apps.apple.com/vn/app/xanh-sm-dat-xe-dien/id6447211544',
    googlePlay: 'https://play.google.com/store/apps/details?id=com.gsm.customer',
    priceSample: 'Từ 14.500đ/km (VF5, VF e34) - 16.500đ/km (VF8)',
    features: [
      'Đội ngũ tài xế đào tạo chuẩn 5 sao',
      'Xe điện VinFast đời mới, sạch sẽ, không mùi',
      'Đón tại sảnh Grand Palace chỉ trong 3 - 5 phút',
      'Tích điểm thành viên VinClub'
    ],
    qrDesc: 'Quét để tải ứng dụng Xanh SM'
  },
  {
    id: 'grab',
    name: 'Grab',
    fullName: 'GrabCar & GrabBike',
    slogan: 'Siêu ứng dụng gọi xe công nghệ hàng đầu Đông Nam Á',
    logo: '🟢',
    color: '#10b981',
    badge: 'Phổ Biến',
    hotline: '028 7108 7108',
    website: 'https://www.grab.com/vn/transport/',
    appStore: 'https://apps.apple.com/vn/app/grab-app-d%E1%BA%B7t-xe-giao-%C4%91%E1%BB%93-%C4%83n/id647268330',
    googlePlay: 'https://play.google.com/store/apps/details?id=com.grabtaxi.passenger',
    priceSample: 'Giá cước linh hoạt theo thời gian thực & quãng đường',
    features: [
      'Đa dạng loại xe: GrabCar 4 chỗ, 7 chỗ, GrabBike',
      'Biết trước lộ trình và giá cước chuyến đi',
      'Tích điểm GrabRewards đổi ưu đãi đồ ăn/mua sắm',
      'Hỗ trợ thanh toán thẻ tín dụng quốc tế & ví điện tử'
    ],
    qrDesc: 'Quét để tải ứng dụng Grab'
  },
  {
    id: 'be',
    name: 'Be',
    fullName: 'Be Group (beCar & beBike)',
    slogan: 'Nền tảng tiêu dùng đa dịch vụ thuần Việt - Giá cước ổn định',
    logo: '🟡',
    color: '#f59e0b',
    badge: 'Ưu Đãi Tốt',
    hotline: '1900 232345',
    website: 'https://be.com.vn',
    appStore: 'https://apps.apple.com/vn/app/be-%C4%91%E1%BA%B7t-xe-giao-h%C3%A0ng-mua-v%C3%A9/id1440565287',
    googlePlay: 'https://play.google.com/store/apps/details?id=xyz.be.customer',
    priceSample: 'Giá cước minh bạch, không tăng giá đột ngột giờ cao điểm',
    features: [
      'Dịch vụ beCar 4 chỗ & 7 chỗ đưa đón tận nơi',
      'beFlight tích hợp đưa đón sân bay Nội Bài',
      'Tích lũy điểm bePoint đổi quà hấp dẫn',
      'Hỗ trợ xuất hóa đơn điện tử cho khách công tác'
    ],
    qrDesc: 'Quét để tải ứng dụng Be'
  },
  {
    id: 'mailinh',
    name: 'Mai Linh',
    fullName: 'Taxi Mai Linh (Toàn Quốc)',
    slogan: 'Màu xanh cuộc sống - Tổng đài toàn quốc 1055',
    logo: '🚕',
    color: '#16a34a',
    badge: 'Truyền Thống',
    hotline: '1055',
    website: 'https://mailinh.vn',
    appStore: 'https://apps.apple.com/vn/app/taxi-mai-linh/id1112461979',
    googlePlay: 'https://play.google.com/store/apps/details?id=mailinh.com.vn.taxiapp',
    priceSample: 'Giá mở cửa ~11.000đ, từ km tiếp theo ~15.100đ/km',
    features: [
      'Tổng đài quen thuộc 1055 hỗ trợ 24/7 toàn quốc',
      'Có xe túc trực thường xuyên tại các điểm trung tâm Thái Nguyên',
      'Hóa đơn đỏ VAT xuất ngay lập tức sau chuyến đi',
      'Lựa chọn tin cậy cho khách lớn tuổi hoặc không dùng app'
    ],
    qrDesc: 'Quét để tải ứng dụng Mai Linh Taxi'
  },
  {
    id: 'grandpalace',
    name: 'Xe Khách Sạn',
    fullName: 'Xe Đưa Đón Riêng Grand Palace VIP',
    slogan: 'Dịch vụ xe riêng Limousine VIP 9 chỗ & Sedan sang trọng của khách sạn',
    logo: '👑',
    color: '#818cf8',
    badge: 'Đặc Quyền',
    hotline: '0208 3 888 999',
    website: '#',
    appStore: '',
    googlePlay: '',
    priceSample: 'Sân bay Nội Bài: 450.000đ (Sedan) / 800.000đ (Limousine 9 chỗ)',
    features: [
      'Tài xế riêng của khách sạn, lịch sự, phục vụ nước suối & khăn lạnh',
      'Đưa đón sân bay Nội Bài đúng giờ, chờ khách tại sảnh đến',
      'Hỗ trợ mang vác hành lý tận phòng khách',
      'Cộng dồn chi phí vào hóa đơn phòng (Room Folio)'
    ],
    qrDesc: 'Liên hệ Lễ Tân Grand Palace (Phím 0)'
  }
];

const POPULAR_DESTINATIONS = [
  { name: 'Sân bay Quốc tế Nội Bài (Hà Nội)', distance: '~55 km', time: '~45 phút', estPrice: '450.000đ - 520.000đ' },
  { name: 'Ga Thái Nguyên', distance: '~2.5 km', time: '~7 phút', estPrice: '35.000đ - 45.000đ' },
  { name: 'Khu du lịch Hồ Núi Cốc', distance: '~18 km', time: '~25 phút', estPrice: '190.000đ - 220.000đ' },
  { name: 'Bảo tàng Văn hóa các Dân tộc Việt Nam', distance: '~1.8 km', time: '~5 phút', estPrice: '25.000đ - 35.000đ' },
  { name: 'Khu di tích lịch sử Quốc gia đặc biệt ATK Định Hóa', distance: '~48 km', time: '~60 phút', estPrice: '480.000đ - 550.000đ' },
  { name: 'Làng chè Tân Cương', distance: '~12 km', time: '~20 phút', estPrice: '130.000đ - 160.000đ' }
];

export default function TaxiPage() {
  const [activeProviderId, setActiveProviderId] = useState('xanhsm');
  const [activeTab, setActiveTab] = useState('embed'); // 'embed' | 'quickCall' | 'guide'

  // State cho bộ điều xe nhanh tại sảnh
  const [roomNumber, setRoomNumber] = useState('');
  const [guestName, setGuestName] = useState('');
  const [destination, setDestination] = useState(POPULAR_DESTINATIONS[0].name);
  const [selectedVehicle, setSelectedVehicle] = useState('4-cho');
  const [bookingStatus, setBookingStatus] = useState(null);
  const [activeOrders, setActiveOrders] = useState([
    {
      id: 'TX-101',
      room: '205 (Phòng Deluxe)',
      guest: 'Nguyễn Văn Minh',
      provider: 'Xanh SM',
      dest: 'Sân bay Quốc tế Nội Bài',
      time: '10 phút trước',
      status: 'Xe đang đến sảnh (Biển số: 20A-889.99)'
    }
  ]);

  const activeProvider = TAXI_PROVIDERS.find(p => p.id === activeProviderId) || TAXI_PROVIDERS[0];

  const handleQuickBook = (e) => {
    e.preventDefault();
    if (!roomNumber.trim()) {
      alert('Vui lòng nhập số phòng của khách!');
      return;
    }
    const newOrder = {
      id: `TX-${Math.floor(100 + Math.random() * 900)}`,
      room: `Phòng ${roomNumber}`,
      guest: guestName.trim() || 'Khách lưu trú',
      provider: activeProvider.name,
      dest: destination,
      time: 'Vừa xong',
      status: `Đã liên hệ tài xế ${activeProvider.name} (Đón sảnh trong 3-5 phút)`
    };
    setActiveOrders([newOrder, ...activeOrders]);
    setBookingStatus('Đã phát lệnh điều xe thành công! Tài xế sẽ có mặt tại sảnh chính Grand Palace.');
    setRoomNumber('');
    setGuestName('');
    setTimeout(() => setBookingStatus(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(16, 185, 129, 0.12) 50%, rgba(245, 158, 11, 0.1) 100%)',
        border: '1px solid rgba(2, 132, 199, 0.3)',
        borderRadius: 16,
        padding: '24px 28px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 32 }}>🚕</span>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Trung Tâm Dịch Vụ Taxi & Đặt Xe Di Chuyển
              </h2>
              <span style={{
                background: 'var(--indigo)', color: '#fff', fontSize: 11, fontWeight: 700,
                padding: '3px 10px', borderRadius: 999, textTransform: 'uppercase'
              }}>
                Hỗ Trợ 24/7
              </span>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, maxWidth: 800, lineHeight: 1.5 }}>
              Kết nối trực tiếp với các ứng dụng đặt xe hàng đầu: <strong>Xanh SM</strong> (Taxi điện VinFast), <strong>Grab</strong>, <strong>Be</strong>, <strong>Taxi Mai Linh</strong> và dịch vụ xe riêng Limousine đón trả sân bay của Grand Palace Hotel.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className={`btn ${activeTab === 'embed' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('embed')}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🌐</span> Khám Phá & Đặt Qua Web
            </button>
            <button
              className={`btn ${activeTab === 'quickCall' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('quickCall')}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🛎️</span> Điều Xe Nhanh Tại Sảnh
            </button>
            <button
              className={`btn ${activeTab === 'guide' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('guide')}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📍</span> Bảng Giá Cước Điểm Đến
            </button>
          </div>
        </div>
      </div>

      {/* Tabs chọn Hãng Taxi */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 12
      }}>
        {TAXI_PROVIDERS.map(p => {
          const isActive = activeProviderId === p.id;
          return (
            <div
              key={p.id}
              onClick={() => setActiveProviderId(p.id)}
              style={{
                cursor: 'pointer',
                borderRadius: 14,
                padding: '16px 18px',
                border: `2px solid ${isActive ? p.color : 'var(--border)'}`,
                background: isActive ? `rgba(${p.id === 'xanhsm' ? '2,132,199' : p.id === 'grab' ? '16,185,129' : p.id === 'be' ? '245,158,11' : p.id === 'mailinh' ? '22,163,74' : '129,140,248'}, 0.12)` : 'var(--bg-card)',
                boxShadow: isActive ? `0 8px 24px -6px ${p.color}40` : 'none',
                transition: 'all 0.25s ease',
                position: 'relative',
                overflow: 'hidden'
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 26 }}>{p.logo}</span>
                  <div>
                    <strong style={{ fontSize: 16, color: isActive ? p.color : 'inherit', display: 'block' }}>
                      {p.name}
                    </strong>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Hotline: {p.hotline}</span>
                  </div>
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: isActive ? p.color : 'var(--bg-surface)',
                  color: isActive ? '#fff' : 'var(--text-muted)'
                }}>
                  {p.badge}
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                {p.slogan}
              </p>
            </div>
          );
        })}
      </div>

      {/* NỘI DUNG THEO TAB CHÍNH */}
      {activeTab === 'embed' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          {/* Cột Trái: Web Viewer & Thông tin hãng */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            {/* Header thanh công cụ của hãng */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-surface)',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>{activeProvider.logo}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: activeProvider.color }}>
                    {activeProvider.fullName}
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {activeProvider.website !== '#' ? activeProvider.website : 'Dịch vụ nội bộ khách sạn'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {activeProvider.website !== '#' && (
                  <a
                    href={activeProvider.website}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ background: activeProvider.color, borderColor: activeProvider.color, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🚀</span> Mở Website Đặt Xe
                  </a>
                )}
                <a
                  href={`tel:${activeProvider.hotline.replace(/\s+/g, '')}`}
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📞</span> Gọi {activeProvider.hotline}
                </a>
              </div>
            </div>

            {/* Nội dung chi tiết & Trình nhúng */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Thẻ mô tả nhanh */}
              <div style={{
                background: 'var(--bg-surface)',
                borderRadius: 12,
                padding: '16px 20px',
                border: '1px solid var(--border)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 16
              }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Mức Giá Ước Tính
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                    {activeProvider.priceSample}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Điểm Đón Mặc Định
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                    📍 Sảnh chính Khách sạn Grand Palace (Thái Nguyên)
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Thời Gian Xe Đến Sảnh
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981', marginTop: 4 }}>
                    ⏱️ Khoảng 3 - 5 phút sau khi đặt
                  </div>
                </div>
              </div>

              {/* Danh sách đặc quyền & Tính năng */}
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>
                  Ưu điểm nổi bật của dịch vụ {activeProvider.name}:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {activeProvider.features.map((f, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)'
                    }}>
                      <span style={{ color: activeProvider.color, fontWeight: 800 }}>✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Khung nhúng Portal / Trực quan */}
              <div style={{
                borderRadius: 14,
                overflow: 'hidden',
                border: '1px solid var(--border)',
                background: '#0f172a',
                height: 480,
                position: 'relative'
              }}>
                {activeProvider.website !== '#' ? (
                  <iframe
                    src={activeProvider.website}
                    title={activeProvider.name}
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  />
                ) : (
                  <div style={{
                    height: '100%', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', color: '#fff', textAlign: 'center', padding: 20
                  }}>
                    <span style={{ fontSize: 56, marginBottom: 12 }}>👑</span>
                    <h3 style={{ fontSize: 20, fontWeight: 700 }}>Dịch Vụ Xe Riêng Limousine Grand Palace</h3>
                    <p style={{ maxWidth: 500, color: '#cbd5e1', fontSize: 14, lineHeight: 1.6 }}>
                      Khách sạn cung cấp xe riêng đưa đón sân bay Nội Bài, đưa đón khách VIP tham dự hội nghị và tour du lịch vòng quanh Thái Nguyên với tài xế riêng chuẩn phong cách 5 sao.
                    </p>
                    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => setActiveTab('quickCall')}>
                        🛎️ Yêu Cầu Điều Xe Tại Sảnh
                      </button>
                      <a href="tel:02083888999" className="btn btn-outline" style={{ color: '#fff', borderColor: '#cbd5e1' }}>
                        📞 Gọi Lễ Tân (Phím 0)
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cột Phải: Tải Ứng Dụng & QR Code & Hotline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Box Tải App */}
            <div className="card" style={{ textAlign: 'center', padding: 24 }}>
              <div style={{
                width: 60, height: 60, borderRadius: 16, background: `rgba(255,255,255,0.06)`,
                border: `1px solid ${activeProvider.color}`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 12px', fontSize: 28
              }}>
                {activeProvider.logo}
              </div>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Đặt Xe Qua Ứng Dụng</h4>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, marginBottom: 16 }}>
                {activeProvider.qrDesc}
              </p>

              {/* Giả lập QR Code trực quan */}
              <div style={{
                width: 160, height: 160, margin: '0 auto 16px', borderRadius: 12,
                background: '#fff', padding: 10, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(activeProvider.website)}`}
                  alt={`QR ${activeProvider.name}`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>

              {activeProvider.appStore && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <a
                    href={activeProvider.appStore}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline"
                    style={{ fontSize: 12, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🍏</span> Tải trên App Store
                  </a>
                  <a
                    href={activeProvider.googlePlay}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline"
                    style={{ fontSize: 12, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🤖</span> Tải trên Google Play
                  </a>
                </div>
              )}
            </div>

            {/* Box Hỗ Trợ Đón Khách */}
            <div className="card" style={{ background: 'var(--bg-surface)' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🛎️</span> Gợi Ý Cho Nhân Viên Lễ Tân
              </h4>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <li>Nhắc tài xế dừng xe tại làn đón khách số 1 trước sảnh chính.</li>
                <li>Hỗ trợ hành lý từ sảnh lên xe cho khách.</li>
                <li>Khách nước ngoài: hỗ trợ cài điểm đến trên ứng dụng hoặc ghi địa chỉ ra thẻ card khách sạn.</li>
                <li>Cung cấp mã khuyến mãi mùa du lịch nếu có.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ĐIỀU XE NHANH TẠI SẢNH */}
      {activeTab === 'quickCall' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Form Điều Xe */}
          <div className="card">
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🛎️</span> Phiếu Yêu Cầu Điều Xe Cho Khách Lưu Trú
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Nhân viên lễ tân điền thông tin để gọi xe nhanh, tài xế sẽ được điều phối tới ngay sảnh khách sạn.
            </p>

            {bookingStatus && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                padding: '12px 16px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16
              }}>
                ✅ {bookingStatus}
              </div>
            )}

            <form onSubmit={handleQuickBook} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Số Phòng Của Khách *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ví dụ: 304, 502..."
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Tên Khách Hàng (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ví dụ: Anh Hoàng, Chị Lan..."
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Hãng Xe Ưu Tiên
                </label>
                <select
                  className="form-control"
                  value={activeProviderId}
                  onChange={(e) => setActiveProviderId(e.target.value)}>
                  {TAXI_PROVIDERS.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.fullName} ({p.hotline})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Loại Xe
                  </label>
                  <select
                    className="form-control"
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}>
                    <option value="4-cho">Xe 4 chỗ (Sedan phổ thông / VF5)</option>
                    <option value="7-cho">Xe 7 chỗ (MPV / SUV / VF8)</option>
                    <option value="limousine">Limousine VIP 9 chỗ (Khách sạn)</option>
                    <option value="bike">Xe máy (Xanh SM Bike / GrabBike)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Điểm Đón
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value="Sảnh chính Grand Palace Hotel"
                    readOnly
                    style={{ background: 'var(--bg-surface)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Điểm Đến
                </label>
                <select
                  className="form-control"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}>
                  {POPULAR_DESTINATIONS.map((d, i) => (
                    <option key={i} value={d.name}>
                      {d.name} ({d.distance} - {d.estPrice})
                    </option>
                  ))}
                  <option value="Tự do theo thỏa thuận khách">Điểm đến khác (theo yêu cầu của khách)</option>
                </select>
              </div>

              <div style={{ marginTop: 8 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px 20px', fontSize: 15, fontWeight: 700, display: 'flex', justifyContent: 'center', gap: 8 }}>
                  <span>🚖</span> Xác Nhận Gọi Xe Tới Sảnh Ngay
                </button>
              </div>
            </form>
          </div>

          {/* Danh sách xe đang đón tại sảnh */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🚏</span> Danh Sách Chuyến Xe Đón Tại Sảnh ({activeOrders.length})
              </h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cập nhật theo thời gian thực</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeOrders.map(order => (
                <div key={order.id} style={{
                  padding: 14,
                  borderRadius: 12,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{
                        background: 'rgba(99, 102, 241, 0.15)', color: 'var(--indigo)',
                        fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4
                      }}>
                        {order.id}
                      </span>
                      <strong style={{ fontSize: 14 }}>{order.room}</strong>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>• {order.guest}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      📍 <strong>Điểm đến:</strong> {order.dest}
                    </div>
                    <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>
                      ⚡ {order.status}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                      background: 'rgba(2, 132, 199, 0.15)', color: '#0284c7', display: 'inline-block', marginBottom: 4
                    }}>
                      {order.provider}
                    </span>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{order.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BẢNG GIÁ CƯỚC & KHOẢNG CÁCH */}
      {activeTab === 'guide' && (
        <div className="card">
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📍</span> Bảng Giá Cước & Quãng Đường Tham Khảo Từ Khách Sạn Grand Palace
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Khoảng cách và giá cước ước tính cho các tuyến di chuyển thông dụng của khách du lịch và công tác tại Thái Nguyên.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Điểm Đến</th>
                  <th style={{ padding: '12px 16px' }}>Khoảng Cách</th>
                  <th style={{ padding: '12px 16px' }}>Thời Gian Ước Tính</th>
                  <th style={{ padding: '12px 16px' }}>Giá Cước Taxi Công Nghệ (Xanh SM / Grab / Be)</th>
                  <th style={{ padding: '12px 16px' }}>Xe Riêng Khách Sạn VIP</th>
                </tr>
              </thead>
              <tbody>
                {POPULAR_DESTINATIONS.map((d, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>{d.name}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{d.distance}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{d.time}</td>
                    <td style={{ padding: '14px 16px', color: '#0284c7', fontWeight: 600 }}>{d.estPrice}</td>
                    <td style={{ padding: '14px 16px' }}>
                      {idx === 0 ? (
                        <span style={{ color: 'var(--indigo)', fontWeight: 700 }}>450.000đ (Sedan) / 800.000đ (Limo)</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Theo thỏa thuận tour</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
