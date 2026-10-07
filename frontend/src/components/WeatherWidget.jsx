import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';

/* ─── OPEN-METEO: Miễn phí 100%, không cần API Key, cập nhật 15 phút/lần ─── */
// Tọa độ mặc định: Thái Nguyên
const WMO_CODES = {
  0:  { label: 'Trời quang',        icon: '☀️' },
  1:  { label: 'Chủ yếu quang',     icon: '🌤️' },
  2:  { label: 'Có mây rải rác',    icon: '⛅' },
  3:  { label: 'Nhiều mây',         icon: '☁️' },
  45: { label: 'Có sương mù',       icon: '🌫️' },
  48: { label: 'Sương mù đóng băng',icon: '🌫️' },
  51: { label: 'Mưa phùn nhẹ',      icon: '🌦️' },
  53: { label: 'Mưa phùn vừa',      icon: '🌦️' },
  55: { label: 'Mưa phùn nặng',     icon: '🌧️' },
  61: { label: 'Mưa nhẹ',           icon: '🌧️' },
  63: { label: 'Mưa vừa',           icon: '🌧️' },
  65: { label: 'Mưa to',            icon: '🌧️' },
  71: { label: 'Tuyết nhẹ',         icon: '🌨️' },
  73: { label: 'Tuyết vừa',         icon: '🌨️' },
  75: { label: 'Tuyết nặng',        icon: '❄️' },
  80: { label: 'Mưa rào nhẹ',       icon: '🌦️' },
  81: { label: 'Mưa rào vừa',       icon: '🌧️' },
  82: { label: 'Mưa rào mạnh',      icon: '⛈️' },
  95: { label: 'Giông bão',         icon: '⛈️' },
  96: { label: 'Giông có mưa đá',   icon: '⛈️' },
  99: { label: 'Giông mưa đá nặng', icon: '⛈️' },
};

const getWmo = (code) => WMO_CODES[code] || { label: 'Không xác định', icon: '🌡️' };

const DAYS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function formatDay(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Hôm nay';
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return 'Ngày mai';
  return DAYS_VI[d.getDay()];
}

