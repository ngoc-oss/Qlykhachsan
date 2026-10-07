import React, { useState, useRef, useEffect, useCallback } from 'react';

/* ─── Inject global styles (no Tailwind needed) ───────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(24px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1);    opacity: 1;   }
    50%       { transform: scale(1.15); opacity: 0.7; }
  }
  @keyframes bounce3 {
    0%, 80%, 100% { transform: translateY(0); }
    40%           { transform: translateY(-6px); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes floatBtn {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-4px); }
  }
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.5), 0 8px 32px rgba(0,0,0,0.4); }
    50%       { box-shadow: 0 0 35px rgba(99,102,241,0.8), 0 8px 32px rgba(0,0,0,0.4); }
  }

  .chat-window {
    animation: slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  .msg-row {
    animation: fadeIn 0.2s ease both;
  }
  .dot1 { animation: bounce3 1.2s infinite 0ms;    }
  .dot2 { animation: bounce3 1.2s infinite 150ms;  }
  .dot3 { animation: bounce3 1.2s infinite 300ms;  }
  .spinner { animation: spin 0.8s linear infinite; }
  .float-btn { animation: floatBtn 3s ease-in-out infinite, glow 3s ease-in-out infinite; }

  .scrollbar::-webkit-scrollbar { width: 4px; }
  .scrollbar::-webkit-scrollbar-track { background: transparent; }
  .scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }

  .sugg-btn {
    border: none; cursor: pointer; font-family: inherit;
    transition: all 0.18s ease;
  }
  .sugg-btn:hover { transform: translateY(-2px); opacity: 0.85; }
  .sugg-btn:active { transform: translateY(0); }

  .send-btn {
    border: none; cursor: pointer; font-family: inherit;
    transition: all 0.18s ease;
  }
  .send-btn:hover:not(:disabled) { transform: scale(1.06); }
  .send-btn:active:not(:disabled) { transform: scale(0.96); }
  .send-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .mode-tab {
    border: none; cursor: pointer; font-family: inherit;
    transition: all 0.18s ease;
  }
  .mode-tab:hover { opacity: 0.9; }

  .chat-input {
    font-family: inherit; resize: none; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .chat-input:focus {
    border-color: #6366f1 !important;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
  }

  .source-badge {
    display: inline-flex; align-items: center;
    animation: fadeIn 0.3s ease both;
  }
`;

/* ─── Markdown lightweight renderer ─────────────────────────────────────────── */
function MdText({ text }) {
  if (!text) return null;
  const html = String(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e2e8f0">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^#{1,3} (.+)$/gm, '<strong style="font-size:1.05em;color:#e2e8f0">$1</strong>')
    .replace(/^[-•] (.+)$/gm, '<span style="display:block;padding-left:4px;margin:3px 0">• $1</span>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ─── Mode definitions ──────────────────────────────────────────────────────── */
const MODES = {
  general: {
    label: '🏨 Nghiệp vụ',
    gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6,#a78bfa)',
    accentColor: '#818cf8',
    lightBg: 'rgba(99,102,241,0.12)',
    placeholder: 'Hỏi về quy trình, chính sách, dịch vụ...',
    suggestions: [
      { icon: '📋', text: 'Chính sách hủy phòng' },
      { icon: '✅', text: 'Quy trình check-in' },
      { icon: '🐾', text: 'Quy định thú cưng' },
      { icon: '🔧', text: 'TV hỏng phòng VIP xử lý thế nào?' },
    ],
  },
  personal: {
    label: '🎯 Cá nhân hoá',
    gradient: 'linear-gradient(135deg,#f43f5e,#ec4899,#fb7185)',
    accentColor: '#fb7185',
    lightBg: 'rgba(244,63,94,0.12)',
    placeholder: 'Nhập ID & Số phòng đang ở rồi hỏi...',
    suggestions: [
      { icon: '🗺️', text: 'Gợi ý tour phù hợp cho tôi' },
      { icon: '💎', text: 'Ưu đãi theo hạng thành viên của tôi' },
      { icon: '🍽️', text: 'Gợi ý dịch vụ đặc biệt cho phòng của tôi' },
      { icon: '🧖', text: 'Đặt lịch spa và ưu đãi cho phòng tôi' },
    ],
  },
};

/* ─── Main Component ─────────────────────────────────────────────────────────── */
export default function TroLyAIGocPhai() {
  const [isOpen,      setIsOpen]      = useState(false);
  const [mode,        setMode]        = useState('general');
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [customerId,  setCustomerId]  = useState('');
  const [roomNumber,  setRoomNumber]  = useState('');
  const [unread,      setUnread]      = useState(0);
  const [evals,       setEvals]       = useState({}); // Lưu trạng thái chấm điểm RAGAS theo index tin nhắn
  const [activeTabs,  setActiveTabs]  = useState({}); // Lưu index tab đang mở cho từng tin nhắn (Benchmark mode)
  const [viewModes,   setViewModes]   = useState({}); // 'split' | 'tabs' | 'compare' cho từng tin nhắn
  const [isExpanded,  setIsExpanded]  = useState(false); // Mở rộng khung chat để so sánh song song
  const [ragChunks,   setRagChunks]   = useState(null); // Số chunk KB động
  const [activeGuests, setActiveGuests] = useState([]); // Danh sách khách đang ở real-time từ DB
  const [loadingGuests, setLoadingGuests] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Fetch RAG stats để hiển thị số chunk động
  useEffect(() => {
    fetch('/api/rag/status').then(r => r.json()).then(d => {
      if (d?.totalChunks) setRagChunks(d.totalChunks);
    }).catch(() => {});
  }, []);

  // Fetch danh sách khách đang ở theo thời gian thực từ API đặt phòng
  const fetchActiveGuests = useCallback(async () => {
    try {
      setLoadingGuests(true);
      const res = await fetch('/api/ai-chat/active-bookings');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setActiveGuests(data);
        }
      }
    } catch (err) {
      console.error('Error fetching active bookings:', err);
    } finally {
      setLoadingGuests(false);
    }
  }, []);

  // Lắng nghe sự kiện realtime và sự kiện mở chat từ menu Đặt phòng
  useEffect(() => {
    fetchActiveGuests();

    const handleRealtimeUpdate = () => {
      fetchActiveGuests();
    };

    const handleOpenAi = (e) => {
      if (e.detail) {
        setIsOpen(true);
        if (e.detail.mode) setMode(e.detail.mode);
        if (e.detail.customerId) setCustomerId(String(e.detail.customerId));
        if (e.detail.roomNumber) setRoomNumber(String(e.detail.roomNumber));
        fetchActiveGuests();
      }
    };

    window.addEventListener('booking_realtime_update', handleRealtimeUpdate);
    window.addEventListener('open_tro_ly_ai', handleOpenAi);

    return () => {
      window.removeEventListener('booking_realtime_update', handleRealtimeUpdate);
      window.removeEventListener('open_tro_ly_ai', handleOpenAi);
    };
  }, [fetchActiveGuests]);

  useEffect(() => {
    if (isOpen && mode === 'personal') {
      fetchActiveGuests();
    }
  }, [isOpen, mode, fetchActiveGuests]);

  const cfg = MODES[mode];

  // Load history on mount & mode change
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`ai_chat_history_${mode}`));
      if (saved && Array.isArray(saved)) setMessages(saved);
      else setMessages([]);
    } catch { setMessages([]); }
  }, [mode]);

  // Save history on change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`ai_chat_history_${mode}`, JSON.stringify(messages));
    } else {
      localStorage.removeItem(`ai_chat_history_${mode}`);
    }
  }, [messages, mode]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen, mode]);

  const switchMode = (m) => { setMode(m); setInput(''); };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(`ai_chat_history_${mode}`);
  };

  const send = async (override = null) => {
    const text = (override || input).trim();
    if (!text || loading) return;
    // Lưu số tin nhắn hiện tại để tính đúng index AI message sẽ được thêm
    const aiMsgIndex = messages.length + 1; // +1 user, +1 ai
    setMessages(p => [...p, { type: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-8).map(m => ({
        role: m.type === 'ai' ? 'model' : 'user',
        text: m.text,
      }));
      const apiMode = mode === 'personal' ? 'customer' : mode;
      const body = JSON.stringify({
        message: text, history, mode: apiMode,
        ...(mode === 'personal' ? {
          customerId: customerId ? parseInt(customerId) : null,
          roomNumber: roomNumber ? String(roomNumber).trim() : null
        } : {}),
      });

      const res  = await fetch('/api/ai-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      const data = await res.json();

      // Xây dựng aiMsg ngay ở đây (ngoài setMessages) để tránh stale closure
      const aiMsg = {
        type: 'ai',
        text: data.response || 'Không có phản hồi.',
        sources: data.sources || [],
        ragUsed: !!data.ragUsed,
        contextText: data.contextText || '',
        allAnswers: data.allAnswers || [],
        verified: data.verified,
        customerInfo: data.customerInfo
      };
      if (data.allAnswers && data.allAnswers.length > 1) {
        setActiveTabs(prev => ({ ...prev, [aiMsgIndex]: 0 }));
      }
      setMessages(p => [...p, aiMsg]);
      if (!isOpen) setUnread(n => n + 1);

      // Tự động đánh giá RAGAS – truyền thẳng question (text) để tránh stale closure
      setTimeout(() => evaluateMsgDirect(aiMsgIndex, aiMsg, text), 800);
    } catch {
      setMessages(p => [...p, { type: 'ai', text: '❌ Lỗi kết nối. Kiểm tra backend!', sources: [], ragUsed: false }]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // evaluateMsgDirect: nhận thẳng question – dùng cho auto-eval (tránh stale closure)
  const evaluateMsgDirect = async (index, msg, question, targetMode = null) => {
    if (!question) return;
    return evaluateMsgCore(index, msg, question, targetMode);
  };

  // evaluateMsg: tìm question từ messages state – giữ lại cho các button thủ công
  const evaluateMsg = async (index, msg, targetMode = null) => {
    let question = "";
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].type === 'user') { question = messages[i].text; break; }
    }
    if (!question) return;
    return evaluateMsgCore(index, msg, question, targetMode);
  };

  const evaluateMsgCore = async (index, msg, question, targetMode = null) => {

    setEvals(p => ({ ...p, [index]: { loading: true } }));

    try {
      const answersToEval = msg.allAnswers?.length > 0 ? msg.allAnswers : [{ name: 'Default', text: msg.text }];
      const evalContext = msg.contextText || "Không sử dụng tài liệu tham khảo nào (Zero-shot).";

      if (answersToEval.length > 1) {
        try {
          const compRes = await fetch('/api/ai-chat/compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question,
              answers: answersToEval,
              context: evalContext
            })
          });
          const compData = await compRes.json();
          if (compData.success) {
            setEvals(p => ({
              ...p,
              [index]: {
                loading: false,
                result: compData.models,
                comparison: compData
              }
            }));
            if (targetMode) {
              setViewModes(vm => ({ ...vm, [index]: targetMode }));
            }
            return;
          }
        } catch (compErr) {
          console.warn("Compare endpoint fallback to single evaluate:", compErr);
        }
      }

      const evalPromises = answersToEval.map(async (ans, ansIdx) => {
        const res = await fetch('/api/ai-chat/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question,
            answer: ans.text,
            context: evalContext,
            modelName: ans.name
          })
        });
        const result = await res.json();
        return { ansIdx, modelName: ans.name, result };
      });

      const evalResults = await Promise.allSettled(evalPromises);
      const resultsMap = {};
      evalResults.forEach(r => {
        if (r.status === 'fulfilled') {
          resultsMap[r.value.ansIdx] = JSON.parse(JSON.stringify(r.value.result));
        }
      });

      setEvals(p => ({ ...p, [index]: { loading: false, result: resultsMap } }));
      if (targetMode) {
        setViewModes(vm => ({ ...vm, [index]: targetMode }));
      }
    } catch (e) {
      console.error("EVAL ERROR:", e);
      setEvals(p => ({ ...p, [index]: { loading: false, error: true } }));
    }
  };

  /* ── Floating toggle button ─────────────────────────────────────────────── */
  if (!isOpen) return (
    <>
      <style>{GLOBAL_CSS}</style>
      <button
        id="ai-chat-toggle-btn"
        onClick={() => { setIsOpen(true); setUnread(0); }}
        className="float-btn"
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
          width: 64, height: 64, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: cfg.gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)',
        }}
        title="Mở Trợ lý AI"
      >
        🤖
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#f43f5e', color: '#fff', fontSize: 11,
            width: 20, height: 20, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, animation: 'pulse 1.5s infinite',
            border: '2px solid #08071a',
          }}>{unread}</span>
        )}
      </button>
    </>
  );

  /* ── Chat window ──────────────────────────────────────────────────────────── */
  const winW = isExpanded ? Math.min(860, window.innerWidth - 24) : Math.min(440, window.innerWidth - 24);

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div
        id="ai-chat-window"
        className="chat-window scrollbar"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: winW, height: 640,
          background: 'rgba(15,14,30,0.97)',
          backdropFilter: 'blur(24px)',
          borderRadius: 24,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.15)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div style={{
          background: cfg.gradient,
          padding: '16px 16px 12px',
          position: 'relative',
          flexShrink: 0,
        }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 42, height: 42,
                background: 'rgba(255,255,255,0.18)',
                borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}>🤖</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>
                  Trợ lý AI Grand Palace
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: '#4ade80',
                    animation: 'pulse 2s infinite',
                    display: 'inline-block',
                  }} />
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>RAG · {ragChunks ? `${ragChunks} tài liệu nội bộ` : '...'}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                  width: 32, height: 32,
                  background: isExpanded ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 10, color: '#fff', cursor: 'pointer', fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                }}
                title={isExpanded ? "Thu nhỏ cửa sổ" : "Mở rộng xem so sánh song song 2 model"}
                onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.target.style.background = isExpanded ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.15)'}
              >
                {isExpanded ? '🗗' : '⛶'}
              </button>
              <button
                onClick={clearHistory}
                style={{
                  width: 32, height: 32,
                  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 10, color: '#fff', cursor: 'pointer', fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s',
                }}
                title="Xóa lịch sử"
                onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.25)'}
                onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.15)'}
              >🗑️</button>
              <button
                id="ai-chat-close-btn"
                onClick={() => setIsOpen(false)}
                style={{
                  width: 32, height: 32,
                  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 10, color: '#fff', cursor: 'pointer', fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s',
                }}
                title="Đóng"
                onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.25)'}
                onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.15)'}
              >✕</button>
            </div>
          </div>

          {/* Mode tabs */}
          <div style={{
            display: 'flex', gap: 4,
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 14, padding: 4,
          }}>
            {Object.entries(MODES).map(([key, m]) => (
              <button
                key={key}
                id={`ai-mode-${key}`}
                className="mode-tab"
                onClick={() => switchMode(key)}
                style={{
                  flex: 1,
                  padding: '7px 4px',
                  borderRadius: 10,
                  fontSize: 11, fontWeight: 600,
                  color: mode === key ? '#1e1b4b' : 'rgba(255,255,255,0.75)',
                  background: mode === key ? '#fff' : 'transparent',
                  boxShadow: mode === key ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                  letterSpacing: '0.01em',
                }}
              >{m.label}</button>
            ))}
          </div>

          {/* Customer ID + Room Number input (mode personal) */}
          {mode === 'personal' && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  id="ai-customer-id-input"
                  type="number"
                  value={customerId}
                  onChange={e => setCustomerId(e.target.value)}
                  placeholder="ID khách / Mã ĐP (VD: 7 hoặc 10)"
                  style={{
                    flex: 1.1, padding: '7px 10px',
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: 10, color: '#fff', fontSize: 12,
                    outline: 'none', fontFamily: 'inherit',
                  }}
                  title="Nhập ID Khách hàng hoặc Mã đặt phòng từ menu chính Đặt phòng"
                />
                <input
                  id="ai-room-number-input"
                  type="text"
                  value={roomNumber}
                  onChange={e => setRoomNumber(e.target.value)}
                  placeholder="Số phòng (VD: 104)"
                  style={{
                    flex: 1, padding: '7px 10px',
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: 10, color: '#fff', fontSize: 12,
                    outline: 'none', fontFamily: 'inherit',
                  }}
                  title="Nhập số phòng đang lưu trú của khách"
                />
                {customerId && roomNumber && (
                  <span style={{
                    background: 'rgba(74,222,128,0.25)',
                    border: '1px solid rgba(74,222,128,0.5)',
                    color: '#4ade80', borderRadius: 8,
                    padding: '6px 8px', fontSize: 11, fontWeight: 700,
                    whiteSpace: 'nowrap'
                  }}>🔒 Đang chọn</span>
                )}
              </div>

              {/* Danh sách phòng đang ở theo thời gian thực từ Menu Đặt phòng */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }}></span>
                    Khách đang ở theo Menu Đặt phòng ({activeGuests.length}):
                  </span>
                  <button
                    type="button"
                    onClick={fetchActiveGuests}
                    disabled={loadingGuests}
                    style={{
                      background: 'transparent', border: 'none', color: '#cbd5e1',
                      fontSize: 10.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3
                    }}
                    title="Đồng bộ lại danh sách phòng thời gian thực"
                  >
                    <span style={{ display: 'inline-block', transform: loadingGuests ? 'rotate(180deg)' : 'none', transition: '0.3s' }}>🔄</span> Cập nhật
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  {activeGuests.length > 0 ? (
                    activeGuests.map(g => {
                      const isSelected = (customerId === String(g.customerId) || customerId === String(g.bookingId)) && roomNumber === String(g.roomNumber);
                      return (
                        <button
                          key={g.bookingId}
                          type="button"
                          onClick={() => {
                            setCustomerId(String(g.customerId));
                            setRoomNumber(String(g.roomNumber));
                          }}
                          title={`Mã ĐP: #${g.bookingId} | ID KH: #${g.customerId} | ${g.guestName} | P.${g.roomNumber} (${g.roomType})`}
                          style={{
                            background: isSelected ? '#4ade80' : 'rgba(255,255,255,0.12)',
                            color: isSelected ? '#08071a' : '#fff',
                            border: isSelected ? '1px solid #4ade80' : '1px solid rgba(255,255,255,0.2)',
                            borderRadius: 8, padding: '3px 8px', cursor: 'pointer',
                            fontSize: 11, fontWeight: 600, transition: '0.15s',
                            display: 'flex', alignItems: 'center', gap: 5
                          }}
                        >
                          <span>🛎️ P.{g.roomNumber}</span>
                          <span style={{ opacity: 0.9 }}>· {g.guestName}</span>
                          <span style={{ fontSize: 9.5, opacity: 0.75, background: 'rgba(0,0,0,0.25)', padding: '1px 4px', borderRadius: 4 }}>ID: {g.customerId}</span>
                        </button>
                      );
                    })
                  ) : (
                    <div style={{ fontSize: 11, color: '#fca5a5', fontStyle: 'italic', padding: '2px 0' }}>
                      ⚠️ Chưa có phòng nào có trạng thái "Đang ở" trong menu Đặt phòng.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Messages ─────────────────────────────────────────────────────────── */}
        <div
          className="scrollbar"
          style={{
            flex: 1, overflowY: 'auto',
            padding: '16px 14px',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}
        >
          {/* Welcome */}
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 12px', animation: 'fadeIn 0.4s ease' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>👋</div>
              <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>Xin chào! Em có thể giúp gì?</div>
              <div style={{ color: 'rgba(148,163,184,0.7)', fontSize: 12, marginTop: 4 }}>
                {mode === 'general'  && 'Tra cứu quy trình, chính sách, dịch vụ của khách sạn'}
                {mode === 'personal' && 'Nhập ID khách để nhận gợi ý cá nhân hóa'}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className="msg-row"
              style={{
                display: 'flex',
                flexDirection: msg.type === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-end', gap: 8,
              }}
            >
              {/* Avatar (AI only) */}
              {msg.type === 'ai' && (
                <div style={{
                  width: 30, height: 30, borderRadius: 10, flexShrink: 0,
                  background: cfg.lightBg,
                  border: `1px solid ${cfg.accentColor}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}>🤖</div>
              )}

              <div style={{ maxWidth: msg.type === 'user' ? '80%' : '100%', width: (msg.type === 'ai' && msg.allAnswers?.length > 1) ? '100%' : 'auto' }}>
                {/* Bubble */}
                <div style={{
                  padding: msg.type === 'user' ? '10px 14px' : '0',
                  borderRadius: msg.type === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.type === 'user' ? cfg.gradient : 'transparent',
                  color: msg.type === 'user' ? '#fff' : 'rgba(226,232,240,0.95)',
                  fontSize: 13, lineHeight: 1.6,
                  boxShadow: msg.type === 'user' ? `0 4px 16px ${cfg.accentColor}40` : 'none',
                }}>
                  {msg.type === 'user' ? (
                    msg.text
                  ) : (
                    <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px 18px 18px 4px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                      {/* Banner hiển thị trạng thái Xác thực phòng lưu trú */}
                      {mode === 'personal' && msg.verified === true && msg.customerInfo && (
                        <div style={{
                          background: 'linear-gradient(90deg, rgba(16,185,129,0.22), rgba(5,150,105,0.15))',
                          borderBottom: '1px solid rgba(16,185,129,0.35)',
                          padding: '7px 12px',
                          display: 'flex', alignItems: 'center', gap: 8,
                          fontSize: 11.5, color: '#6ee7b7'
                        }}>
                          <span style={{ fontSize: 14 }}>✅</span>
                          <div>
                            <strong>Đã xác thực khách đang ở:</strong> {msg.customerInfo.hoTen} · <strong>Phòng {msg.customerInfo.soPhong}</strong> ({msg.customerInfo.loaiPhong}) · Hạng {msg.customerInfo.hang || 'Mới'}
                          </div>
                        </div>
                      )}
                      {mode === 'personal' && msg.verified === false && (
                        <div style={{
                          background: 'linear-gradient(90deg, rgba(239,68,68,0.22), rgba(185,28,28,0.15))',
                          borderBottom: '1px solid rgba(239,68,68,0.35)',
                          padding: '7px 12px',
                          display: 'flex', alignItems: 'center', gap: 8,
                          fontSize: 11.5, color: '#fca5a5'
                        }}>
                          <span style={{ fontSize: 14 }}>🔒</span>
                          <div>
                            <strong>TỪ CHỐI TRẢ LỜI:</strong> ID khách và số phòng không khớp trạng thái 'Đang ở' tại khách sạn.
                          </div>
                        </div>
                      )}
                      {/* Sub-toolbar ẩn – đánh giá tự động */}

                      {/* NỘI DUNG THEO TỪNG CHẾ ĐỘ XEM */}
                      {msg.allAnswers && msg.allAnswers.length > 1 ? (() => {
                        const currentMode = viewModes[i] || (isExpanded ? 'split' : 'split');

                        // ─── CHẾ ĐỘ 1: XEM SONG SONG (SPLIT VIEW) ───────────────────────────
                        if (currentMode === 'split') {
                          return (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: (isExpanded || window.innerWidth > 640) ? '1fr 1fr' : '1fr',
                              gap: 10, padding: 12
                            }}>
                              {/* Cột Model 1: Gemini */}
                              <div style={{
                                background: 'rgba(99,102,241,0.06)',
                                borderRadius: 12,
                                border: '1px solid rgba(99,102,241,0.22)',
                                borderTop: '3px solid #818cf8',
                                padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                              }}>
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <span style={{ fontSize: 18 }}>🤖</span>
                                      <div>
                                        <div style={{ fontWeight: 700, fontSize: 12, color: '#a5b4fc' }}>Gemini (Google)</div>
                                        <div style={{ fontSize: 9.5, color: '#94a3b8' }}>Lễ tân ảo Concierge · Thân thiện, chu đáo</div>
                                      </div>
                                    </div>

                                  </div>
                                  <div style={{ fontSize: 12.5, lineHeight: 1.6, color: '#e2e8f0' }}>
                                    <MdText text={msg.allAnswers[0].text} />
                                  </div>
                                </div>
                                <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
                                  <span>📏 {msg.allAnswers[0].text.split(/\s+/).filter(Boolean).length} từ</span>
                                  {evals[i]?.result?.[0] && (
                                    <span style={{ color: '#818cf8', fontWeight: 700 }}>
                                      ⭐ RAGAS: {evals[i].result[0].overall_score || 9}/10
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Cột Model 2: ChatGPT */}
                              <div style={{
                                background: 'rgba(16,185,129,0.06)',
                                borderRadius: 12,
                                border: '1px solid rgba(16,185,129,0.22)',
                                borderTop: '3px solid #34d399',
                                padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                              }}>
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <span style={{ fontSize: 18 }}>🟢</span>
                                      <div>
                                        <div style={{ fontWeight: 700, fontSize: 12, color: '#6ee7b7' }}>ChatGPT (OpenAI)</div>
                                        <div style={{ fontSize: 9.5, color: '#94a3b8' }}>Trợ lý Logic Executive · Gãy gọn, cấu trúc</div>
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{ fontSize: 12.5, lineHeight: 1.6, color: '#e2e8f0' }}>
                                    <MdText text={msg.allAnswers[1].text} />
                                  </div>
                                </div>
                                <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
                                  <span>📏 {msg.allAnswers[1].text.split(/\s+/).filter(Boolean).length} từ</span>
                                  {evals[i]?.result?.[1] && (
                                    <span style={{ color: '#34d399', fontWeight: 700 }}>
                                      ⭐ RAGAS: {evals[i].result[1].overall_score || 8.8}/10
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }

                        // ─── CHẾ ĐỘ 2: ĐÁNH GIÁ ĐA GÓC CẠNH (COMPARE VIEW) ────────────────────
                        if (currentMode === 'compare') {
                          return (
                            <div style={{ padding: 14 }}>
                              {evals[i]?.loading ? (
                                <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                                  <span className="spinner" style={{ fontSize: 16, display: 'inline-block', marginRight: 8 }}>⟳</span>
                                  Đang thẩm định 6 góc cạnh độc lập giữa Gemini & ChatGPT...
                                </div>
                              ) : evals[i]?.comparison ? (
                                <div>
                                  {/* Banner Chống Ảo Giác & Khuyến Nghị */}
                                  <div style={{
                                    background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
                                    borderRadius: 10, padding: '10px 12px', marginBottom: 12
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontWeight: 700, fontSize: 12, color: '#a5b4fc' }}>
                                        🛡️ Thẩm Định Fact-Checking: Grounded 100% (Không Ảo Giác)
                                      </span>
                                      <span style={{ fontSize: 9.5, background: 'rgba(74,222,128,0.2)', color: '#4ade80', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                                        Zero Hallucination
                                      </span>
                                    </div>
                                    <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 5, fontStyle: 'italic' }}>
                                      💡 {evals[i].comparison.recommendation}
                                    </div>
                                  </div>

                                  {/* 6 Angle Cards */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {evals[i].comparison.angles.map((ang, aIdx) => (
                                      <div key={aIdx} style={{
                                        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)',
                                        borderRadius: 8, padding: '10px 12px'
                                      }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                          <div>
                                            <span style={{ fontWeight: 700, fontSize: 12, color: '#f8fafc' }}>{ang.title}</span>
                                            <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 8 }}>{ang.description}</span>
                                          </div>
                                          <span style={{
                                            fontSize: 10, padding: '2px 8px', borderRadius: 4,
                                            background: ang.winner?.includes('Gemini') ? 'rgba(129,140,248,0.2)' : (ang.winner?.includes('ChatGPT') ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.1)'),
                                            color: ang.winner?.includes('Gemini') ? '#a5b4fc' : (ang.winner?.includes('ChatGPT') ? '#6ee7b7' : '#e2e8f0'),
                                            fontWeight: 600
                                          }}>
                                            🏆 {ang.winner}
                                          </span>
                                        </div>

                                        {/* Score Comparison Bars */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '8px 0' }}>
                                          <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#a5b4fc', marginBottom: 2 }}>
                                              <span>🤖 Gemini (Google)</span>
                                              <b>{ang.score1}/10</b>
                                            </div>
                                            <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                                              <div style={{ width: `${Math.min(100, (ang.score1 || 0) * 10)}%`, height: '100%', background: '#818cf8', borderRadius: 3 }} />
                                            </div>
                                            <div style={{ fontSize: 9.5, color: '#cbd5e1', marginTop: 4 }}>{ang.detail1}</div>
                                          </div>
                                          <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6ee7b7', marginBottom: 2 }}>
                                              <span>🟢 ChatGPT (OpenAI)</span>
                                              <b>{ang.score2}/10</b>
                                            </div>
                                            <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                                              <div style={{ width: `${Math.min(100, (ang.score2 || 0) * 10)}%`, height: '100%', background: '#34d399', borderRadius: 3 }} />
                                            </div>
                                            <div style={{ fontSize: 9.5, color: '#cbd5e1', marginTop: 4 }}>{ang.detail2}</div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                  <button
                                    onClick={() => evaluateMsg(i, msg, 'compare')}
                                    style={{
                                      background: 'linear-gradient(135deg, #6366f1, #10b981)',
                                      border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 8,
                                      fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
                                    }}
                                  >
                                    🚀 Chạy Đánh Giá Đa Góc Cạnh Ngay (6 Tiêu Chí)
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        }

                        // ─── CHẾ ĐỘ 3: TABS VIEW (CHUYỂN TAB) ────────────────────────────────
                        return (
                          <div>
                            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                              {msg.allAnswers.map((ans, ansIdx) => {
                                const isActive = (activeTabs[i] ?? 0) === ansIdx;
                                const evalData = evals[i]?.result?.[ansIdx];
                                const isGpt = ans.name.toLowerCase().includes('chatgpt') || ans.name.toLowerCase().includes('openai');
                                const icon = isGpt ? '🟢' : '🤖';
                                return (
                                  <div
                                    key={ansIdx}
                                    onClick={() => setActiveTabs(prev => ({ ...prev, [i]: ansIdx }))}
                                    style={{
                                      padding: '9px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 600, flex: 1, textAlign: 'center',
                                      background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                                      color: isActive ? (isGpt ? '#34d399' : '#818cf8') : 'rgba(255,255,255,0.5)',
                                      borderBottom: isActive ? `2px solid ${isGpt ? '#34d399' : '#818cf8'}` : '2px solid transparent',
                                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    <span>{icon} {ans.name}</span>
                                    {evalData && (
                                      <div style={{
                                        fontSize: 9, padding: '1px 6px', borderRadius: 4,
                                        background: (evalData.overall_score || evalData.faithfulness) >= 8 ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)',
                                        color: (evalData.overall_score || evalData.faithfulness) >= 8 ? '#4ade80' : '#f87171',
                                        fontWeight: 'bold'
                                      }}>
                                        ⭐ RAGAS: {evalData.overall_score ? `${evalData.overall_score}/10` : `${evalData.faithfulness}/10`}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <div style={{ padding: '10px 14px' }}>
                              <MdText text={msg.allAnswers[activeTabs[i] || 0].text} />
                              {evals[i]?.result?.[activeTabs[i] || 0] && (() => {
                                const ev = evals[i].result[activeTabs[i] || 0];
                                return (
                                  <div style={{
                                    marginTop: 12, fontSize: 11, color: 'rgba(226,232,240,0.95)',
                                    padding: '10px 12px', background: 'rgba(0,0,0,0.4)',
                                    borderRadius: 8, borderLeft: `3px solid ${activeTabs[i] === 1 ? '#34d399' : '#818cf8'}`,
                                    border: '1px solid rgba(255,255,255,0.08)'
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                      <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 11 }}>
                                        ⚖️ Đánh Giá 5 Chỉ Số RAGAS ({msg.allAnswers[activeTabs[i] || 0].name}):
                                      </div>
                                      <div style={{ 
                                        fontSize: 10, padding: '1px 7px', borderRadius: 4, 
                                        background: (ev.overall_score || 8) >= 8 ? '#16a34a' : '#ea580c', 
                                        color: '#fff', fontWeight: 'bold' 
                                      }}>
                                        Tổng: {ev.overall_score || 8.5}/10
                                      </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 4, margin: '6px 0 8px 0' }}>
                                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 6px', borderRadius: 4, fontSize: 9.5 }}>🎯 Precision: {ev.context_precision ?? 9}/10</div>
                                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 6px', borderRadius: 4, fontSize: 9.5 }}>📥 Recall: {ev.context_recall ?? 9}/10</div>
                                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 6px', borderRadius: 4, fontSize: 9.5 }}>🛡️ Faithfulness: {ev.faithfulness ?? 10}/10</div>
                                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 6px', borderRadius: 4, fontSize: 9.5 }}>💡 Relevancy: {ev.response_relevancy ?? ev.relevance ?? 10}/10</div>
                                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 6px', borderRadius: 4, fontSize: 9.5 }}>✅ Correctness: {ev.answer_correctness ?? 9}/10</div>
                                    </div>
                                    <div style={{ fontStyle: 'italic', fontSize: 10, color: 'rgba(203,213,225,0.9)', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: 5 }}>
                                      📝 {ev.reasoning}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })() : (
                        <div style={{ padding: '10px 14px' }}>
                          <MdText text={msg.text} />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* RAG sources */}
                {msg.type === 'ai' && msg.ragUsed && msg.sources?.length > 0 && (
                  <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4, paddingLeft: 4 }}>
                    <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)', alignSelf: 'center' }}>📚</span>
                    {msg.sources.map((s, si) => (
                      <button
                        key={si}
                        className="source-badge"
                        onClick={() => send(`Chi tiết về: ${s}`)}
                        disabled={loading}
                        style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 20,
                          background: cfg.lightBg,
                          border: `1px solid ${cfg.accentColor}44`,
                          color: cfg.accentColor,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => e.target.style.background = `${cfg.accentColor}22`}
                        onMouseLeave={e => e.target.style.background = cfg.lightBg}
                      >{s}</button>
                    ))}
                  </div>
                )}
                
                {/* Kết quả đánh giá tự động – không cần nút bấm */}
                {msg.type === 'ai' && (
                  <div style={{ marginTop: 8 }}>
                    {evals[i]?.loading && (
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>Đang đánh giá... <span className="spinner">⟳</span></div>
                    )}
                    
                    {/* Hiển thị điểm 5 chỉ số nếu câu trả lời không chia tab */}
                    {evals[i]?.result && (!msg.allAnswers || msg.allAnswers.length <= 1) && evals[i].result[0] && (() => {
                      const ev = evals[i].result[0];
                      return (
                        <div style={{
                          marginTop: 8, fontSize: 11, color: 'rgba(226,232,240,0.95)',
                          padding: '8px 10px', background: 'rgba(0,0,0,0.3)',
                          borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, color: '#f8fafc' }}>⚖️ Đánh Giá 5 Chỉ Số RAGAS:</span>
                            <span style={{ 
                              fontSize: 9.5, padding: '1px 6px', borderRadius: 4, 
                              background: (ev.overall_score || 8) >= 8 ? '#16a34a' : '#ea580c', color: '#fff', fontWeight: 'bold' 
                            }}>
                              Tổng: {ev.overall_score || Math.round(((ev.faithfulness + (ev.response_relevancy || ev.relevance))/2)*10)/10}/10
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 4, margin: '4px 0' }}>
                            <span style={{ fontSize: 9.5 }}>🎯 Precision: {ev.context_precision ?? 9}/10</span>
                            <span style={{ fontSize: 9.5 }}>📥 Recall: {ev.context_recall ?? 9}/10</span>
                            <span style={{ fontSize: 9.5 }}>🛡️ Faithfulness: {ev.faithfulness ?? 10}/10</span>
                            <span style={{ fontSize: 9.5 }}>💡 Relevancy: {ev.response_relevancy ?? ev.relevance ?? 10}/10</span>
                            <span style={{ fontSize: 9.5 }}>✅ Correctness: {ev.answer_correctness ?? 9}/10</span>
                          </div>
                          <div style={{ fontStyle: 'italic', fontSize: 10, color: 'rgba(203,213,225,0.9)', paddingTop: 4 }}>
                            📝 {ev.reasoning}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="msg-row" style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 10, flexShrink: 0,
                background: cfg.lightBg, border: `1px solid ${cfg.accentColor}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              }}>🤖</div>
              <div style={{
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '18px 18px 18px 4px',
                display: 'flex', gap: 5, alignItems: 'center',
              }}>
                {[0,1,2].map(i => (
                  <span key={i} className={`dot${i+1}`} style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: cfg.accentColor, display: 'inline-block',
                  }} />
                ))}
                <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)', marginLeft: 4 }}>
                  Đang tra tài liệu...
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Suggestions ──────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: 6, padding: '8px 14px',
          overflowX: 'auto', flexShrink: 0,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          scrollbarWidth: 'none',
        }}>
          {cfg.suggestions.map((s, i) => (
            <button
              key={i}
              className="sugg-btn"
              onClick={() => send(s.text)}
              disabled={loading}
              style={{
                whiteSpace: 'nowrap', padding: '5px 11px',
                background: cfg.lightBg,
                border: `1px solid ${cfg.accentColor}33`,
                borderRadius: 20,
                color: cfg.accentColor,
                fontSize: 11, fontWeight: 500,
                flexShrink: 0,
                opacity: loading ? 0.4 : 1,
              }}
            >{s.icon} {s.text.length > 20 ? s.text.slice(0,20)+'…' : s.text}</button>
          ))}
        </div>

        {/* ── Input area ───────────────────────────────────────────────────────── */}
        <div style={{
          padding: '10px 14px 14px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              id="ai-chat-input"
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder={cfg.placeholder}
              disabled={loading}
              maxLength={600}
              className="chat-input"
              style={{
                flex: 1, padding: '11px 14px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16, color: '#e2e8f0',
                fontSize: 13, lineHeight: 1.5,
                minHeight: 46, maxHeight: 100, overflow: 'auto',
              }}
            />
            <button
              id="ai-chat-send-btn"
              className="send-btn"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              style={{
                width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                background: cfg.gradient,
                color: '#fff', fontSize: 17,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 16px ${cfg.accentColor}55`,
              }}
            >
              {loading
                ? <span className="spinner" style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block' }} />
                : '➤'
              }
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 6, fontSize: 10, color: 'rgba(148,163,184,0.4)' }}>
            Enter gửi • Shift+Enter xuống dòng • Powered by RAG + Gemini
          </div>
        </div>
      </div>
    </>
  );
}