import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './styles.css';
import './translate.css';
import TroLyAIGocPhai from './components/TroLyAIGocPhai.jsx';
import WeatherWidget from './components/WeatherWidget.jsx';
import TaxiPage from './components/TaxiPage.jsx';

/* ════════════════════════════════════════════════════════════════════════════
   UTILITIES
   ════════════════════════════════════════════════════════════════════════════ */
const API = async (path, opts = {}, token = null) => {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`/api${path}`, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }
  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
  return data;
};

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const fmtNum  = (n) => new Intl.NumberFormat('vi-VN').format(n || 0);

/* ════════════════════════════════════════════════════════════════════════════
   COUNT-UP ANIMATION COMPONENT
   ════════════════════════════════════════════════════════════════════════════ */
function CountUp({ to = 0, duration = 800, prefix = '', suffix = '', format = 'num' }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const target = Number(to) || 0;
    const startTime = performance.now();
    const easeOutExpo = t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
    let reqId;
    const step = (now) => {
      const p = Math.min((now - startTime) / duration, 1);
      setVal(Math.round(start + (target - start) * easeOutExpo(p)));
      if (p < 1) reqId = requestAnimationFrame(step);
    };
    reqId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(reqId);
  }, [to, duration]);

  if (format === 'vnd') return <span>{prefix}{fmt(val)}{suffix}</span>;
  if (format === 'pct') return <span>{prefix}{val}%{suffix}</span>;
  return <span>{prefix}{fmtNum(val)}{suffix}</span>;
}


/* ════════════════════════════════════════════════════════════════════════════
   TOAST
   ════════════════════════════════════════════════════════════════════════════ */
let _addToast = null;
function Toast({ toasts, remove }) {
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => remove(t.id)}>
          <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  const remove = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);
  _addToast = add;
  return { toasts, add, remove };
}
const toast = (msg, type = 'success') => _addToast?.(msg, type);

/* ════════════════════════════════════════════════════════════════════════════
   SSE REALTIME HOOK
   ════════════════════════════════════════════════════════════════════════════ */
/**
 * Kết nối SSE với backend, gọi callback mỗi khi có event
 * Tự động reconnect nếu mất kết nối.
 */
function useRealtime(token, onEvent) {
  const esRef       = useRef(null);
  const retryRef    = useRef(null);
  const onEventRef  = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (!token) return;
    const url = `/api/events?token=${encodeURIComponent(token)}`;
    const es  = new EventSource(url);
    esRef.current = es;

    es.addEventListener('connected', () => {
      console.log('📡 SSE kết nối thành công');
    });

    es.addEventListener('booking_update', (e) => {
      try { onEventRef.current?.({ type: 'booking_update', ...JSON.parse(e.data) }); }
      catch {}
    });

    es.addEventListener('room_update', (e) => {
      try { onEventRef.current?.({ type: 'room_update', ...JSON.parse(e.data) }); }
      catch {}
    });

    es.addEventListener('ping', () => {}); // keepalive

    es.onerror = () => {
      es.close();
      esRef.current = null;
      // Retry sau 3 giây
      retryRef.current = setTimeout(connect, 3000);
    };
  }, [token]);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      clearTimeout(retryRef.current);
    };
  }, [connect]);
}

/* ════════════════════════════════════════════════════════════════════════════
   LIVE INDICATOR component
   ════════════════════════════════════════════════════════════════════════════ */
function LiveDot({ pulse }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, color: pulse ? '#4ade80' : 'var(--text-muted)',
      transition: 'color .3s',
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: pulse ? '#4ade80' : 'rgba(100,116,139,.4)',
        display: 'inline-block',
        animation: pulse ? 'pulse 1.5s infinite' : 'none',
        boxShadow: pulse ? '0 0 6px #4ade80' : 'none',
        transition: 'all .3s',
      }} />
      {pulse ? 'Live' : 'Offline'}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   UPDATE FLASH — hiển thị badge nhấp nháy khi có dữ liệu mới
   ════════════════════════════════════════════════════════════════════════════ */
function UpdateFlash({ show }) {
  if (!show) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 600,
      background: 'rgba(74,222,128,.15)',
      border: '1px solid rgba(74,222,128,.3)',
      color: '#4ade80', borderRadius: 20,
      padding: '3px 10px',
      animation: 'fadeIn .2s ease',
    }}>
      ↻ Vừa cập nhật
    </span>
  );
}


/* ════════════════════════════════════════════════════════════════════════════
   MODAL WRAPPER
   ════════════════════════════════════════════════════════════════════════════ */