function getUVLevel(uv) {
  if (uv <= 2) return { label: 'Thấp', color: '#22c55e' };
  if (uv <= 5) return { label: 'Trung bình', color: '#eab308' };
  if (uv <= 7) return { label: 'Cao', color: '#f97316' };
  if (uv <= 10) return { label: 'Rất cao', color: '#ef4444' };
  return { label: 'Cực cao', color: '#a855f7' };
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [panelPos, setPanelPos]     = useState({ top: 0, right: 0 });
  
  // States cho tìm kiếm địa điểm
  const [location, setLocation] = useState({ lat: 21.5928, lon: 105.8442, name: 'Thái Nguyên' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const anchorRef = useRef(null);

  const fetchWeather = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,uv_index,precipitation_probability` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max` +
        `&timezone=Asia%2FHo_Chi_Minh&forecast_days=7`;

      const res  = await fetch(url);
      if (!res.ok) throw new Error('Lỗi kết nối dịch vụ thời tiết');
      const data = await res.json();
      setWeather(data);
      setLastUpdate(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [location.lat, location.lon]);

  useEffect(() => {
    fetchWeather();
    // Cập nhật mỗi 10 phút
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  // Debounced Search API
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=5&language=vi&format=json`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (e) {
        console.error("Geocoding error", e);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectLocation = (loc) => {
    setLocation({
      lat: loc.latitude,
      lon: loc.longitude,
      name: loc.name + (loc.admin1 ? `, ${loc.admin1}` : '') + (loc.country ? ` (${loc.country})` : '')
    });
    setSearchQuery('');
    setSearchResults([]);
    setExpanded(false); // Đóng panel sau khi chọn
  };

  if (loading && !weather) return (
    <div className="weather-widget weather-loading">
      <div className="weather-spinner">⟳</div>
      <span>Đang tải thời tiết...</span>
    </div>
  );

  if (error) return (
    <div className="weather-widget weather-error" onClick={fetchWeather} title="Nhấn để thử lại">
      <span>🌐</span>
      <span style={{ fontSize: 11 }}>Không lấy được thời tiết</span>
    </div>
  );

  if (!weather) return null;

  const cur     = weather.current;
  const daily   = weather.daily;
  const wmo     = getWmo(cur.weather_code);
  const uv      = getUVLevel(cur.uv_index);
  const updStr  = lastUpdate ? lastUpdate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';

  // Tính vị trí dropdown dựa vào vị trí của widget trong topbar
  const handleToggle = () => {
    if (!expanded && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPanelPos({
        top:   rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setExpanded(p => !p);
  };

  return (
    <div style={{ position: 'relative' }} ref={anchorRef}>
      {/* ── Compact View (luôn hiển thị trong topbar) ── */}
      <div className="weather-widget" style={{ cursor: 'pointer' }} onClick={handleToggle} title="Nhấn để xem dự báo 7 ngày">
        <div className="weather-compact">
          <span className="weather-icon-big">{wmo.icon}</span>
          <div className="weather-main-info">
            <div className="weather-temp">{Math.round(cur.temperature_2m)}°C</div>
            <div className="weather-city">{location.name.split(',')[0]}</div>
          </div>
          <div className="weather-side-info">
            <div style={{ fontSize: 10, opacity: 0.75 }}>{wmo.label}</div>
            <div style={{ fontSize: 10, opacity: 0.6 }}>💧{cur.relative_humidity_2m}%  💨{Math.round(cur.wind_speed_10m)}km/h</div>
            <div style={{ fontSize: 10, opacity: 0.5 }}>Cập nhật {updStr}</div>
          </div>
          <button className="weather-toggle" onClick={(e) => { e.stopPropagation(); fetchWeather(); }} title="Làm mới">↻</button>
          <span className="weather-arrow">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* ── Portal: Render dropdown thẳng vào body, thoát khỏi mọi stacking context ── */}
      {expanded && ReactDOM.createPortal(
        <>
          {/* Backdrop để đóng khi click ngoài */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99998 }}
            onClick={() => setExpanded(false)}
          />
          <div
            className="weather-dropdown-panel"
            style={{
              position: 'fixed',
              top:   panelPos.top,
              right: panelPos.right,
              zIndex: 99999,
            }}
          >
            {/* Header & Search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                {wmo.icon} {wmo.label} — {location.name}
              </div>
              <div className="weather-search-container">
                <input
                  type="text"
                  className="weather-search-input form-control"
                  placeholder="🔍 Tìm kiếm thành phố khác..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {isSearching && <span className="weather-search-spinner">⟳</span>}
                {searchResults.length > 0 && (
                  <div className="weather-search-results">
                    {searchResults.map(loc => (
                      <div key={loc.id} className="weather-search-item" onClick={() => selectLocation(loc)}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{loc.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 8 }}>
                          {loc.admin1 ? `${loc.admin1}, ` : ''}{loc.country}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="weather-detail-row">
              <div className="weather-detail-card">
                <div className="weather-detail-label">🌡️ Cảm giác như</div>
                <div className="weather-detail-val">{Math.round(cur.apparent_temperature)}°C</div>
              </div>
              <div className="weather-detail-card">
                <div className="weather-detail-label">🌂 Khả năng mưa</div>
                <div className="weather-detail-val">{cur.precipitation_probability}%</div>
              </div>
              <div className="weather-detail-card">
                <div className="weather-detail-label">☀️ Chỉ số UV</div>
                <div className="weather-detail-val" style={{ color: uv.color }}>{cur.uv_index} — {uv.label}</div>
              </div>
              <div className="weather-detail-card">
                <div className="weather-detail-label">💨 Tốc độ gió</div>
                <div className="weather-detail-val">{Math.round(cur.wind_speed_10m)} km/h</div>
              </div>
            </div>

            <div className="weather-forecast-title">📅 Dự báo 7 ngày tới</div>
            <div className="weather-forecast-row">
              {daily.time.map((date, i) => {
                const fw = getWmo(daily.weather_code[i]);
                return (
                  <div key={date} className="weather-forecast-day">
                    <div className="weather-fc-day">{formatDay(date)}</div>
                    <div className="weather-fc-icon">{fw.icon}</div>
                    <div className="weather-fc-max">{Math.round(daily.temperature_2m_max[i])}°</div>
                    <div className="weather-fc-min">{Math.round(daily.temperature_2m_min[i])}°</div>
                    <div className="weather-fc-rain">💧{daily.precipitation_probability_max[i]}%</div>
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: 9, opacity: 0.4, textAlign: 'right', marginTop: 8 }}>
              Nguồn: Open-Meteo.com — Cập nhật lúc {updStr}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