function Modal({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const esc = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal anim-modal" style={wide ? { maxWidth: 660 } : {}}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STATUS BADGE HELPERS
   ════════════════════════════════════════════════════════════════════════════ */
const ROOM_STATUS = {
  'trong':   { label: 'Trống',     cls: 'badge-green'  },
  'dang-o':  { label: 'Đang ở',    cls: 'badge-blue'   },
  'don-dep': { label: 'Dọn dẹp',   cls: 'badge-amber'  },
  'bao-tri': { label: 'Bảo trì',   cls: 'badge-rose'   },
};
const ROOM_TYPE = {
  'Don':   { label: 'Đơn',   cls: 'badge-slate'  },
  'Doi':   { label: 'Đôi',   cls: 'badge-cyan'   },
  'VIP':   { label: 'VIP',   cls: 'badge-violet' },
  'Suite': { label: 'Suite', cls: 'badge-amber'  },
};
const BOOKING_STATUS = {
  'da-dat':  { label: 'Đã đặt',  cls: 'badge-blue'   },
  'dang-o':  { label: 'Đang ở',  cls: 'badge-green'  },
  'da-tra':  { label: 'Đã trả',  cls: 'badge-slate'  },
  'huy':     { label: 'Đã hủy',  cls: 'badge-rose'   },
};
const GUEST_RANK = {
  'Moi':        { label: 'Mới',        cls: 'badge-slate'  },
  'Bac':        { label: '🥈 Bạc',     cls: 'badge-slate'  },
  'Vang':       { label: '🥇 Vàng',    cls: 'badge-amber'  },
  'Kim cuong':  { label: '💎 Kim Cương', cls: 'badge-cyan' },
};
const HK_STATUS = {
  'sach':     { label: '✨ Sạch',     cls: 'badge-green' },
  'ban':      { label: '🧹 Bẩn',      cls: 'badge-rose' },
  'dang-don': { label: '🧼 Đang dọn', cls: 'badge-amber' },
};

function RoomStatusBadge({ s }) {
  const d = ROOM_STATUS[s] || { label: s, cls: 'badge-slate' };
  return <span className={`badge ${d.cls}`}>{d.label}</span>;
}
function RoomTypeBadge({ t }) {
  const d = ROOM_TYPE[t] || { label: t, cls: 'badge-slate' };
  return <span className={`badge ${d.cls}`}>{d.label}</span>;
}
function BookingStatusBadge({ s }) {
  const d = BOOKING_STATUS[s] || { label: s, cls: 'badge-slate' };
  return <span className={`badge ${d.cls}`}>{d.label}</span>;
}
function GuestRankBadge({ r }) {
  const d = GUEST_RANK[r] || { label: r, cls: 'badge-slate' };
  return <span className={`badge ${d.cls}`}>{d.label}</span>;
}
function HousekeepingBadge({ s }) {
  const d = HK_STATUS[s] || { label: s, cls: 'badge-slate' };
  return <span className={`badge ${d.cls}`}>{d.label}</span>;
}

/* ════════════════════════════════════════════════════════════════════════════
   LOGIN PAGE
   ════════════════════════════════════════════════════════════════════════════ */
function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await API('/auth/login', {
        method: 'POST', body: JSON.stringify(form),
      });
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-glow" />
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="icon">🏨</div>
          <h1>Grand Palace PMS</h1>
          <p>Hệ thống quản lý khách sạn thông minh</p>
        </div>

        {/* Error */}
        {error && (
          <div className="login-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Tên đăng nhập</label>
            <input
              className="form-control"
              type="text"
              placeholder="admin hoặc staff"
              value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              required autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-control"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
                style={{ paddingRight: 40 }}
              />
              <button type="button" onClick={() => setShowPass(p => !p)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 16,
                color: 'var(--text-muted)',
              }}>{showPass ? '🙈' : '👁️'}</button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 8, fontSize: 14 }}
          >
            {loading ? <><span className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} /> Đang đăng nhập...</> : '🔓 Đăng nhập'}
          </button>
        </form>

        {/* Hint */}
        <div style={{ marginTop: 20, padding: 14, background: 'rgba(99,102,241,.08)', borderRadius: 12, border: '1px solid rgba(99,102,241,.15)' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 8 }}>Tài khoản demo</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['admin', 'admin123', '👑'], ['staff', 'staff123', '👤']].map(([u, p, ic]) => (
              <button key={u} type="button" onClick={() => setForm({ username: u, password: p })}
                style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 9, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'inherit', transition: 'all .15s' }}
                onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,.08)'}
                onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,.04)'}
              >{ic} {u} / {p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   HOTEL PROMOTIONS & DISCOUNT CALCULATION
   ════════════════════════════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════════════════════════
   HOTEL PROMOTIONS & DISCOUNT CALCULATION
   ════════════════════════════════════════════════════════════════════════════ */
const HOTEL_PROMOTIONS = [
  {
    id: 'PROMO_DON_10',
    code: 'DON10',
    title: 'Ưu Đãi Phòng Đơn - Giảm 10%',
    roomType: 'Don',
    roomTypeLabel: 'Phòng Đơn',
    category: 'room',
    discountType: 'percent',
    discountValue: 10,
    badge: 'Phòng Đơn · Giảm 10%',
    badgeCls: 'badge-blue',
    desc: 'Ưu đãi cho khách công tác hoặc lưu trú cá nhân, giảm trực tiếp 10% tiền phòng khi nhận phòng.',
    savingEstimate: 'Tiết kiệm ~60.000đ - 120.000đ/đêm',
    icon: '🛏️',
  },
  {
    id: 'PROMO_DOI_15',
    code: 'DOI15',
    title: 'Ưu Đãi Phòng Đôi - Giảm 15%',
    roomType: 'Doi',
    roomTypeLabel: 'Phòng Đôi',
    category: 'room',
    discountType: 'percent',
    discountValue: 15,
    badge: 'Phòng Đôi · Giảm 15%',
    badgeCls: 'badge-cyan',
    desc: 'Ưu đãi nghỉ dưỡng cho cặp đôi & gia đình nhỏ, giảm ngay 15% tổng tiền phòng.',
    savingEstimate: 'Tiết kiệm ~120.000đ - 180.000đ/đêm',
    icon: '👫',
  },
  {
    id: 'PROMO_SUITE_20',
    code: 'SUITE20',
    title: 'Ưu Đãi Suite Ban Công - Giảm 20%',
    roomType: 'Suite',
    roomTypeLabel: 'Suite Ban Công',
    category: 'room',
    discountType: 'percent',
    discountValue: 20,
    badge: 'Suite · Giảm 20%',
    badgeCls: 'badge-violet',
    desc: 'Trải nghiệm phòng Suite ngắm cảnh hoàng hôn, giảm ngay 20% trừ trực tiếp khi nhận phòng.',
    savingEstimate: 'Tiết kiệm ~240.000đ - 360.000đ/đêm',
    icon: '🌆',
  },
  {
    id: 'PROMO_VIP_25',
    code: 'VIP25',
    title: 'Đặc Quyền VIP President - Giảm 25%',
    roomType: 'VIP',
    roomTypeLabel: 'VIP / President',
    category: 'room',
    discountType: 'percent',
    discountValue: 25,
    badge: 'VIP · Giảm 25%',
    badgeCls: 'badge-amber',
    desc: 'Đặc quyền nghỉ dưỡng thượng lưu, giảm trực tiếp 25% tiền phòng khi làm thủ tục check-in.',
    savingEstimate: 'Tiết kiệm ~450.000đ - 700.000đ/đêm',
    icon: '👑',
  },
  {
    id: 'PROMO_EARLY_100K',
    code: 'EARLY100K',
    title: 'Voucher Check-in Sớm - Trừ 100K',
    roomType: 'all',
    roomTypeLabel: 'Tất cả loại phòng',
    category: 'amount',
    discountType: 'amount',
    discountValue: 100000,
    badge: 'Mọi phòng · -100.000đ',
    badgeCls: 'badge-green',
    desc: 'Áp dụng cho mọi loại phòng khi khách nhận phòng, trừ thẳng 100.000 VNĐ vào hóa đơn.',
    savingEstimate: 'Trừ ngay 100.000 VNĐ tiền mặt',
    icon: '🎁',
  },
  {
    id: 'PROMO_WEEKEND_12',
    code: 'WEEKEND12',
    title: 'Ưu Đãi Cuối Tuần Vui Vẻ - Giảm 12%',
    roomType: 'all',
    roomTypeLabel: 'Tất cả loại phòng',
    category: 'special',
    discountType: 'percent',
    discountValue: 12,
    badge: 'Cuối tuần · Giảm 12%',
    badgeCls: 'badge-rose',
    desc: 'Ưu đãi kích cầu cuối tuần, giảm 12% tiền phòng cho khách đặt và nhận phòng Thứ 6 - CN.',
    savingEstimate: 'Tiết kiệm 12% tổng tiền phòng',
    icon: '🎉',
  },
  {
    id: 'PROMO_MEMBER_18',
    code: 'MEMBER18',
    title: 'Hội Viên Thân Thiết (Gold & Diamond) - Giảm 18%',
    roomType: 'all',
    roomTypeLabel: 'Tất cả loại phòng',
    category: 'member',
    discountType: 'percent',
    discountValue: 18,
    badge: 'Hội viên · Giảm 18%',
    badgeCls: 'badge-violet',
    desc: 'Đặc quyền dành riêng cho khách hàng sở hữu thẻ Gold / Diamond, tích điểm và giảm trực tiếp 18% tiền phòng.',
    savingEstimate: 'Tiết kiệm ~150.000đ - 450.000đ/đêm',
    icon: '💎',
  },
  {
    id: 'PROMO_LONGSTAY_30',
    code: 'LONGSTAY30',
    title: 'Nghỉ Dưỡng Dài Ngày (Từ 3 đêm) - Giảm 30%',
    roomType: 'all',
    roomTypeLabel: 'Tất cả loại phòng',
    category: 'special',
    discountType: 'percent',
    discountValue: 30,
    badge: 'Lưu trú dài · Giảm 30%',
    badgeCls: 'badge-green',
    desc: 'Tiết kiệm tối đa cho chuyến công tác hoặc nghỉ dưỡng dài ngày, giảm ngay 30% khi đặt từ 3 đêm trở lên.',
    savingEstimate: 'Tiết kiệm tới 30% tổng hóa đơn phòng',
    icon: '🏖️',
  },
  {
    id: 'PROMO_EARLYBIRD_20',
    code: 'EARLYBIRD20',
    title: 'Đặt Phòng Sớm (Trước 14 Ngày) - Giảm 20%',
    roomType: 'all',
    roomTypeLabel: 'Tất cả loại phòng',
    category: 'special',
    discountType: 'percent',
    discountValue: 20,
    badge: 'Đặt sớm · Giảm 20%',
    badgeCls: 'badge-blue',
    desc: 'Lên kế hoạch du lịch chu đáo và nhận ngay mức giá ưu đãi giảm 20% khi đặt cọc trước tối thiểu 14 ngày.',
    savingEstimate: 'Tiết kiệm ~140.000đ - 380.000đ/đêm',
    icon: '📅',
  },
  {
    id: 'PROMO_HONEYMOON_300K',
    code: 'HONEYMOON',
    title: 'Combo Trăng Mật Lãng Mạn - Trừ 300K',
    roomType: 'Suite',
    roomTypeLabel: 'Suite / VIP',
    category: 'member',
    discountType: 'amount',
    discountValue: 300000,
    badge: 'Trăng mật · -300.000đ',
    badgeCls: 'badge-rose',
    desc: 'Set up nến hoa lãng mạn, tặng 1 chai vang Pháp thượng hạng và giảm trực tiếp 300.000 VNĐ vào tiền phòng.',
    savingEstimate: 'Trừ ngay 300.000 VNĐ + Tặng vang Pháp',
    icon: '🌹',
  },
  {
    id: 'PROMO_BUSINESS_15',
    code: 'BIZ15',
    title: 'Gói Doanh Nhân Công Tác - Giảm 15%',
    roomType: 'Don',
    roomTypeLabel: 'Phòng Đơn',
    category: 'room',
    discountType: 'percent',
    discountValue: 15,
    badge: 'Doanh nhân · Giảm 15%',
    badgeCls: 'badge-cyan',
    desc: 'Lựa chọn hàng đầu cho chuyên gia & doanh nhân: giảm 15% tiền phòng cùng miễn phí giặt ủi 2 bộ trang phục/ngày.',
    savingEstimate: 'Tiết kiệm ~90.000đ - 160.000đ/đêm',
    icon: '💼',
  },
  {
    id: 'PROMO_FAMILY_22',
    code: 'FAMILY22',
    title: 'Kỳ Nghỉ Gia Đình Hạnh Phúc - Giảm 22%',
    roomType: 'Doi',
    roomTypeLabel: 'Phòng Đôi',
    category: 'room',
    discountType: 'percent',
    discountValue: 22,
    badge: 'Gia đình · Giảm 22%',
    badgeCls: 'badge-amber',
    desc: 'Không gian ấm cúng cho cả gia đình, giảm 22% tiền phòng và miễn phí buffet sáng cho 2 trẻ em dưới 10 tuổi.',
    savingEstimate: 'Tiết kiệm ~200.000đ - 320.000đ/đêm',
    icon: '👨‍👩‍👧‍👦',
  },
  {
    id: 'PROMO_FLASH_NIGHT_150K',
    code: 'NIGHT150',
    title: 'Flash Deal Đêm Muộn (Sau 20h) - Trừ 150K',
    roomType: 'all',
    roomTypeLabel: 'Tất cả loại phòng',
    category: 'amount',
    discountType: 'amount',
    discountValue: 150000,
    badge: 'Flash Deal · -150.000đ',
    badgeCls: 'badge-amber',
    desc: 'Khuyến mãi giờ vàng áp dụng cho khách đặt và nhận phòng sau 20h00 trong ngày, trừ thẳng 150.000 VNĐ vào hóa đơn.',
    savingEstimate: 'Trừ ngay 150.000 VNĐ tiền phòng',
    icon: '⚡',
  },
  {
    id: 'PROMO_VIP_LUXURY_500K',
    code: 'VIPLUX500',
    title: 'Đặc Quyền President Luxury - Trừ 500K',
    roomType: 'VIP',
    roomTypeLabel: 'VIP President',
    category: 'amount',
    discountType: 'amount',
    discountValue: 500000,
    badge: 'VIP Thượng lưu · -500.000đ',
    badgeCls: 'badge-violet',
    desc: 'Trải nghiệm đỉnh cao: miễn phí xe Limousine đón tiễn sân bay, minibar cao cấp và giảm trực tiếp 500.000 VNĐ khi check-in.',
    savingEstimate: 'Trừ thẳng 500.000 VNĐ + Free Limousine',
    icon: '👑',
  },
  {
    id: 'PROMO_BIRTHDAY_20',
    code: 'BDAY20',
    title: 'Mừng Sinh Nhật Khách Hàng - Giảm 20%',
    roomType: 'all',
    roomTypeLabel: 'Tất cả loại phòng',
    category: 'special',
    discountType: 'percent',
    discountValue: 20,
    badge: 'Sinh nhật · Giảm 20%',
    badgeCls: 'badge-rose',
    desc: 'Chúc mừng sinh nhật quý khách! Giảm ngay 20% tiền phòng trong tuần sinh nhật kèm quà tặng bánh kem độc quyền khách sạn.',
    savingEstimate: 'Tiết kiệm 20% + Tặng bánh kem',
    icon: '🎂',
  },
  {
    id: 'PROMO_SPA_WELLNESS',
    code: 'SPA25',
    title: 'Combo Nghỉ Dưỡng & Spa Trị Liệu - Giảm 25%',
    roomType: 'all',
    roomTypeLabel: 'Tất cả loại phòng',
    category: 'special',
    discountType: 'percent',
    discountValue: 25,
    badge: 'Spa & Relax · Giảm 25%',
    badgeCls: 'badge-emerald',
    desc: 'Tái tạo năng lượng hoàn hảo: giảm 25% tiền phòng cùng 1 voucher massage đá nóng thư giãn tại Grand Lotus Spa.',
    savingEstimate: 'Tiết kiệm ~250.000đ - 450.000đ/đêm',
    icon: '💆‍♀️',
  },
  {
    id: 'PROMO_BBQ_BUFFET_200K',
    code: 'BBQ200',
    title: 'Combo Ẩm Thực Buffet BBQ Sân Vườn - Trừ 200K',
    roomType: 'all',
    roomTypeLabel: 'Tất cả loại phòng',
    category: 'amount',
    discountType: 'amount',
    discountValue: 200000,
    badge: 'Buffet BBQ · -200.000đ',
    badgeCls: 'badge-amber',
    desc: 'Thưởng thức đại tiệc nướng hải sản ngoài trời, trừ trực tiếp 200.000 VNĐ vào tổng chi phí phòng khi check-in.',
    savingEstimate: 'Trừ ngay 200.000 VNĐ tiền mặt',
    icon: '🥩',
  },
  {
    id: 'PROMO_STUDENT_TEACHER',
    code: 'EDU20',
    title: 'Tri Ân Giáo Viên & Sinh Viên - Giảm 20%',
    roomType: 'all',
    roomTypeLabel: 'Tất cả loại phòng',
    category: 'special',
    discountType: 'percent',
    discountValue: 20,
    badge: 'Giáo dục · Giảm 20%',
    badgeCls: 'badge-blue',
    desc: 'Ưu đãi dành cho thầy cô và các bạn sinh viên du lịch, giảm ngay 20% khi xuất trình thẻ học sinh/giảng viên.',
    savingEstimate: 'Tiết kiệm 20% tổng tiền phòng',
    icon: '🎓',
  },
  {
    id: 'PROMO_SUITE_PRESIDENTIAL_700K',
    code: 'PRESIDENT700',
    title: 'Đặc Quyền Hoàng Gia Penthouse - Trừ 700K',
    roomType: 'VIP',
    roomTypeLabel: 'VIP President',
    category: 'amount',
    discountType: 'amount',
    discountValue: 700000,
    badge: 'Hoàng gia · -700.000đ',
    badgeCls: 'badge-violet',
    desc: 'Trải nghiệm đỉnh cao không gian Penthouse view 360 độ, phục vụ quản gia riêng 24/7 và trừ thẳng 700.000 VNĐ.',
    savingEstimate: 'Trừ thẳng 700.000 VNĐ tiền mặt',
    icon: '💎',
  },
  {
    id: 'PROMO_EARLY_BIRD_30D',
    code: 'SUPERBIRD30',
    title: 'Super Early Bird (Đặt Sớm 30 Ngày) - Giảm 35%',
    roomType: 'all',
    roomTypeLabel: 'Tất cả loại phòng',
    category: 'special',
    discountType: 'percent',
    discountValue: 35,
    badge: 'Sớm 30 ngày · Giảm 35%',
    badgeCls: 'badge-green',
    desc: 'Ưu đãi mức giảm cao nhất năm dành cho khách lên lịch trình sớm trước 30 ngày, giảm tới 35% tiền phòng.',
    savingEstimate: 'Tiết kiệm tới 35% tổng tiền phòng',
    icon: '🛫',
  }
];

function calculateDiscount(promo, basePrice) {
  if (!promo || !basePrice || basePrice <= 0) return 0;
  if (promo.discountType === 'percent') {
    return Math.round((basePrice * promo.discountValue) / 100);
  }
  if (promo.discountType === 'amount') {
    return Math.min(basePrice, promo.discountValue);
  }
  return 0;
}

/* ════════════════════════════════════════════════════════════════════════════
   AI SMART STRATEGY INSIGHTS COMPONENT (ƯU ĐÃI THEO LOẠI PHÒNG)
   ════════════════════════════════════════════════════════════════════════════ */
function AiInsightsPanel({ onNav, onBookWithPromo }) {
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filteredPromos = HOTEL_PROMOTIONS.filter(p => {
    // Lọc theo danh mục hoặc loại phòng
    let matchType = true;
    if (filterType === 'all') matchType = true;
    else if (filterType === 'amount') matchType = p.discountType === 'amount';
    else if (filterType === 'member') matchType = p.category === 'member' || p.category === 'special';
    else matchType = p.roomType === filterType || p.roomType === 'all';

    // Lọc theo từ khóa tìm kiếm
    let matchSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      matchSearch = p.title.toLowerCase().includes(q) ||
                    p.code.toLowerCase().includes(q) ||
                    p.desc.toLowerCase().includes(q) ||
                    p.roomTypeLabel.toLowerCase().includes(q) ||
                    p.savingEstimate.toLowerCase().includes(q);
    }
    return matchType && matchSearch;
  });

  // Khi đang ở chế độ xem tất cả và không tìm kiếm, mặc định thu nhỏ chỉ hiển thị 4 ưu đãi đầu tiên (1 hàng x 4 cột)
  const isFiltering = filterType !== 'all' || searchQuery.trim() !== '';
  const displayPromos = isFiltering || showAll ? filteredPromos : filteredPromos.slice(0, 4);

  return (
    <div className="ai-insights-panel">
      <div className="ai-insights-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 32 }}>🎁</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              Gợi ý Chiến lược Thông minh từ AI — Ưu Đãi Khách Sạn
              <span style={{
                background: 'var(--indigo)', color: '#fff', fontSize: 11, fontWeight: 700,
                padding: '3px 10px', borderRadius: 999, textTransform: 'uppercase'
              }}>
                {HOTEL_PROMOTIONS.length} ƯU ĐÃI ĐANG MỞ
              </span>
              <span className="badge badge-amber" style={{ fontSize: 11, padding: '3px 10px', fontWeight: 700 }}>
                ⚡ Trừ thẳng tiền phòng khi nhận
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5, maxWidth: 850 }}>
              Hệ thống gợi ý {HOTEL_PROMOTIONS.length} chương trình khuyến mãi linh hoạt theo loại phòng, thời điểm và đối tượng khách hàng. Tiền ưu đãi được trừ trực tiếp khi nhận phòng.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: 11, fontWeight: 700,
            padding: '4px 12px', borderRadius: 999, textTransform: 'uppercase', boxShadow: '0 2px 8px rgba(99,102,241,0.35)'
          }}>
            ★ 98% Tối ưu
          </span>
          <button 
            className="btn btn-ghost" 
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '6px 14px', fontSize: 12 }} 
            onClick={() => onNav('ai')}
          >
            💬 Hỏi Trợ lý AI →
          </button>
        </div>
      </div>

      {/* Thanh công cụ lọc & tìm kiếm ưu đãi */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '14px 24px 0', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginRight: 2 }}>Phân loại:</span>
          {[
            { key: 'all', label: `Tất cả (${HOTEL_PROMOTIONS.length})` },
            { key: 'Don', label: '🛏️ Phòng Đơn' },
            { key: 'Doi', label: '👫 Phòng Đôi' },
            { key: 'Suite', label: '🌆 Suite' },
            { key: 'VIP', label: '👑 VIP / President' },
            { key: 'amount', label: '💵 Voucher Tiền Mặt' },
            { key: 'member', label: '💎 Hội Viên & Dài Ngày' },
          ].map(t => (
            <button 
              key={t.key} 
              className={`promo-filter-pill ${filterType === t.key ? 'active' : ''}`}
              onClick={() => setFilterType(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Ô tìm kiếm nhanh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input 
            type="text" 
            placeholder="🔍 Tìm ưu đãi (VIP, voucher, giảm...)" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              borderRadius: 20,
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              outline: 'none',
              width: 220,
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
          />
          {searchQuery && (
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={() => setSearchQuery('')}
              style={{ padding: '4px 8px', fontSize: 11 }}
            >
              ✕ Xóa
            </button>
          )}
        </div>
      </div>

      {/* Grid danh sách các thẻ ưu đãi */}
      {displayPromos.length === 0 ? (
        <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Không tìm thấy ưu đãi phù hợp</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Hãy thử từ khóa khác hoặc bấm nút "Tất cả" để xem toàn bộ ưu đãi</div>
        </div>
      ) : (
        <div className="ai-insights-grid">
          {displayPromos.map(p => (
            <div key={p.id} className="ai-insight-card">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span className={`badge ${p.badgeCls}`}>{p.badge}</span>
                  <span className="promo-discount-badge">
                    {p.discountType === 'percent' ? `-${p.discountValue}%` : `-${fmt(p.discountValue)}`}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{p.icon}</span> {p.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 5, lineHeight: 1.45 }}>
                  {p.desc}
                </div>
                <div style={{ fontSize: 12, color: '#059669', fontWeight: 700, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>💡</span> {p.savingEstimate}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <button 
                  className="btn btn-primary btn-sm" 
                  style={{ flex: 1 }}
                  onClick={() => onBookWithPromo ? onBookWithPromo(p) : onNav('bookings', { initialPromo: p })}
                >
                  🛎️ Đặt phòng có ưu đãi
                </button>
                <button 
                  className="btn btn-ghost btn-sm" 
                  onClick={() => {
                    document.getElementById('ai-chat-toggle-btn')?.click();
                    setTimeout(() => {
                      const inp = document.getElementById('ai-chat-input');
                      if (inp) {
                        inp.value = `Khách sạn có ưu đãi gì cho ${p.roomTypeLabel} (${p.code}) không?`;
                        inp.dispatchEvent(new Event('input', { bubbles: true }));
                      }
                    }, 300);
                  }}
                >
                  💬 Hỏi AI
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Nút Xem thêm / Thu gọn khi danh sách dài */}
      {/* Nút Xem thêm / Thu gọn khi danh sách nhiều hơn 4 thẻ */}
      {!isFiltering && filteredPromos.length > 4 && (
        <div style={{ textAlign: 'center', padding: '6px 24px 18px', borderTop: '1px dashed rgba(2, 132, 199, 0.18)', marginTop: 14 }}>
          <button 
            className="btn btn-ghost"
            style={{
              padding: '8px 26px',
              fontSize: 12.5,
              fontWeight: 700,
              borderRadius: 20,
              background: 'var(--bg-card)',
              border: '1px solid rgba(2, 132, 199, 0.35)',
              color: 'var(--text-primary)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              cursor: 'pointer'
            }}
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? '▲ Thu gọn danh sách (chỉ hiện 4 ưu đãi)' : `▼ Xem thêm ${filteredPromos.length - 4} ưu đãi khác (Tổng ${filteredPromos.length} ưu đãi)`}
          </button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   DASHBOARD
   ════════════════════════════════════════════════════════════════════════════ */
function Dashboard({ token, onNav }) {
  const [rooms,    setRooms]    = useState([]);
  const [guests,   setGuests]   = useState([]);
  const [bookings, setBookings] = useState([]);
  const [thongKe,  setThongKe]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [flash,    setFlash]    = useState(false);
  const [chartMode, setChartMode] = useState('history'); // 'history' | 'forecast'
  const [leavingId, setLeavingId] = useState(null);
  const [checkinModal, setCheckinModal] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [r, g, b, tk] = await Promise.all([
        API('/phong', {}, token),
        API('/khach-hang', {}, token),
        API('/dat-phong', {}, token),
        API('/thong-ke', {}, token),
      ]);
      setRooms(r); setGuests(g); setBookings(b); setThongKe(tk);
    } catch {}
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useRealtime(token, useCallback((ev) => {
    loadAll();
    setFlash(true);
    setTimeout(() => setFlash(false), 2500);
  }, [loadAll]));

  const stats = {
    tongPhong:   rooms.length,
    phongTrong:  rooms.filter(r => r.trangThai === 'trong').length,
    phongDangO:  thongKe?.khachDangO || rooms.filter(r => r.trangThai === 'dang-o').length,
    tongKhach:   guests.length,
    datHomNay:   bookings.filter(b => b.trangThai === 'da-dat' || b.trangThai === 'dang-o').length,
    doanhThu:    thongKe?.doanhThuHomNay || 0,
  };

  const statCards = [
    { icon: '🏠', label: 'Tổng số phòng',      value: stats.tongPhong,  grad: '#6366f1', format: fmtNum, change: { up: true, pct: '+2 phòng' } },
    { icon: '🟢', label: 'Phòng đang trống',   value: stats.phongTrong, grad: '#10b981', format: fmtNum, change: { up: true, pct: `${Math.round((stats.phongTrong/(stats.tongPhong||1))*100)}% sẵn sàng` } },
    { icon: '🛌', label: 'Phòng đang ở',       value: stats.phongDangO, grad: '#f59e0b', format: fmtNum, change: { up: true, pct: `${Math.round((stats.phongDangO/(stats.tongPhong||1))*100)}% công suất` } },
    { icon: '👥', label: 'Tổng khách hàng',    value: stats.tongKhach,  grad: '#ec4899', format: fmtNum, change: { up: true, pct: '+12% tháng' } },
    { icon: '📋', label: 'Đặt phòng hôm nay',  value: stats.datHomNay,  grad: '#06b6d4', format: fmtNum, change: { up: true, pct: 'Hôm nay' } },
    { icon: '💰', label: 'Doanh thu hôm nay',  value: stats.doanhThu,   grad: '#8b5cf6', format: fmt,    change: { up: true, pct: '+8.5%' } },
  ];

  const recentBookings = [...bookings].slice(0, 8);

  // Dữ liệu dự báo doanh thu & công suất lấp phòng AI 7 ngày tới
  const forecastData = [
    { name: 'T2 (Mai)',  doanhThu: 22500000, congSuat: '76%' },
    { name: 'T3 (+2)',   doanhThu: 25000000, congSuat: '80%' },
    { name: 'T4 (+3)',   doanhThu: 29500000, congSuat: '85%' },
    { name: 'T5 (+4)',   doanhThu: 34000000, congSuat: '90%' },
    { name: 'T6 (Đỉnh)', doanhThu: 46800000, congSuat: '96%' },
    { name: 'T7 (Đỉnh)', doanhThu: 49500000, congSuat: '98%' },
    { name: 'CN (+7)',   doanhThu: 36000000, congSuat: '88%' },
  ];

  const defaultHistoryData = [
    { name: '6 ngày trước', doanhThu: 14500000 },
    { name: '5 ngày trước', doanhThu: 18000000 },
    { name: '4 ngày trước', doanhThu: 16500000 },
    { name: '3 ngày trước', doanhThu: 23000000 },
    { name: '2 ngày trước', doanhThu: 28500000 },
    { name: 'Hôm qua',      doanhThu: 31000000 },
    { name: 'Hôm nay',      doanhThu: thongKe?.doanhThuHomNay || 26000000 },
  ];

  const activeChartData = chartMode === 'history'
    ? (thongKe?.chartData && thongKe.chartData.length > 0 ? thongKe.chartData : defaultHistoryData)
    : forecastData;

  const handleOpenCheckin = (booking) => {
    const nights = Math.max(1, Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000));
    const room = rooms.find(r => r.id == booking.phongId) || booking.phong;
    const basePrice = (room?.gia || 0) * nights;
    
    // Tìm ưu đãi mặc định phù hợp nhất với loại phòng
    const defaultPromo = HOTEL_PROMOTIONS.find(p => p.roomType === room?.loai) || HOTEL_PROMOTIONS.find(p => p.roomType === 'all');
    const discount = defaultPromo ? calculateDiscount(defaultPromo, basePrice) : 0;
    
    setCheckinModal({
      booking,
      room,
      nights,
      promoId: defaultPromo?.id || '',
      basePrice,
      discount,
      finalPrice: Math.max(0, basePrice - discount)
    });
  };

  const handlePromoChangeInCheckin = (promoId) => {
    if (!checkinModal) return;
    const promo = HOTEL_PROMOTIONS.find(p => p.id === promoId);
    const discount = promo ? calculateDiscount(promo, checkinModal.basePrice) : 0;
    setCheckinModal(p => ({
      ...p,
      promoId,
      discount,
      finalPrice: Math.max(0, p.basePrice - discount)
    }));
  };

  const handleConfirmCheckin = async () => {
    if (!checkinModal) return;
    const { booking, promoId, discount, finalPrice } = checkinModal;
    const promo = HOTEL_PROMOTIONS.find(p => p.id === promoId);
    const promoNote = promo ? `[Ưu đãi nhận phòng: ${promo.title} - Giảm ${fmt(discount)}] ` : '';
    const cleanGhiChu = (booking.ghiChu || '').replace(/\[Ưu đãi[^\]]*\]\s*/g, '');
    const newGhiChu = (promoNote + cleanGhiChu).trim();
    
    try {
      await API(`/dat-phong/${booking.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          trangThai: 'dang-o',
          tongTien: finalPrice,
          ghiChu: newGhiChu
        })
      }, token);
      
      toast(`✓ Nhận phòng #${checkinModal.room?.soPhong || booking.phongId} thành công! ${discount > 0 ? `Đã trừ ${fmt(discount)} ưu đãi vào tiền phòng.` : ''}`);
      setCheckinModal(null);
      loadAll();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
      {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 96, borderRadius: 18 }} />)}
    </div>
  );

  return (
    <div className="anim-fade">
      {/* Live header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <LiveDot pulse={true} />
          <UpdateFlash show={flash} />
        </div>
        <span style={{ fontSize:12, color:'var(--text-muted)' }}>
          Tự động cập nhật thời gian thực
        </span>
      </div>

      {/* BẢNG GỢI Ý CHIẾN LƯỢC AI */}
      <AiInsightsPanel onNav={onNav} onApplyPricing={() => {}} />

      {/* Stats Cards with CountUp */}
      <div className="stats-grid">
        {statCards.map((s, i) => (
          <div key={i} className={`card stat-card ${flash ? 'stat-flash' : ''}`} style={{ padding: 20 }}>
            <div className="stat-icon" style={{ background: s.grad + '22' }}>
              <span style={{ filter: 'none' }}>{s.icon}</span>
            </div>
            <div className="stat-body">
              <div className="stat-value">
                <CountUp to={s.value} format={s.format} />
              </div>
              <div className="stat-label">{s.label}</div>
              {s.change && <div className={`stat-change ${s.change.up ? 'up' : 'down'}`}>{s.change.up ? '↑' : '↓'} {s.change.pct}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 24 }}>
        <div className="section-header">
          <div><div className="section-title">Thao tác nhanh</div></div>
        </div>
        <div className="quick-actions">
          {[
            { icon: '🛎️', label: 'Đặt phòng mới',  page: 'bookings' },
            { icon: '👤', label: 'Thêm khách',      page: 'guests'   },
            { icon: '🏠', label: 'Quản lý phòng',   page: 'rooms'    },
            { icon: '🤖', label: 'Trợ lý AI',       page: 'ai'       },
          ].map((a, i) => (
            <button key={i} className="quick-action-btn" onClick={() => onNav(a.page)}>
              <span className="qa-icon">{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2">
        {/* Biểu đồ doanh thu & Dự báo */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="section-header" style={{ marginBottom: 16 }}>
            <div>
              <div className="section-title">{chartMode === 'history' ? 'Biểu đồ doanh thu (7 ngày qua)' : '🔮 Dự báo Doanh thu & Lấp phòng (7 ngày tới)'}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className={`chart-mode-pill ${chartMode === 'history' ? 'active' : ''}`} onClick={() => setChartMode('history')}>📊 Thực tế</button>
              <button className={`chart-mode-pill ${chartMode === 'forecast' ? 'active' : ''}`} onClick={() => setChartMode('forecast')}>🔮 Dự báo AI</button>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 260, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {/* Gradient màu Cam rực rỡ cho thực tế */}
                  <linearGradient id="barOrangeHistory" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff8533" stopOpacity={1} />
                    <stop offset="100%" stopColor="#ea580c" stopOpacity={0.92} />
                  </linearGradient>
                  {/* Gradient màu Cam hoàng kim cho dự báo AI */}
                  <linearGradient id="barOrangeForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb923c" stopOpacity={1} />
                    <stop offset="100%" stopColor="#c2410c" stopOpacity={0.95} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(val) => `${val / 1000000}M`} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value, name, item) => [
                    fmt(value) + (item?.payload?.congSuat ? ` · Công suất: ${item.payload.congSuat}` : ''),
                    chartMode === 'history' ? 'Doanh thu thực tế' : 'Dự báo doanh thu (AI)'
                  ]}
                  contentStyle={{ background: 'var(--bg-modal)', border: '1px solid rgba(249,115,22,0.4)', borderRadius: 8, color: 'var(--text-primary)' }} 
                />
                <Bar 
                  dataKey="doanhThu" 
                  fill={chartMode === 'history' ? 'url(#barOrangeHistory)' : 'url(#barOrangeForecast)'} 
                  radius={[6, 6, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {chartMode === 'forecast' && (
            <div className="forecast-insight-box">
              <span className="fi-icon">🔮</span>
              <div>
                <div className="fi-title">
                  <span>Tóm tắt Dự báo Doanh thu & Công suất AI (7 ngày tới):</span>
                </div>
                <div className="fi-desc">
                  Đỉnh điểm doanh thu rơi vào <strong>Thứ 6 & Thứ 7</strong> (~49.5M đ/ngày, công suất lấp phòng đạt <strong>98%</strong>). 
                  Khuyến nghị kích hoạt phụ phí nhận phòng sớm & điều chỉnh giá phòng VIP <strong>+15%</strong> để tối đa hóa doanh thu!
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Đặt phòng gần đây / Tương tác */}
        <div className="card">
          <div className="section-header" style={{ marginBottom: 12 }}>
            <div><div className="section-title">Đặt phòng gần đây</div></div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNav('bookings')}>Xem tất cả →</button>
          </div>
          {recentBookings.length === 0
            ? <div className="no-data">Chưa có đặt phòng nào</div>
            : recentBookings.map(b => (
              <div 
                key={b.id} 
                className={`interactive-booking-item ${leavingId === b.id ? 'slide-out' : ''}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {b.khachHang?.hoTen || `Khách #${b.khachHangId}`}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    Phòng {b.phong?.soPhong || b.phongId} · {fmtDate(b.checkIn)}→{fmtDate(b.checkOut)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookingStatusBadge s={b.trangThai} />
                  {b.trangThai === 'da-dat' && (
                    <button 
                      className="btn btn-primary btn-sm" 
                      style={{ padding: '4px 10px', fontSize: 11, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                      onClick={() => handleOpenCheckin(b)}
                    >
                      🛎️ Nhận phòng & Ưu đãi
                    </button>
                  )}
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Top khách hàng */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="section-header" style={{ marginBottom: 12 }}>
          <div><div className="section-title">Khách hàng nổi bật</div></div>
          <button className="btn btn-ghost btn-sm" onClick={() => onNav('guests')}>Xem tất cả →</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Khách hàng</th><th>Hạng</th><th>Số lần ở</th><th>Tổng chi tiêu</th>
            </tr></thead>
            <tbody>
              {[...guests].sort((a,b) => b.tongChiTieu - a.tongChiTieu).slice(0,5).map(g => (
                <tr key={g.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{g.hoTen}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{g.sdt}</div>
                  </td>
                  <td><GuestRankBadge r={g.hang} /></td>
                  <td>{fmtNum(g.soLanO)} lần</td>
                  <td style={{ fontWeight: 600, color: '#a5b4fc' }}>{fmt(g.tongChiTieu)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NHẬN PHÒNG & ÁP DỤNG ƯU ĐÃI THÔNG MINH */}
      {checkinModal && (
        <Modal 
          title="🛎️ Thủ Tục Nhận Phòng & Áp Dụng Ưu Đãi" 
          onClose={() => setCheckinModal(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setCheckinModal(null)}>Hủy</button>
              <button 
                className="btn btn-primary" 
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                onClick={handleConfirmCheckin}
              >
                ✅ Xác nhận Nhận phòng & Trừ tiền
              </button>
            </>
          }
        >
          <div style={{ padding: '4px 0' }}>
            {/* Thông tin phòng & khách */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Khách hàng</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>{checkinModal.booking?.khachHang?.hoTen || `Khách #${checkinModal.booking?.khachHangId}`}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>SĐT: {checkinModal.booking?.khachHang?.sdt || '—'}</div>
              </div>
              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Phòng nhận</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginTop: 2, color: '#a5b4fc' }}>
                  Phòng #{checkinModal.room?.soPhong || checkinModal.booking?.phongId} ({checkinModal.room?.loai || 'Tiêu chuẩn'})
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {checkinModal.nights} đêm ({fmtDate(checkinModal.booking?.checkIn)} → {fmtDate(checkinModal.booking?.checkOut)})
                </div>
              </div>
            </div>

            {/* Chọn loại ưu đãi */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🎁 Chọn Gói Ưu Đãi Áp Dụng:</span>
                <span style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>Tự động lọc theo loại phòng: {checkinModal.room?.loai || 'Tất cả'}</span>
              </label>
              <select 
                className="form-control" 
                value={checkinModal.promoId} 
                onChange={e => handlePromoChangeInCheckin(e.target.value)}
                style={{ fontSize: 13, borderColor: '#6366f1' }}
              >
                <option value="">-- Không áp dụng ưu đãi --</option>
                {HOTEL_PROMOTIONS.filter(p => p.roomType === 'all' || p.roomType === checkinModal.room?.loai).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.icon} {p.title} ({p.discountType === 'percent' ? `Giảm ${p.discountValue}%` : `Giảm ${fmt(p.discountValue)}`})
                  </option>
                ))}
              </select>
            </div>

            {/* Khung tính tiền trừ ưu đãi chi tiết */}
            <div className="promo-box-highlight">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Giá niêm yết ({checkinModal.nights} đêm):</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{fmt(checkinModal.basePrice)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>🎁</span> Ưu đãi giảm trừ:
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#34d399' }}>
                  {checkinModal.discount > 0 ? `-${fmt(checkinModal.discount)}` : '0 đ'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Số tiền phòng thực thu:</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#fbbf24' }}>
                  {fmt(checkinModal.finalPrice)}
                </span>
              </div>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>⚡</span> Số tiền sau ưu đãi sẽ được cập nhật trực tiếp vào hệ thống và trạng thái phòng chuyển sang "Đang ở".
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PHÒNG PAGE — LƯỚI PHÒNG LẬT VÀO THEO TẦNG (3D FLIP-IN)
   ════════════════════════════════════════════════════════════════════════════ */
function RoomsPage({ token, user }) {
  const isAdmin = user?.role === 'admin';
  const [rooms,    setRooms]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [search,   setSearch]  = useState('');
  const [filter,   setFilter]  = useState('all');
  const [hkFilter, setHkFilter] = useState('all');
  const [viewMode, setViewMode]= useState('grid');
  const [modal,    setModal]   = useState(null);
  const [form,     setForm]    = useState({});
  const [saving,   setSaving]  = useState(false);
  const [delConfirm, setDelConfirm] = useState(null);
  const [flash,    setFlash]   = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await API('/phong', {}, token);
      setRooms(data);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  useRealtime(token, useCallback((ev) => {
    load();
    setFlash(true);
    setTimeout(() => setFlash(false), 2000);
  }, [load]));

  const openAdd  = () => { setForm({ soPhong:'', loai:'Don', tang:1, gia:'', trangThai:'trong', moTa:'' }); setModal({ mode:'add' }); };
  const openEdit = (r) => { setForm({ ...r }); setModal({ mode:'edit', data: r }); };

  const save = async () => {
    try {
      setSaving(true);
      if (modal.mode === 'add') {
        await API('/phong', { method:'POST', body: JSON.stringify(form) }, token);
        toast('Đã thêm phòng thành công!');
      } else {
        await API(`/phong/${modal.data.id}`, { method:'PUT', body: JSON.stringify(form) }, token);
        toast('Đã cập nhật phòng!');
      }
      setModal(null); load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    try {
      await API(`/phong/${id}`, { method:'DELETE' }, token);
      toast('Đã xóa phòng!'); setDelConfirm(null); load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const updateHk = async (id, val) => {
    try {
      await API(`/phong/${id}/don-dep`, { method: 'PUT', body: JSON.stringify({ tinhTrangDonDep: val }) }, token);
      toast('Đã cập nhật trạng thái dọn dẹp!');
      setRooms(prev => prev.map(r => r.id === id ? { ...r, tinhTrangDonDep: val } : r));
    } catch (e) { toast(e.message, 'error'); }
  };

  const filtered = rooms.filter(r => {
    const matchSearch = r.soPhong?.toLowerCase().includes(search.toLowerCase()) ||
                        r.loai?.toLowerCase().includes(search.toLowerCase()) ||
                        r.moTa?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || r.trangThai === filter;
    const matchHk = hkFilter === 'all' || r.tinhTrangDonDep === hkFilter;
    return matchSearch && matchFilter && matchHk;
  });

  // Group by floors for staggered 3D Flip-In
  const floors = [...new Set(filtered.map(r => r.tang || 1))].sort((a,b) => a - b);

  return (
    <div className="anim-fade">
      <div className="toolbar">
        <div className="toolbar-left">
          <LiveDot pulse={true} />
          <UpdateFlash show={flash} />
          <div className="search-bar" style={{ minWidth: 220 }}>
            <span className="search-icon">🔍</span>
            <input placeholder="Tìm số phòng, loại..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="filter-tabs">
            {[['all','Tất cả'],['trong','Trống'],['dang-o','Đang ở'],['don-dep','Dọn dẹp'],['bao-tri','Bảo trì']].map(([v,l]) => (
              <button key={v} className={`filter-tab ${filter===v?'active':''}`} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
          <div className="filter-tabs" style={{ marginLeft: 8 }}>
            {[['all','Tất cả (Dọn)'],['sach','✨ Sạch'],['ban','🧹 Bẩn'],['dang-don','🧼 Đang dọn']].map(([v,l]) => (
              <button key={v} className={`filter-tab ${hkFilter===v?'active':''}`} onClick={() => setHkFilter(v)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-ghost btn-icon" onClick={() => setViewMode(m => m==='grid'?'table':'grid')} title="Đổi hiển thị">
            {viewMode === 'grid' ? '📋' : '⊞'}
          </button>
          {isAdmin && (
            <button className="btn btn-primary" onClick={openAdd}>+ Thêm phòng</button>
          )}
        </div>
      </div>

      {/* Summary badges */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {[['trong','Trống','badge-green'],['dang-o','Đang ở','badge-blue'],['don-dep','Dọn dẹp','badge-amber'],['bao-tri','Bảo trì','badge-rose']].map(([k,l,c]) => (
          <span key={k} className={`badge ${c}`}>{l}: {rooms.filter(r=>r.trangThai===k).length}</span>
        ))}
      </div>

      {loading ? (
        <div className="room-grid">{[...Array(8)].map((_,i)=><div key={i} className="skeleton" style={{height:140,borderRadius:18}} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-icon">🏠</div><h3>Không tìm thấy phòng</h3><p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p></div></div>
      ) : viewMode === 'grid' ? (
        <div className="floor-group-container">
          {floors.map((floorNum, fIdx) => {
            const floorRooms = filtered.filter(r => (r.tang || 1) === floorNum);
            return (
              <div key={floorNum} className="floor-section" style={{ animationDelay: `${fIdx * 80}ms` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🏢 Tầng {floorNum}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({floorRooms.length} phòng)</span>
                </div>
                <div className="room-grid">
                  {floorRooms.map((r, rIdx) => (
                    <div 
                      key={r.id} 
                      className={`room-card room-card-3d ${r.trangThai}`}
                      style={{ animationDelay: `${fIdx * 80 + rIdx * 30}ms` }}
                    >
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <div>
                          <div className="room-number">#{r.soPhong}</div>
                          <div className="room-type">{r.loai} · Tầng {r.tang}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                          <RoomStatusBadge s={r.trangThai} />
                          <select 
                            className="form-control" 
                            style={{ padding: '2px 6px', fontSize: 11, height: 'auto', width: 'auto', minWidth: 90, textAlign: 'center' }}
                            value={r.tinhTrangDonDep || 'sach'}
                            onChange={(e) => updateHk(r.id, e.target.value)}
                          >
                            <option value="sach">✨ Sạch</option>
                            <option value="ban">🧹 Bẩn</option>
                            <option value="dang-don">🧼 Đang dọn</option>
                          </select>
                        </div>
                      </div>
                      <div className="room-price">{fmt(r.gia)}/đêm</div>
                      {r.moTa && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:6, lineHeight:1.4 }}>{r.moTa.slice(0,50)}{r.moTa.length>50?'...':''}</div>}
                      <div style={{ display:'flex', gap:6, marginTop:12 }}>
                        {isAdmin && (
                          <>
                            <button className="btn btn-ghost btn-sm" style={{flex:1}} onClick={() => openEdit(r)}>✏️ Sửa</button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDelConfirm(r)}>🗑️</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding:0 }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Số phòng</th><th>Loại</th><th>Tầng</th><th>Giá/đêm</th><th>Trạng thái</th><th>Housekeeping</th><th>Mô tả</th><th>Thao tác</th></tr></thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td><strong style={{fontSize:15}}>#{r.soPhong}</strong></td>
                    <td><RoomTypeBadge t={r.loai} /></td>
                    <td>Tầng {r.tang}</td>
                    <td style={{fontWeight:600,color:'#a5b4fc'}}>{fmt(r.gia)}</td>
                    <td><RoomStatusBadge s={r.trangThai} /></td>
                    <td>
                      <select 
                        className="form-control" 
                        style={{ padding: '4px 8px', fontSize: 12, height: 'auto', width: 'auto', minWidth: 100 }}
                        value={r.tinhTrangDonDep || 'sach'}
                        onChange={(e) => updateHk(r.id, e.target.value)}
                      >
                        <option value="sach">✨ Sạch</option>
                        <option value="ban">🧹 Bẩn</option>
                        <option value="dang-don">🧼 Đang dọn</option>
                      </select>
                    </td>
                    <td style={{maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--text-secondary)',fontSize:12}}>{r.moTa||'—'}</td>
                    <td>
                      <div style={{display:'flex',gap:6}}>
                        {isAdmin && (
                          <>
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(r)} title="Sửa">✏️</button>
                            <button className="btn btn-danger btn-sm btn-icon" onClick={() => setDelConfirm(r)} title="Xóa">🗑️</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <Modal title={modal.mode==='add'?'➕ Thêm phòng mới':'✏️ Chỉnh sửa phòng'} onClose={() => setModal(null)}
          footer={<><button className="btn btn-ghost" onClick={() => setModal(null)}>Hủy</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Đang lưu...':'💾 Lưu'}</button></>}
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Số phòng *</label>
              <input className="form-control" placeholder="VD: 101" value={form.soPhong||''} onChange={e => setForm(p=>({...p,soPhong:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Loại phòng *</label>
              <select className="form-control" value={form.loai||'Don'} onChange={e => setForm(p=>({...p,loai:e.target.value}))}>
                {['Don','Doi','VIP','Suite'].map(t => <option key={t} value={t}>{t === 'Don' ? 'Đơn' : t === 'Doi' ? 'Đôi' : t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tầng</label>
              <input className="form-control" type="number" min="1" value={form.tang||1} onChange={e => setForm(p=>({...p,tang:parseInt(e.target.value)}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Giá/đêm (VNĐ) *</label>
              <input className="form-control" type="number" placeholder="600000" value={form.gia||''} onChange={e => setForm(p=>({...p,gia:e.target.value}))} />
            </div>
            <div className="form-group" style={{ gridColumn:'1/-1' }}>
              <label className="form-label">Trạng thái</label>
              <select className="form-control" value={form.trangThai||'trong'} onChange={e => setForm(p=>({...p,trangThai:e.target.value}))}>
                <option value="trong">Trống</option>
                <option value="dang-o">Đang có khách</option>
                <option value="don-dep">Đang dọn dẹp</option>
                <option value="bao-tri">Bảo trì</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn:'1/-1' }}>
              <label className="form-label">Mô tả</label>
              <textarea className="form-control" rows={3} placeholder="Mô tả tiện nghi, view..." value={form.moTa||''} onChange={e => setForm(p=>({...p,moTa:e.target.value}))} style={{ resize:'vertical' }} />
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {delConfirm && (
        <Modal title="🗑️ Xác nhận xóa" onClose={() => setDelConfirm(null)}
          footer={<><button className="btn btn-ghost" onClick={() => setDelConfirm(null)}>Hủy</button><button className="btn btn-danger" onClick={() => del(delConfirm.id)}>Xóa phòng</button></>}
        >
          <p style={{ color:'var(--text-secondary)', fontSize:14 }}>Bạn có chắc muốn xóa <strong style={{color:'var(--text-primary)'}}>Phòng #{delConfirm.soPhong}</strong> không? Hành động này không thể hoàn tác.</p>
        </Modal>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   KHÁCH HÀNG PAGE
   ════════════════════════════════════════════════════════════════════════════ */
function GuestsPage({ token, user }) {
  const isAdmin = user?.role === 'admin';
  const [guests,  setGuests]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState({});
  const [saving,  setSaving]  = useState(false);
  const [delConfirm, setDelConfirm] = useState(null);
  const [page, setPage] = useState(1); const PER = 10;

  const load = useCallback(async () => {
    try { setLoading(true); setGuests(await API('/khach-hang', {}, token)); }
    catch (e) { toast(e.message,'error'); } finally { setLoading(false); }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm({ hoTen:'', sdt:'', email:'', cmnd:'', quocTich:'Viet Nam', hang:'Moi', ghiChu:'' }); setModal({ mode:'add' }); };
  const openEdit = (g) => { setForm({...g}); setModal({ mode:'edit', data:g }); };

  const save = async () => {
    try {
      setSaving(true);
      if (modal.mode === 'add') {
        await API('/khach-hang', { method:'POST', body:JSON.stringify(form) }, token);
        toast('Đã thêm khách hàng!');
      } else {
        await API(`/khach-hang/${modal.data.id}`, { method:'PUT', body:JSON.stringify(form) }, token);
        toast('Đã cập nhật khách hàng!');
      }
      setModal(null); load();
    } catch(e) { toast(e.message,'error'); } finally { setSaving(false); }
  };

  const del = async id => {
    try { await API(`/khach-hang/${id}`,{method:'DELETE'},token); toast('Đã xóa!'); setDelConfirm(null); load(); }
    catch(e) { toast(e.message,'error'); }
  };

  const filtered = guests.filter(g => {
    const q = search.toLowerCase();
    const match = g.hoTen?.toLowerCase().includes(q) || g.sdt?.includes(q) || g.email?.toLowerCase().includes(q) || g.cmnd?.includes(q);
    const f = filter === 'all' || g.hang === filter;
    return match && f;
  });

  const paged = filtered.slice((page-1)*PER, page*PER);
  const totalPages = Math.max(1, Math.ceil(filtered.length/PER));

  return (
    <div className="anim-fade">
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-bar" style={{ minWidth:240 }}>
            <span className="search-icon">🔍</span>
            <input placeholder="Tên, SĐT, email, CMND..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="filter-tabs">
            {[['all','Tất cả'],['Moi','Mới'],['Bac','Bạc'],['Vang','Vàng'],['Kim cuong','Kim Cương']].map(([v,l]) => (
              <button key={v} className={`filter-tab ${filter===v?'active':''}`} onClick={() => { setFilter(v); setPage(1); }}>{l}</button>
            ))}
          </div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAdd}>+ Thêm khách</button>
        )}
      </div>

      <div className="card" style={{ padding:0 }}>
        {loading ? (
          <div style={{padding:32}}>{[...Array(5)].map((_,i) => <div key={i} className="skeleton" style={{height:52,borderRadius:8,marginBottom:8}} />)}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">👤</div><h3>Không tìm thấy khách hàng</h3><p>Thử thay đổi từ khóa tìm kiếm</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Khách hàng</th><th>Liên hệ</th><th>CMND</th><th>Quốc tịch</th><th>Hạng</th><th>Số lần ở</th><th>Chi tiêu</th><th>Thao tác</th></tr></thead>
              <tbody>
                {paged.map((g,i) => (
                  <tr key={g.id}>
                    <td style={{color:'var(--text-muted)',fontSize:12}}>{(page-1)*PER+i+1}</td>
                    <td>
                      <div style={{fontWeight:600}}>{g.hoTen}</div>
                      {g.ghiChu && <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>{g.ghiChu.slice(0,40)}{g.ghiChu.length>40?'...':''}</div>}
                    </td>
                    <td>
                      <div style={{fontSize:13}}>{g.sdt}</div>
                      <div style={{fontSize:11,color:'var(--text-muted)'}}>{g.email||'—'}</div>
                    </td>
                    <td style={{fontSize:12,color:'var(--text-secondary)'}}>{g.cmnd||'—'}</td>
                    <td style={{fontSize:12}}>{g.quocTich}</td>
                    <td><GuestRankBadge r={g.hang} /></td>
                    <td>{fmtNum(g.soLanO)}</td>
                    <td style={{fontWeight:600,color:'#a5b4fc'}}>{fmt(g.tongChiTieu)}</td>
                    <td>
                      <div style={{display:'flex',gap:6}}>
                        {isAdmin && (
                          <>
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(g)} title="Sửa">✏️</button>
                            <button className="btn btn-danger btn-sm btn-icon" onClick={() => setDelConfirm(g)} title="Xóa">🗑️</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}>‹</button>
            {[...Array(totalPages)].map((_,i) => (
              <button key={i} className={`page-btn ${page===i+1?'active':''}`} onClick={() => setPage(i+1)}>{i+1}</button>
            ))}
            <button className="page-btn" onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}>›</button>
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal.mode==='add'?'➕ Thêm khách hàng':'✏️ Chỉnh sửa khách hàng'} onClose={() => setModal(null)} wide
          footer={<><button className="btn btn-ghost" onClick={() => setModal(null)}>Hủy</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Đang lưu...':'💾 Lưu'}</button></>}
        >
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Họ tên *</label><input className="form-control" placeholder="Nguyễn Văn A" value={form.hoTen||''} onChange={e=>setForm(p=>({...p,hoTen:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">Số điện thoại *</label><input className="form-control" placeholder="0912345678" value={form.sdt||''} onChange={e=>setForm(p=>({...p,sdt:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" placeholder="email@example.com" value={form.email||''} onChange={e=>setForm(p=>({...p,email:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">CMND / Hộ chiếu</label><input className="form-control" placeholder="079100001234" value={form.cmnd||''} onChange={e=>setForm(p=>({...p,cmnd:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">Quốc tịch</label><input className="form-control" placeholder="Viet Nam" value={form.quocTich||''} onChange={e=>setForm(p=>({...p,quocTich:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">Hạng thành viên</label>
              <select className="form-control" value={form.hang||'Moi'} onChange={e=>setForm(p=>({...p,hang:e.target.value}))}>
                <option value="Moi">Mới</option><option value="Bac">Bạc</option><option value="Vang">Vàng</option><option value="Kim cuong">Kim Cương</option>
              </select>
            </div>
            <div className="form-group" style={{gridColumn:'1/-1'}}><label className="form-label">Ghi chú</label><textarea className="form-control" rows={2} placeholder="Sở thích, yêu cầu đặc biệt..." value={form.ghiChu||''} onChange={e=>setForm(p=>({...p,ghiChu:e.target.value}))} style={{resize:'vertical'}} /></div>
          </div>
        </Modal>
      )}

      {delConfirm && (
        <Modal title="🗑️ Xác nhận xóa" onClose={() => setDelConfirm(null)}
          footer={<><button className="btn btn-ghost" onClick={() => setDelConfirm(null)}>Hủy</button><button className="btn btn-danger" onClick={() => del(delConfirm.id)}>Xóa khách</button></>}
        >
          <p style={{color:'var(--text-secondary)',fontSize:14}}>Bạn có chắc muốn xóa khách hàng <strong style={{color:'var(--text-primary)'}}>{delConfirm.hoTen}</strong>?</p>
        </Modal>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   ĐẶT PHÒNG PAGE
   ════════════════════════════════════════════════════════════════════════════ */
function BookingsPage({ token, navState, clearNavState }) {
  const [bookings, setBookings] = useState([]);
  const [rooms,    setRooms]    = useState([]);
  const [guests,   setGuests]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');
  const [modal,    setModal]    = useState(null);
  const [form,     setForm]     = useState({});
  const [saving,   setSaving]   = useState(false);
  const [page, setPage] = useState(1); const PER = 10;
  const [flash,    setFlash]    = useState(false);
  const [lastEvent, setLastEvent] = useState(null); // lưu event gần nhất để hiển thị
  const [paymentModal, setPaymentModal] = useState(null);
  const [invoice, setInvoice]   = useState(null);
  const [payMethod, setPayMethod] = useState('cash'); // 'cash' or 'transfer'
  const [checkinModal, setCheckinModal] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [b,r,g] = await Promise.all([
        API('/dat-phong', {}, token),
        API('/phong', {}, token),
        API('/khach-hang', {}, token),
      ]);
      setBookings(b); setRooms(r); setGuests(g);
    } catch(e) { toast(e.message,'error'); } finally { setLoading(false); }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  // Nhận navState từ Gợi ý chiến lược AI
  useEffect(() => {
    if (navState?.initialPromo && rooms.length > 0) {
      const promo = navState.initialPromo;
      const today = new Date().toISOString().split('T')[0];
      const tom = new Date(); tom.setDate(tom.getDate() + 1);
      // Tìm phòng trống phù hợp với loại phòng của ưu đãi
      const matchedRoom = rooms.find(r => r.trangThai === 'trong' && (promo.roomType === 'all' || r.loai === promo.roomType)) || rooms.find(r => r.trangThai === 'trong');
      
      const base = matchedRoom ? matchedRoom.gia : 0;
      const disc = promo ? calculateDiscount(promo, base) : 0;
      
      setForm({
        khachHangId: '',
        phongId: matchedRoom ? matchedRoom.id : '',
        checkIn: today,
        checkOut: tom.toISOString().split('T')[0],
        trangThai: 'da-dat',
        uuDaiId: promo.id,
        ghiChu: `[Ưu đãi AI: ${promo.title}] `,
        tongTien: Math.max(0, base - disc)
      });
      setModal({ mode: 'add' });
      if (clearNavState) clearNavState();
    }
  }, [navState, rooms, clearNavState]);

  // ─── SSE: cập nhật realtime khi check-in/check-out ───────────────
  useRealtime(token, useCallback((ev) => {
    load();
    setFlash(true);
    setLastEvent(ev);
    setTimeout(() => { setFlash(false); setLastEvent(null); }, 3000);
    // Bắn event ra window để Trợ lý AI và các component khác cập nhật realtime
    window.dispatchEvent(new CustomEvent('booking_realtime_update', { detail: ev }));
    // Toast thông báo theo loại action
    if (ev.type === 'booking_update') {
      const actionLabel = { create:'📋 Đặt phòng mới', update:'🔄 Cập nhật đặt phòng', delete:'🗑️ Hủy đặt phòng' };
      toast(actionLabel[ev.action] || '🔄 Dữ liệu đặt phòng cập nhật', 'info');
    }
  }, [load]));

  const openAdd  = () => {
    const today = new Date().toISOString().split('T')[0];
    const tom = new Date(); tom.setDate(tom.getDate()+1);
    setForm({ khachHangId:'', phongId:'', checkIn:today, checkOut:tom.toISOString().split('T')[0], trangThai:'da-dat', uuDaiId:'', ghiChu:'', tongTien:0 });
    setModal({ mode:'add' });
  };
  const openEdit = (b) => { setForm({ ...b, khachHangId: b.khachHangId, phongId: b.phongId, uuDaiId: b.uuDaiId || '' }); setModal({ mode:'edit', data:b }); };

  // Auto tính tiền có trừ ưu đãi khi thay đổi phòng, ngày ở hoặc ưu đãi
  useEffect(() => {
    if (!form.phongId || !form.checkIn || !form.checkOut) return;
    const room = rooms.find(r => r.id == form.phongId);
    if (!room) return;
    const nights = Math.max(1, Math.ceil((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000));
    const basePrice = room.gia * nights;
    const promo = HOTEL_PROMOTIONS.find(p => p.id === form.uuDaiId);
    const discount = promo ? calculateDiscount(promo, basePrice) : 0;
    setForm(p => ({ ...p, tongTien: Math.max(0, basePrice - discount) }));
  }, [form.phongId, form.checkIn, form.checkOut, form.uuDaiId, rooms]);

  const handleOpenCheckin = (booking) => {
    const nights = Math.max(1, Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000));
    const room = rooms.find(r => r.id == booking.phongId) || booking.phong;
    const basePrice = (room?.gia || 0) * nights;
    
    // Tìm ưu đãi mặc định phù hợp nhất với loại phòng
    const defaultPromo = HOTEL_PROMOTIONS.find(p => p.roomType === room?.loai) || HOTEL_PROMOTIONS.find(p => p.roomType === 'all');
    const discount = defaultPromo ? calculateDiscount(defaultPromo, basePrice) : 0;
    
    setCheckinModal({
      booking,
      room,
      nights,
      promoId: defaultPromo?.id || '',
      basePrice,
      discount,
      finalPrice: Math.max(0, basePrice - discount)
    });
  };

  const handlePromoChangeInCheckin = (promoId) => {
    if (!checkinModal) return;
    const promo = HOTEL_PROMOTIONS.find(p => p.id === promoId);
    const discount = promo ? calculateDiscount(promo, checkinModal.basePrice) : 0;
    setCheckinModal(p => ({
      ...p,
      promoId,
      discount,
      finalPrice: Math.max(0, p.basePrice - discount)
    }));
  };

  const handleConfirmCheckin = async () => {
    if (!checkinModal) return;
    const { booking, promoId, discount, finalPrice } = checkinModal;
    const promo = HOTEL_PROMOTIONS.find(p => p.id === promoId);
    const promoNote = promo ? `[Ưu đãi nhận phòng: ${promo.title} - Giảm ${fmt(discount)}] ` : '';
    const cleanGhiChu = (booking.ghiChu || '').replace(/\[Ưu đãi[^\]]*\]\s*/g, '');
    const newGhiChu = (promoNote + cleanGhiChu).trim();
    
    try {
      await API(`/dat-phong/${booking.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          trangThai: 'dang-o',
          tongTien: finalPrice,
          ghiChu: newGhiChu
        })
      }, token);
      
      toast(`✓ Nhận phòng #${checkinModal.room?.soPhong || booking.phongId} thành công! ${discount > 0 ? `Đã trừ ${fmt(discount)} ưu đãi vào tiền phòng.` : ''}`);
      setCheckinModal(null);
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const save = async () => {
    try {
      setSaving(true);
      const promo = HOTEL_PROMOTIONS.find(p => p.id === form.uuDaiId);
      let payloadGhiChu = form.ghiChu || '';
      if (promo && !payloadGhiChu.includes(promo.title)) {
        payloadGhiChu = `[Ưu đãi: ${promo.title}] ${payloadGhiChu}`.trim();
      }

      const payload = {
        ...form,
        ghiChu: payloadGhiChu
      };

      if (modal.mode === 'add') {
        await API('/dat-phong', { method:'POST', body:JSON.stringify(payload) }, token);
        toast('Đã tạo đặt phòng và áp dụng ưu đãi!');
      } else {
        await API(`/dat-phong/${modal.data.id}`, { method:'PUT', body:JSON.stringify(payload) }, token);
        toast('Đã cập nhật đặt phòng!');
      }
      setModal(null); load();
    } catch(e) { toast(e.message,'error'); } finally { setSaving(false); }
  };

  const del = async id => {
    try { await API(`/dat-phong/${id}`,{method:'DELETE'},token); toast('Đã xóa đặt phòng!'); load(); }
    catch(e) { toast(e.message,'error'); }
  };

  const handlePayment = async () => {
    try {
      setSaving(true);
      await API(`/dat-phong/${paymentModal.id}`, { method: 'PUT', body: JSON.stringify({ trangThai: 'da-tra' }) }, token);
      toast('Đã ghi nhận thanh toán!');
      const paidBooking = paymentModal;
      setPaymentModal(null);
      setInvoice(paidBooking); // Show invoice after payment
      load();
    } catch(e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handlePrintOnly = () => {
    window.print();
    setInvoice(null);
  };

  const filtered = bookings.filter(b => {
    const kh = b.khachHang?.hoTen || '';
    const ph = b.phong?.soPhong || '';
    const q  = search.toLowerCase();
    return (kh.toLowerCase().includes(q) || ph.includes(q)) && (filter==='all' || b.trangThai===filter);
  });
  const paged = filtered.slice((page-1)*PER, page*PER);
  const totalPages = Math.max(1, Math.ceil(filtered.length/PER));

  const selectedRoom = rooms.find(r => r.id == form.phongId);
  const activePromo = HOTEL_PROMOTIONS.find(p => p.id === form.uuDaiId);
  const nightsCount = form.checkIn && form.checkOut ? Math.max(1, Math.ceil((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000)) : 1;
  const baseRoomTotal = selectedRoom ? selectedRoom.gia * nightsCount : 0;
  const calcPromoDiscount = activePromo ? calculateDiscount(activePromo, baseRoomTotal) : 0;

  return (
    <div className="anim-fade">
      <div className="toolbar">
        <div className="toolbar-left">
          <LiveDot pulse={true} />
          <UpdateFlash show={flash} />
          <div className="search-bar" style={{ minWidth:220 }}>
            <span className="search-icon">🔍</span>
            <input placeholder="Tên khách, số phòng..." value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="filter-tabs">
            {[['all','Tất cả'],['da-dat','Đã đặt'],['dang-o','Đang ở'],['da-tra','Đã trả'],['huy','Đã hủy']].map(([v,l]) => (
              <button key={v} className={`filter-tab ${filter===v?'active':''}`} onClick={() => { setFilter(v); setPage(1); }}>{l}</button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Đặt phòng mới</button>
      </div>

      <div className="card" style={{ padding:0 }}>
        {loading ? (
          <div style={{padding:32}}>{[...Array(5)].map((_,i) => <div key={i} className="skeleton" style={{height:52,borderRadius:8,marginBottom:8}} />)}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📋</div><h3>Không có đặt phòng</h3><p>Nhấn "Đặt phòng mới" để bắt đầu</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Mã ĐP</th><th>Khách hàng</th><th>Phòng</th><th>Check-in</th><th>Check-out</th><th>Tổng tiền</th><th>Trạng thái</th><th>Ghi chú / Ưu đãi</th><th>Thao tác</th></tr></thead>
              <tbody>
                {paged.map((b,i) => (
                  <tr key={b.id}>
                    <td>
                      <div style={{fontWeight:700,color:'#818cf8',fontSize:13}}>#{b.id}</div>
                      <div style={{fontSize:10,color:'var(--text-muted)'}}>STT: {(page-1)*PER+i+1}</div>
                    </td>
                    <td>
                      <div style={{fontWeight:600,display:'flex',alignItems:'center',gap:6}}>
                        <span>{b.khachHang?.hoTen || `Khách #${b.khachHangId}`}</span>
                        <span style={{fontSize:10,padding:'1px 5px',borderRadius:4,background:'rgba(99,102,241,0.15)',color:'#a5b4fc',border:'1px solid rgba(99,102,241,0.3)'}}>
                          ID: {b.khachHangId}
                        </span>
                      </div>
                      <div style={{fontSize:11,color:'var(--text-muted)'}}>{b.khachHang?.sdt||''}</div>
                    </td>
                    <td>
                      <div style={{fontWeight:600}}>#{b.phong?.soPhong || b.phongId}</div>
                      <div style={{fontSize:11,color:'var(--text-muted)'}}>{b.phong?.loai||''}</div>
                    </td>
                    <td style={{fontSize:13}}>{fmtDate(b.checkIn)}</td>
                    <td style={{fontSize:13}}>{fmtDate(b.checkOut)}</td>
                    <td style={{fontWeight:700,color:'#a5b4fc'}}>{fmt(b.tongTien)}</td>
                    <td><BookingStatusBadge s={b.trangThai} /></td>
                    <td style={{maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:12,color:'var(--text-secondary)'}}>
                      {b.ghiChu?.includes('Ưu đãi') ? (
                        <span className="badge badge-amber" style={{ fontSize: 11, padding: '2px 6px' }}>{b.ghiChu}</span>
                      ) : (b.ghiChu || '—')}
                    </td>
                    <td>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                        {b.trangThai === 'da-dat' && (
                          <button 
                            className="btn btn-primary btn-sm" 
                            style={{ padding: '4px 8px', fontSize: 11, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                            onClick={() => handleOpenCheckin(b)}
                            title="Nhận phòng & Áp dụng ưu đãi"
                          >
                            🛎️ Nhận phòng
                          </button>
                        )}
                        {b.trangThai === 'dang-o' && (
                          <>
                            <button className="btn btn-primary btn-sm" onClick={() => { setPaymentModal(b); setPayMethod('cash'); }} title="Thanh toán & Trả phòng">Thanh toán</button>
                            <button 
                              className="btn btn-sm" 
                              style={{
                                padding: '4px 8px', fontSize: 11,
                                background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
                                color: '#fff', border: 'none', borderRadius: 6,
                                fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                                cursor: 'pointer'
                              }}
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('open_tro_ly_ai', {
                                  detail: {
                                    mode: 'personal',
                                    customerId: String(b.khachHangId),
                                    roomNumber: String(b.phong?.soPhong || '')
                                  }
                                }));
                              }}
                              title="Mở Trợ lý AI hỏi đáp dịch vụ cho khách phòng này"
                            >
                              🤖 Chat AI
                            </button>
                          </>
                        )}
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(b)} title="Sửa">✏️</button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => del(b.id)} title="Xóa">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}>‹</button>
            {[...Array(Math.min(totalPages,7))].map((_,i) => (
              <button key={i} className={`page-btn ${page===i+1?'active':''}`} onClick={() => setPage(i+1)}>{i+1}</button>
            ))}
            <button className="page-btn" onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}>›</button>
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal.mode==='add'?'🛎️ Tạo đặt phòng có Ưu đãi':'✏️ Chỉnh sửa đặt phòng'} onClose={() => setModal(null)} wide
          footer={<><button className="btn btn-ghost" onClick={() => setModal(null)}>Hủy</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Đang lưu...':'💾 Lưu đặt phòng'}</button></>}
        >
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Khách hàng *</label>
              <select className="form-control" value={form.khachHangId||''} onChange={e=>setForm(p=>({...p,khachHangId:e.target.value}))}>
                <option value="">-- Chọn khách hàng --</option>
                {guests.map(g => <option key={g.id} value={g.id}>{g.hoTen} ({g.sdt})</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Phòng *</label>
              <select className="form-control" value={form.phongId||''} onChange={e=>setForm(p=>({...p,phongId:e.target.value}))}>
                <option value="">-- Chọn phòng --</option>
                {rooms.filter(r => r.trangThai === 'trong' || r.id == form.phongId).map(r => (
                  <option key={r.id} value={r.id}>#{r.soPhong} - {r.loai} ({fmt(r.gia)}/đêm)</option>
                ))}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Check-in *</label><input className="form-control" type="date" value={form.checkIn||''} onChange={e=>setForm(p=>({...p,checkIn:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">Check-out *</label><input className="form-control" type="date" value={form.checkOut||''} onChange={e=>setForm(p=>({...p,checkOut:e.target.value}))} /></div>
            
            {/* GÓI ƯU ĐÃI THÔNG MINH */}
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🎁 Gói Ưu Đãi Áp Dụng:</span>
                {selectedRoom && <span style={{ fontSize: 11, color: '#34d399' }}>Gợi ý cho {selectedRoom.loai}</span>}
              </label>
              <select 
                className="form-control" 
                value={form.uuDaiId||''} 
                onChange={e => setForm(p => ({ ...p, uuDaiId: e.target.value }))}
                style={{ borderColor: form.uuDaiId ? '#10b981' : undefined }}
              >
                <option value="">-- Không áp dụng ưu đãi --</option>
                {HOTEL_PROMOTIONS.filter(p => !selectedRoom || p.roomType === 'all' || p.roomType === selectedRoom.loai).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.icon} {p.title} ({p.discountType === 'percent' ? `Giảm ${p.discountValue}%` : `Giảm ${fmt(p.discountValue)}`})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group"><label className="form-label">Trạng thái</label>
              <select className="form-control" value={form.trangThai||'da-dat'} onChange={e=>setForm(p=>({...p,trangThai:e.target.value}))}>
                <option value="da-dat">Đã đặt</option><option value="dang-o">Đang ở</option><option value="da-tra">Đã trả phòng</option><option value="huy">Hủy</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tổng tiền thanh toán (VNĐ)</label>
              <input className="form-control" type="number" value={form.tongTien||0} onChange={e=>setForm(p=>({...p,tongTien:e.target.value}))} />
            </div>
            <div className="form-group" style={{gridColumn:'1/-1'}}><label className="form-label">Ghi chú</label><textarea className="form-control" rows={2} placeholder="Yêu cầu đặc biệt..." value={form.ghiChu||''} onChange={e=>setForm(p=>({...p,ghiChu:e.target.value}))} style={{resize:'vertical'}} /></div>
          </div>
          {selectedRoom && (
            <div className="promo-box-highlight" style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span>Giá niêm yết (#{selectedRoom.soPhong} · {nightsCount} đêm):</span>
                <span>{fmt(baseRoomTotal)}</span>
              </div>
              {calcPromoDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#34d399', marginBottom: 6 }}>
                  <span>🎁 Ưu đãi ({activePromo?.code}):</span>
                  <span>-{fmt(calcPromoDiscount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <span>Thực thu sau ưu đãi:</span>
                <span style={{ color: '#fbbf24' }}>{fmt(form.tongTien)}</span>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* CHECKIN MODAL TRONG BOOKINGS PAGE */}
      {checkinModal && (
        <Modal 
          title="🛎️ Thủ Tục Nhận Phòng & Áp Dụng Ưu Đãi" 
          onClose={() => setCheckinModal(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setCheckinModal(null)}>Hủy</button>
              <button 
                className="btn btn-primary" 
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                onClick={handleConfirmCheckin}
              >
                ✅ Xác nhận Nhận phòng & Trừ tiền
              </button>
            </>
          }
        >
          <div style={{ padding: '4px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Khách hàng</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>{checkinModal.booking?.khachHang?.hoTen || `Khách #${checkinModal.booking?.khachHangId}`}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>SĐT: {checkinModal.booking?.khachHang?.sdt || '—'}</div>
              </div>
              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Phòng nhận</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginTop: 2, color: '#a5b4fc' }}>
                  Phòng #{checkinModal.room?.soPhong || checkinModal.booking?.phongId} ({checkinModal.room?.loai || 'Tiêu chuẩn'})
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {checkinModal.nights} đêm ({fmtDate(checkinModal.booking?.checkIn)} → {fmtDate(checkinModal.booking?.checkOut)})
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🎁 Chọn Gói Ưu Đãi Áp Dụng:</span>
                <span style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>Tự động lọc theo: {checkinModal.room?.loai || 'Tất cả'}</span>
              </label>
              <select 
                className="form-control" 
                value={checkinModal.promoId} 
                onChange={e => handlePromoChangeInCheckin(e.target.value)}
                style={{ fontSize: 13, borderColor: '#6366f1' }}
              >
                <option value="">-- Không áp dụng ưu đãi --</option>
                {HOTEL_PROMOTIONS.filter(p => p.roomType === 'all' || p.roomType === checkinModal.room?.loai).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.icon} {p.title} ({p.discountType === 'percent' ? `Giảm ${p.discountValue}%` : `Giảm ${fmt(p.discountValue)}`})
                  </option>
                ))}
              </select>
            </div>

            <div className="promo-box-highlight">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Giá niêm yết ({checkinModal.nights} đêm):</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{fmt(checkinModal.basePrice)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>🎁</span> Ưu đãi giảm trừ:
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#34d399' }}>
                  {checkinModal.discount > 0 ? `-${fmt(checkinModal.discount)}` : '0 đ'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Số tiền phòng thực thu:</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#fbbf24' }}>
                  {fmt(checkinModal.finalPrice)}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* PAYMENT MODAL */}
      {paymentModal && (
        <Modal title="💳 Thanh toán & Trả phòng" onClose={() => setPaymentModal(null)}
          footer={<><button className="btn btn-ghost" onClick={() => setPaymentModal(null)}>Hủy</button><button className="btn btn-primary" onClick={handlePayment} disabled={saving}>{saving?'Đang xử lý...':'✅ Xác nhận thanh toán'}</button></>}
        >
          <div style={{ padding: '8px 0' }}>
            <div style={{ fontSize: 16, marginBottom: 16 }}>
              Khách hàng: <b>{paymentModal.khachHang?.hoTen}</b><br/>
              Phòng: <b>#{paymentModal.phong?.soPhong}</b><br/>
              Tổng tiền cần thanh toán: <b style={{ color: 'var(--primary-color)', fontSize: 20 }}>{fmt(paymentModal.tongTien)}</b>
            </div>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Phương thức thanh toán:</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: payMethod === 'transfer' ? 16 : 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="radio" name="payMethod" checked={payMethod === 'cash'} onChange={() => setPayMethod('cash')} />
                💵 Tiền mặt
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="radio" name="payMethod" checked={payMethod === 'transfer'} onChange={() => setPayMethod('transfer')} />
                💳 Chuyển khoản (VNPay, Momo)
              </label>
            </div>
            {payMethod === 'transfer' && (
              <div style={{ textAlign: 'center', background: 'var(--bg-card)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                <img src="/qr.jpg" alt="QR Code" style={{ maxWidth: '100%', height: 280, objectFit: 'contain', borderRadius: 8 }} />
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>Quét mã trên bằng ứng dụng ngân hàng hoặc Momo để thanh toán <b>{fmt(paymentModal.tongTien)}</b></div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* INVOICE MODAL */}
      {invoice && (
        <Modal title="🧾 Hóa đơn thanh toán" onClose={() => setInvoice(null)}
          footer={<><button className="btn btn-ghost" onClick={() => setInvoice(null)}>Đóng</button><button className="btn btn-primary" onClick={handlePrintOnly}>🖨️ In hóa đơn</button></>}
        >
          <div id="invoice-print-area">
            <style>{`
              @media print {
                body * { visibility: hidden; }
                #invoice-print-area, #invoice-print-area * { visibility: visible; }
                
                .modal-overlay { 
                  display: block !important; 
                  position: absolute !important; 
                  left: 0; top: 0; width: 100%; height: 100%; 
                  background: transparent !important;
                }
                .modal { 
                  position: absolute !important; 
                  left: 0 !important; top: 0 !important; 
                  width: 100% !important; 
                  max-width: 100% !important; 
                  margin: 0 !important; 
                  transform: none !important; 
                  padding: 20mm !important; 
                  box-shadow: none !important; 
                  border: none !important;
                }
                #invoice-print-area { 
                  position: relative !important; 
                  width: 100% !important; 
                  left: auto; top: auto;
                }
                
                .modal-header, .modal-footer { display: none !important; }
              }
              .invoice-header { text-align: center; margin-bottom: 24px; border-bottom: 2px dashed var(--border-color); padding-bottom: 16px; }
              .invoice-header h2 { margin: 0 0 8px; font-size: 24px; color: var(--text-primary); }
              .invoice-header p { margin: 4px 0; color: var(--text-secondary); font-size: 14px; }
              .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
              .invoice-details div { font-size: 14px; line-height: 1.6; }
              .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
              .invoice-table th, .invoice-table td { border-bottom: 1px solid var(--border-color); padding: 12px 8px; text-align: left; }
              .invoice-table th { color: var(--text-secondary); font-weight: 600; }
              .invoice-total { text-align: right; font-size: 20px; font-weight: 700; color: var(--primary-color); }
              .invoice-footer { text-align: center; margin-top: 32px; font-size: 13px; color: var(--text-muted); }
            `}</style>
            
            <div className="invoice-header">
              <h2>GRAND PALACE HOTEL</h2>
              <p>Địa chỉ: 123 Đường XYZ, TP. Thái Nguyên</p>
              <p>Hotline: 1900 1234</p>
              <h3 style={{ marginTop: 16 }}>HÓA ĐƠN THANH TOÁN</h3>
              <p>Mã HĐ: INV-{invoice.id.toString().padStart(6, '0')}</p>
            </div>
            
            <div className="invoice-details">
              <div>
                <strong>Khách hàng:</strong> {invoice.khachHang?.hoTen}<br/>
                <strong>SĐT:</strong> {invoice.khachHang?.sdt}<br/>
                <strong>Ngày tạo:</strong> {new Date().toLocaleDateString('vi-VN')}
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong>Check-in:</strong> {fmtDate(invoice.checkIn)}<br/>
                <strong>Check-out:</strong> {fmtDate(invoice.checkOut)}<br/>
                <strong>Phòng:</strong> #{invoice.phong?.soPhong} ({invoice.phong?.loai})
              </div>
            </div>
            
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Mô tả</th>
                  <th style={{ textAlign: 'center' }}>Số đêm</th>
                  <th style={{ textAlign: 'right' }}>Đơn giá</th>
                  <th style={{ textAlign: 'right' }}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Tiền phòng ({invoice.phong?.loai})</td>
                  <td style={{ textAlign: 'center' }}>
                    {Math.max(1, Math.ceil((new Date(invoice.checkOut) - new Date(invoice.checkIn)) / 86400000))}
                  </td>
                  <td style={{ textAlign: 'right' }}>{fmt(invoice.phong?.gia || 0)}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(invoice.tongTien)}</td>
                </tr>
                {/* Có thể thêm các dịch vụ khác ở đây nếu có */}
              </tbody>
            </table>
            
            <div className="invoice-total">
              TỔNG CỘNG: {fmt(invoice.tongTien)}
            </div>
            
            <div className="invoice-footer">
              <p>Cảm ơn quý khách đã sử dụng dịch vụ của Grand Palace Hotel!</p>
              <p>Hẹn gặp lại quý khách.</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   EXPLORE PAGE (KHÁM PHÁ)
   ════════════════════════════════════════════════════════════════════════════ */
const PLACES = [
  { id: 1, cat: 'tourist', name: 'Bảo tàng Văn hóa các dân tộc Việt Nam', desc: 'Bảo tàng quốc gia lưu giữ di sản văn hóa của 54 dân tộc anh em.', distance: '1.2 km', rating: 4.5, query: 'Bảo tàng Văn hóa các dân tộc Việt Nam, Thái Nguyên' },
  { id: 2, cat: 'tourist', name: 'Khu du lịch Hồ Núi Cốc', desc: 'Khu du lịch sinh thái nổi tiếng với cảnh quan hồ nước thơ mộng.', distance: '15 km', rating: 4.3, query: 'Hồ Núi Cốc, Thái Nguyên' },
  { id: 3, cat: 'tourist', name: 'Đồi chè Tân Cương', desc: 'Vùng chè đặc sản nổi tiếng, phong cảnh xanh mướt tuyệt đẹp.', distance: '8 km', rating: 4.6, query: 'Đồi chè Tân Cương, Thái Nguyên' },
  { id: 101, cat: 'tourist', name: 'Khu di tích ATK Định Hóa', desc: 'Căn cứ địa cách mạng quan trọng trong thời kỳ kháng chiến.', distance: '45 km', rating: 4.7, query: 'ATK Định Hóa, Thái Nguyên' },
  { id: 4, cat: 'food', name: 'Nhà hàng Dũng Tân', desc: 'Đặc sản địa phương và không gian sang trọng, dịch vụ tốt.', distance: '2.5 km', rating: 4.4, query: 'Nhà hàng Dũng Tân, Thái Nguyên' },
  { id: 5, cat: 'food', name: 'Lẩu nấm Ashima Thái Nguyên', desc: 'Lẩu nấm thiên nhiên cao cấp, tốt cho sức khỏe.', distance: '1.0 km', rating: 4.7, query: 'Ashima Thái Nguyên' },
  { id: 6, cat: 'food', name: 'Nhà hàng Sinh Thái Thái Hải', desc: 'Trải nghiệm ẩm thực trong không gian bản làng dân tộc bản địa.', distance: '12 km', rating: 4.8, query: 'Bản làng Thái Hải, Thái Nguyên' },
  { id: 102, cat: 'food', name: 'Bún chả mễ trì - Thái Nguyên', desc: 'Quán ăn bình dân nhưng rất được ưa chuộng với món bún chả.', distance: '800 m', rating: 4.3, query: 'Bún chả mễ trì, Thái Nguyên' },
  { id: 7, cat: 'shopping', name: 'Vincom Plaza Thái Nguyên', desc: 'Trung tâm thương mại hiện đại, đa dạng mặt hàng và khu vui chơi.', distance: '1.5 km', rating: 4.5, query: 'Vincom Plaza Thái Nguyên' },
  { id: 8, cat: 'shopping', name: 'Chợ Thái', desc: 'Khu chợ truyền thống lớn nhất thành phố Thái Nguyên.', distance: '800 m', rating: 4.2, query: 'Chợ Thái, Thái Nguyên' },
  { id: 103, cat: 'shopping', name: 'Siêu thị GO! Thái Nguyên', desc: 'Khu phức hợp mua sắm, siêu thị rộng lớn (Big C cũ).', distance: '3 km', rating: 4.4, query: 'GO! Thái Nguyên' },
  { id: 9, cat: 'cafe', name: 'Highlands Coffee Vincom', desc: 'Thương hiệu cà phê quen thuộc, không gian nằm trong trung tâm thương mại.', distance: '1.5 km', rating: 4.2, query: 'Highlands Coffee Vincom Thái Nguyên' },
  { id: 10, cat: 'cafe', name: 'The Coffee House', desc: 'Không gian làm việc yên tĩnh, thiết kế hiện đại, đồ uống đa dạng.', distance: '1.2 km', rating: 4.5, query: 'The Coffee House, Thái Nguyên' },
  { id: 11, cat: 'cafe', name: 'No.1 Coffee', desc: 'Quán cà phê có view đẹp, đồ uống ngon và không gian check-in lý tưởng.', distance: '2 km', rating: 4.6, query: 'No.1 Coffee, Thái Nguyên' },
];

function ExplorePage() {
  const [tab, setTab] = useState('tourist');
  const [selectedPlace, setSelectedPlace] = useState(PLACES[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.trim();
    setSelectedPlace({
      id: 'custom_' + Date.now(),
      name: q,
      desc: 'Kết quả tìm kiếm tùy chỉnh trên Google Maps.',
      distance: '—',
      rating: '—',
      query: q
    });
    setTab(''); // Clear tab selection so no item in the list is highlighted
  };

  const tabs = [
    { id: 'tourist', label: '📸 Địa điểm Du lịch' },
    { id: 'food', label: '🍜 Quán ăn & Nhà hàng' },
    { id: 'cafe', label: '☕ Quán nước / Cafe' },
    { id: 'shopping', label: '🛍️ Khu mua sắm' }
  ];

  const list = PLACES.filter(p => p.cat === tab);

  return (
    <div className="anim-fade" style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 20, height: 'calc(100vh - 120px)' }}>
      {/* Left List */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card2)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Khám phá lân cận</h3>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Tìm địa điểm trên bản đồ..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: '8px 12px' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 12px' }}>🔍</button>
          </form>
          <div className="filter-tabs" style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>
            {tabs.map(t => (
              <button key={t.id} className={`filter-tab ${tab === t.id ? 'active' : ''}`} onClick={() => { setTab(t.id); setSelectedPlace(PLACES.find(x => x.cat === t.id)); }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {list.map(p => (
            <div key={p.id} 
                 style={{ 
                   padding: 16, borderRadius: 12, marginBottom: 10, cursor: 'pointer',
                   border: `1px solid ${selectedPlace?.id === p.id ? 'var(--indigo)' : 'var(--border)'}`,
                   background: selectedPlace?.id === p.id ? 'rgba(99,102,241,0.1)' : 'var(--bg-card)',
                   transition: 'all 0.2s'
                 }}
                 onClick={() => setSelectedPlace(p)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <strong style={{ fontSize: 14 }}>{p.name}</strong>
                <span style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 600 }}>★ {p.rating}</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.4 }}>{p.desc}</p>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>📍 Cách đây: {p.distance}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Map */}
      <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedPlace && (
          <>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{selectedPlace.name}</h3>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>📍 Bản đồ & Chỉ đường</div>
              </div>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedPlace.query)}`} 
                 target="_blank" rel="noreferrer"
                 className="btn btn-primary">
                🧭 Chỉ đường
              </a>
            </div>
            <div style={{ flex: 1, background: '#e5e7eb' }}>
              <iframe 
                width="100%" height="100%" style={{ border: 0 }} 
                loading="lazy" allowFullScreen 
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedPlace.query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}>
              </iframe>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   SIDEBAR COMPONENT
   ════════════════════════════════════════════════════════════════════════════ */
function Sidebar({ page, onNav, user, onLogout, collapsed, onToggle }) {
  const navItems = [
    { key:'dashboard', icon:'📊', label:'Dashboard'     },
    { key:'rooms',     icon:'🏠', label:'Quản lý phòng' },
    { key:'guests',    icon:'👥', label:'Khách hàng'    },
    { key:'bookings',  icon:'📋', label:'Đặt phòng'     },
    { key:'explore',   icon:'🗺️', label:'Khám phá'      },
    { key:'taxi',      icon:'🚕', label:'Dịch vụ Taxi'  },
    { key:'ai',        icon:'🤖', label:'Trợ lý AI'     },
  ];

  return (
    <div className={`sidebar ${collapsed?'collapsed':''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">🏨</div>
        {!collapsed && (
          <div className="logo-text">
            <h2>Grand Palace</h2>
            <p>Hotel PMS</p>
          </div>
        )}
        <button onClick={onToggle} style={{
          marginLeft:'auto', width:26, height:26, borderRadius:8,
          background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)',
          color:'var(--text-muted)', cursor:'pointer', fontSize:12,
          display:'flex', alignItems:'center', justifyContent:'center',
          flexShrink:0,
        }}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-group-label">MENU CHÍNH</div>
        {navItems.map(item => (
          <button key={item.key} className={`nav-item ${page===item.key?'active':''}`} onClick={() => onNav(item.key)} title={item.label}>
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Footer user */}
      <div className="sidebar-footer">
        {!collapsed ? (
          <div className="user-card">
            <div className="user-avatar">{(user?.hoTen||'A').charAt(0)}</div>
            <div className="user-info">
              <div className="name">{user?.hoTen || user?.username}</div>
              <div className="role">{user?.role === 'admin' ? '👑 Quản trị viên' : '👤 Nhân viên'}</div>
            </div>
            <button onClick={onLogout} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', fontSize:16, color:'var(--text-muted)', padding:4 }} title="Đăng xuất">⏻</button>
          </div>
        ) : (
          <button className="nav-item" onClick={onLogout} title="Đăng xuất" style={{ justifyContent:'center' }}>
            <span className="nav-icon">⏻</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TOPBAR
   ════════════════════════════════════════════════════════════════════════════ */
const PAGE_TITLES = {
  dashboard: { title:'Dashboard',         icon:'📊' },
  rooms:     { title:'Quản lý phòng',     icon:'🏠' },
  guests:    { title:'Khách hàng',        icon:'👥' },
  bookings:  { title:'Đặt phòng',         icon:'📋' },
  explore:   { title:'Khám phá & Bản đồ', icon:'🗺️' },
  taxi:      { title:'Dịch vụ Taxi & Đặt xe', icon:'🚕' },
  ai:        { title:'Trợ lý AI RAG',     icon:'🤖' },
};

function Topbar({ page, user, theme, setTheme }) {
  const { title, icon } = PAGE_TITLES[page] || {};
  const now = new Date();
  const timeStr = now.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' });
  const dateStr = now.toLocaleDateString('vi-VN', { weekday:'long', day:'2-digit', month:'2-digit', year:'numeric' });

  const [lang, setLang] = useState(() => localStorage.getItem('gp_lang') || 'vi');

  const changeLanguage = (code) => {
    setLang(code);
    localStorage.setItem('gp_lang', code);
    
    // Tìm select của google translate widget và thay đổi giá trị
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = code;
      select.dispatchEvent(new Event('change'));
    }
  };

  const LANGS = [
    { code: 'vi', icon: '🇻🇳', name: 'Tiếng Việt' },
    { code: 'en', icon: '🇬🇧', name: 'English' },
    { code: 'zh-CN', icon: '🇨🇳', name: '中文' },
    { code: 'ko', icon: '🇰🇷', name: '한국어' },
    { code: 'ja', icon: '🇯🇵', name: '日本語' }
  ];

  return (
    <div className="topbar">
      <div className="topbar-left">
        <span style={{ fontSize:20 }}>{icon}</span>
        <div>
          <div className="page-title">{title}</div>
          <div className="page-breadcrumb" style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span>Grand Palace PMS · {dateStr}</span>
            <LiveDot pulse={true} />
          </div>
        </div>
      </div>
      <div className="topbar-right">
        {/* Language Selector */}
        <select
          value={lang}
          onChange={e => changeLanguage(e.target.value)}
          title="Chọn ngôn ngữ"
          style={{
            background: 'rgba(255,255,255,0.06)',
            color: 'inherit',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '8px 12px',
            outline: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 500,
            appearance: 'auto', // Allows the native arrow to show
          }}
        >
          {LANGS.map(l => (
            <option key={l.code} value={l.code} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
              {l.icon} {l.name}
            </option>
          ))}
        </select>

        {/* Thời tiết Thái Nguyên */}
        <WeatherWidget />

        <button className="topbar-btn" onClick={() => setTheme(p => p === 'dark' ? 'light' : 'dark')} title="Đổi giao diện">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <div style={{ textAlign:'right', fontSize:12, color:'var(--text-secondary)' }}>
          <div style={{ fontWeight:600, fontSize:14 }}>{timeStr}</div>
        </div>
        <div style={{
          width:36, height:36, borderRadius:10,
          background:'var(--grad-main)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontWeight:700, fontSize:14, color:'#fff',
        }}>{(user?.hoTen||'A').charAt(0)}</div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   AI PAGE
   ════════════════════════════════════════════════════════════════════════════ */
function AIPage() {
  const [ragStats, setRagStats] = React.useState({ totalChunks: null, isBuilt: false });
  React.useEffect(() => {
    fetch('/api/rag/status').then(r => r.json()).then(d => {
      if (d && d.totalChunks) setRagStats({ totalChunks: d.totalChunks, isBuilt: d.isBuilt });
    }).catch(() => {});
  }, []);
  const chunkLabel = ragStats.totalChunks ? `${ragStats.totalChunks} tài liệu nội bộ` : '...';
  return (
    <div className="anim-fade" style={{ maxWidth:720, margin:'0 auto' }}>
      <div className="card" style={{ textAlign:'center', padding:'40px 32px', marginBottom:16 }}>
        <div style={{ fontSize:56, marginBottom:16 }}>🤖</div>
        <h2 style={{ fontSize:20, fontWeight:800, marginBottom:8 }}>Trợ lý AI RAG Grand Palace</h2>
        <p style={{ color:'var(--text-secondary)', fontSize:14, lineHeight:1.6, maxWidth:440, margin:'0 auto 20px' }}>
          Trợ lý AI sử dụng công nghệ RAG (Retrieval-Augmented Generation) — trả lời dựa trên <strong style={{color:'#a5b4fc'}}>{chunkLabel}</strong> của khách sạn, không bịa thông tin.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          {['👔 Nghiệp vụ','🎯 Cá nhân hóa'].map(l => (
            <span key={l} className="badge badge-violet" style={{ fontSize:12, padding:'6px 14px' }}>{l}</span>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:16 }}>
        {[
          { icon:'📋', title:'Chính sách', desc:'Hủy phòng, check-in/out, thú cưng, hút thuốc...', q:'Chính sách hủy phòng?' },
          { icon:'🔧', title:'Quy trình NV', desc:'Xử lý hư hỏng, mất đồ, khiếu nại, VIP...', q:'TV hỏng phòng VIP xử lý thế nào?' },
          { icon:'🗺️', title:'Tour & Dịch vụ', desc:'Tour Thái Nguyên, spa, giặt đồ, đưa đón...', q:'Gợi ý tour du lịch Thái Nguyên?' },
        ].map((c,i) => (
          <div key={i} className="card" style={{ textAlign:'center', cursor:'pointer' }}
            onClick={() => {
              // Mở chatbox và gửi câu hỏi mẫu
              document.getElementById('ai-chat-toggle-btn')?.click();
              setTimeout(() => {
                const inp = document.getElementById('ai-chat-input');
                const btn = document.getElementById('ai-chat-send-btn');
                if (inp) { inp.value = c.q; inp.dispatchEvent(new Event('input',{bubbles:true})); }
              }, 400);
            }}>
            <div style={{ fontSize:28, marginBottom:8 }}>{c.icon}</div>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:4 }}>{c.title}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.4 }}>{c.desc}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.8 }}>
          <p>💡 <strong style={{color:'var(--text-primary)'}}>Cách sử dụng:</strong> Nhấn vào nút 🤖 ở góc phải màn hình để mở chatbox AI. Chọn mode phù hợp:</p>
          <ul style={{ paddingLeft:20, marginTop:8 }}>
            <li><strong style={{color:'#38bdf8'}}>👔 Nghiệp vụ</strong> — Tra cứu quy trình nội bộ, chính sách, dịch vụ và hỗ trợ khách hàng</li>
            <li><strong style={{color:'#fb7185'}}>🎯 Cá nhân</strong> — Nhập ID khách để nhận gợi ý cá nhân hóa</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   ROOT APP
   ════════════════════════════════════════════════════════════════════════════ */
function App() {
  const [token,     setToken]     = useState(() => localStorage.getItem('gp_token') || '');
  const [user,      setUser]      = useState(() => { try { return JSON.parse(localStorage.getItem('gp_user') || 'null'); } catch { return null; } });
  const [page,      setPage]      = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [theme,     setTheme]     = useState(() => localStorage.getItem('gp_theme') || 'dark');
  const { toasts, add: addT, remove } = useToast();

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('gp_theme', theme);
  }, [theme]);

  const login = (tok, usr) => {
    localStorage.setItem('gp_token', tok);
    localStorage.setItem('gp_user', JSON.stringify(usr));
    setToken(tok); setUser(usr);
  };

  const logout = () => {
    localStorage.removeItem('gp_token');
    localStorage.removeItem('gp_user');
    setToken(''); setUser(null); setPage('dashboard');
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // Realtime clock re-render every minute
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(p => p+1), 60000);
    return () => clearInterval(t);
  }, []);

  const [navState,  setNavState]  = useState(null);

  const navigateTo = (targetPage, stateData = null) => {
    setNavState(stateData);
    setPage(targetPage);
  };

  if (!token) return (
    <>
      <LoginPage onLogin={login} />
      <Toast toasts={toasts} remove={remove} />
    </>
  );

  const pageContent = () => {
    switch(page) {
      case 'dashboard': return <Dashboard token={token} onNav={navigateTo} />;
      case 'rooms':     return <RoomsPage   token={token} user={user} />;
      case 'guests':    return <GuestsPage  token={token} user={user} />;
      case 'bookings':  return <BookingsPage token={token} navState={navState} clearNavState={() => setNavState(null)} />;
      case 'explore':   return <ExplorePage />;
      case 'taxi':      return <TaxiPage />;
      case 'ai':        return <AIPage />;
      default:          return <Dashboard token={token} onNav={navigateTo} />;
    }
  };

  return (
    <>
      <div className="app-layout">
        <Sidebar page={page} onNav={setPage} user={user} onLogout={logout} collapsed={collapsed} onToggle={() => setCollapsed(p => !p)} />
        <div className="main-content">
          <Topbar page={page} user={user} theme={theme} setTheme={setTheme} />
          <div className="page-area">
            {pageContent()}
          </div>
        </div>
      </div>
      <TroLyAIGocPhai />
      <Toast toasts={toasts} remove={remove} />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
);
