require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const ragService = require('./services/ragService');

const app  = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'GrandPalacePMS_2026';

// ─── MIDDLEWARE ───────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────
function authMW(req, res, next) {
  const h = req.headers['authorization'] || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Cần đăng nhập' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' }); }
}

// Middleware chỉ cho phép Admin (role = 'admin')
function adminMW(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Chỉ quản trị viên mới có quyền thực hiện thao tác này.' });
  }
  next();
}

// ─── IN-MEMORY DATA (fallback khi MySQL không có) ─────────────────
let _dbMode = 'memory'; // 'mysql' | 'memory'
let _seq    = null;
let _models = {};

// Memory stores
let memUsers = [];
let memPhongs = [];
let memKhachHangs = [];
let memDatPhongs = [];
let _nextId = { user: 10, phong: 20, kh: 30, dp: 40 };

function nextId(k) { return ++_nextId[k]; }

async function seedMemory() {
  // Users
  memUsers = [
    { id:1, username:'admin', password: await bcrypt.hash('admin123',10), hoTen:'Quản trị viên', role:'admin' },
    { id:2, username:'staff', password: await bcrypt.hash('staff123',10), hoTen:'Nhân viên',     role:'staff' },
  ];
  // Phòng
  memPhongs = [
    { id:1,  soPhong:'101', loai:'Don',   tang:1, gia:600000,  trangThai:'trong',   tinhTrangDonDep:'sach', moTa:'Phòng đơn tiêu chuẩn, nhìn ra hồ bơi' },
    { id:2,  soPhong:'102', loai:'Don',   tang:1, gia:600000,  trangThai:'dang-o',  tinhTrangDonDep:'sach', moTa:'Phòng đơn tiêu chuẩn' },
    { id:3,  soPhong:'103', loai:'Don',   tang:1, gia:600000,  trangThai:'dang-o',  tinhTrangDonDep:'ban',  moTa:'Phòng đơn tiêu chuẩn' },
    { id:4,  soPhong:'104', loai:'Don',   tang:1, gia:700000,  trangThai:'trong',   tinhTrangDonDep:'sach', moTa:'Phòng đơn cao cấp, balcony' },
    { id:5,  soPhong:'201', loai:'Doi',   tang:2, gia:900000,  trangThai:'dang-o',  tinhTrangDonDep:'sach', moTa:'Phòng đôi 2 giường đơn' },
    { id:6,  soPhong:'202', loai:'Doi',   tang:2, gia:900000,  trangThai:'trong',   tinhTrangDonDep:'ban',  moTa:'Phòng đôi, view thành phố' },
    { id:7,  soPhong:'203', loai:'Doi',   tang:2, gia:950000,  trangThai:'don-dep', tinhTrangDonDep:'dang-don', moTa:'Phòng đôi, giường King size' },
    { id:8,  soPhong:'204', loai:'Doi',   tang:2, gia:900000,  trangThai:'dang-o',  tinhTrangDonDep:'sach', moTa:'Phòng đôi tiêu chuẩn' },
    { id:9,  soPhong:'301', loai:'VIP',   tang:3, gia:1500000, trangThai:'trong',   tinhTrangDonDep:'sach', moTa:'Phòng VIP, view toàn cảnh' },
    { id:10, soPhong:'302', loai:'VIP',   tang:3, gia:1500000, trangThai:'dang-o',  tinhTrangDonDep:'sach', moTa:'Phòng VIP kèm minibar, jacuzzi' },
    { id:11, soPhong:'303', loai:'VIP',   tang:3, gia:1600000, trangThai:'bao-tri', tinhTrangDonDep:'ban', moTa:'Đang bảo trì hệ thống điều hòa' },
    { id:12, soPhong:'401', loai:'Suite', tang:4, gia:3500000, trangThai:'dang-o',  tinhTrangDonDep:'sach', moTa:'Presidential Suite, phòng khách riêng' },
    { id:13, soPhong:'402', loai:'Suite', tang:4, gia:3500000, trangThai:'trong',   tinhTrangDonDep:'sach', moTa:'Suite cao cấp, view toàn cảnh TP' },
  ];
  // Khách hàng
  memKhachHangs = [
    { id:1, hoTen:'Nguyen Van An',  sdt:'0912345678', email:'an@gmail.com',    cmnd:'079100001234', quocTich:'Viet Nam',      soLanO:12, tongChiTieu:18400000, hang:'Vang',      ghiChu:'Khách thường xuyên, thích phòng tầng cao' },
    { id:2, hoTen:'Tran Thi Bich',  sdt:'0987654321', email:'bich@gmail.com',  cmnd:'079200005678', quocTich:'Viet Nam',      soLanO:7,  tongChiTieu:9200000,  hang:'Bac',       ghiChu:'' },
    { id:3, hoTen:'Le Van Cuong',   sdt:'0901234567', email:'cuong@gmail.com', cmnd:'079300009012', quocTich:'Viet Nam',      soLanO:24, tongChiTieu:52000000, hang:'Kim cuong', ghiChu:'Khách VIP, ưu tiên Suite' },
    { id:4, hoTen:'Pham Thi Dung',  sdt:'0908765432', email:'dung@gmail.com',  cmnd:'',             quocTich:'Viet Nam',      soLanO:3,  tongChiTieu:4600000,  hang:'Moi',       ghiChu:'' },
    { id:5, hoTen:'James Smith',    sdt:'+15550123',  email:'james@hotel.com', cmnd:'US123456',     quocTich:'United States', soLanO:5,  tongChiTieu:22500000, hang:'Vang',      ghiChu:'Khách quốc tế, nói tiếng Anh' },
  ];
  // Đặt phòng
  const today = new Date().toISOString().slice(0,10);
  const d2 = new Date(); d2.setDate(d2.getDate()+2);
  const d5 = new Date(); d5.setDate(d5.getDate()+5);
  const co2 = d2.toISOString().slice(0,10);
  const co5 = d5.toISOString().slice(0,10);
  memDatPhongs = [
    { id:1, khachHangId:1, phongId:2,  checkIn:today, checkOut:co2, trangThai:'dang-o', ghiChu:'Yêu cầu phòng yên tĩnh', tongTien:1200000 },
    { id:2, khachHangId:2, phongId:5,  checkIn:today, checkOut:co5, trangThai:'dang-o', ghiChu:'',                        tongTien:4500000 },
    { id:3, khachHangId:3, phongId:10, checkIn:today, checkOut:co5, trangThai:'dang-o', ghiChu:'Khách VIP, chuẩn bị hoa quả', tongTien:7500000 },
    { id:4, khachHangId:4, phongId:8,  checkIn:today, checkOut:co2, trangThai:'da-dat', ghiChu:'',                        tongTien:1800000 },
    { id:5, khachHangId:5, phongId:12, checkIn:today, checkOut:co5, trangThai:'dang-o', ghiChu:'Late checkout request',  tongTien:17500000 },
    { id:6, khachHangId:1, phongId:4,  checkIn:new Date(Date.now()-86400000).toISOString().slice(0,10), checkOut:today, trangThai:'da-tra', ghiChu:'Khách check-out sớm', tongTien:1400000 },
  ];
  console.log('✅ Seed memory data xong!');

  // Expose memory data to app.locals for AI routes
  app.locals.memKhachHangs = memKhachHangs;
  app.locals.memDatPhongs  = memDatPhongs;
  app.locals.memPhongs     = memPhongs;
}

// ─── HELPERS ──────────────────────────────────────────────────────
function findUser(username)  { return memUsers.find(u => u.username === username); }
function findUserById(id)    { return memUsers.find(u => u.id === id); }

// ─── SSE REAL-TIME BROADCAST ──────────────────────────────────────
const sseClients = new Map(); // clientId → res
let _sseId = 0;

/**
 * Gửi sự kiện SSE tới tất cả client đang kết nối
 * @param {string} type  - Loại sự kiện: 'booking_update'|'room_update'|'ping'
 * @param {object} data  - Dữ liệu đính kèm
 */
function broadcast(type, data = {}) {
  const payload = JSON.stringify({ type, data, ts: Date.now() });
  for (const [id, client] of sseClients) {
    try {
      client.write(`event: ${type}\ndata: ${payload}\n\n`);
    } catch {
      sseClients.delete(id);
    }
  }
  if (sseClients.size > 0) {
    console.log(`📡 SSE broadcast [${type}] → ${sseClients.size} client(s)`);
  }
}

// ─── AUTH ROUTES ──────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Thiếu username/password' });

    let user;
    if (_dbMode === 'mysql') {
      user = await _models.User.findOne({ where: { username } });
    } else {
      user = findUser(username);
    }
    if (!user) return res.status(401).json({ error: 'Tài khoản không tồn tại' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Sai mật khẩu' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, hoTen: user.hoTen },
      JWT_SECRET, { expiresIn: '8h' }
    );
    res.json({ token, user: { id: user.id, username: user.username, hoTen: user.hoTen, role: user.role } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Lỗi server' }); }
});

app.get('/api/auth/me', authMW, (req, res) => res.json({ user: req.user }));
app.post('/api/auth/logout', (req, res) => res.json({ message: 'Đã đăng xuất' }));

// ─── PHONG ROUTES ─────────────────────────────────────────────────
app.get('/api/phong', authMW, async (req, res) => {
  try {
    if (_dbMode === 'mysql') {
      const list = await _models.Phong.findAll({ order: [['tang','ASC'],['soPhong','ASC']] });
      return res.json(list);
    }
    const sorted = [...memPhongs].sort((a,b) => a.tang - b.tang || a.soPhong.localeCompare(b.soPhong));
    res.json(sorted);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/phong', authMW, adminMW, async (req, res) => {
  try {
    let p;
    if (_dbMode === 'mysql') {
      p = await _models.Phong.create(req.body);
    } else {
      p = { id: nextId('phong'), ...req.body };
      memPhongs.push(p);
    }
    broadcast('room_update', { action: 'create', room: { id: p.id, soPhong: p.soPhong, trangThai: p.trangThai } });
    res.status(201).json(p);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
app.put('/api/phong/:id', authMW, adminMW, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    let p;
    if (_dbMode === 'mysql') {
      p = await _models.Phong.findByPk(id);
      if (!p) return res.status(404).json({ error: 'Không tìm thấy phòng' });
      await p.update(req.body);
    } else {
      const idx = memPhongs.findIndex(p => p.id === id);
      if (idx < 0) return res.status(404).json({ error: 'Không tìm thấy phòng' });
      memPhongs[idx] = { ...memPhongs[idx], ...req.body };
      p = memPhongs[idx];
    }
    broadcast('room_update', { action: 'update', room: { id: p.id, soPhong: p.soPhong || req.body.soPhong, trangThai: p.trangThai || req.body.trangThai } });
    res.json(p);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
app.delete('/api/phong/:id', authMW, adminMW, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (_dbMode === 'mysql') {
      const p = await _models.Phong.findByPk(id);
      if (!p) return res.status(404).json({ error: 'Không tìm thấy' });
      await p.destroy();
    } else {
      memPhongs = memPhongs.filter(p => p.id !== id);
    }
    broadcast('room_update', { action: 'delete', room: { id } });
    res.json({ message: 'Đã xóa phòng' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/phong/:id/don-dep', authMW, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { tinhTrangDonDep } = req.body;
    let p;
    if (_dbMode === 'mysql') {
      p = await _models.Phong.findByPk(id);
      if (!p) return res.status(404).json({ error: 'Không tìm thấy phòng' });
      await p.update({ tinhTrangDonDep });
    } else {
      const idx = memPhongs.findIndex(x => x.id === id);
      if (idx < 0) return res.status(404).json({ error: 'Không tìm thấy phòng' });
      memPhongs[idx].tinhTrangDonDep = tinhTrangDonDep;
      p = memPhongs[idx];
    }
    broadcast('room_update', { action: 'update', room: p });
    res.json(p);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── KHACH HANG ROUTES ────────────────────────────────────────────
app.get('/api/khach-hang', authMW, async (req, res) => {
  try {
    if (_dbMode === 'mysql') return res.json(await _models.KhachHang.findAll({ order: [['createdAt','DESC']] }));
    res.json([...memKhachHangs].reverse());
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/khach-hang', authMW, adminMW, async (req, res) => {
  try {
    if (_dbMode === 'mysql') return res.status(201).json(await _models.KhachHang.create(req.body));
    const kh = { id: nextId('kh'), soLanO:0, tongChiTieu:0, hang:'Moi', ...req.body };
    memKhachHangs.push(kh);
    res.status(201).json(kh);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
app.put('/api/khach-hang/:id', authMW, adminMW, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (_dbMode === 'mysql') {
      const kh = await _models.KhachHang.findByPk(id);
      if (!kh) return res.status(404).json({ error: 'Không tìm thấy' });
      await kh.update(req.body); return res.json(kh);
    }
    const idx = memKhachHangs.findIndex(k => k.id === id);
    if (idx < 0) return res.status(404).json({ error: 'Không tìm thấy' });
    memKhachHangs[idx] = { ...memKhachHangs[idx], ...req.body };
    res.json(memKhachHangs[idx]);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
app.delete('/api/khach-hang/:id', authMW, adminMW, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (_dbMode === 'mysql') {
      const kh = await _models.KhachHang.findByPk(id);
      if (!kh) return res.status(404).json({ error: 'Không tìm thấy' });
      await kh.destroy(); return res.json({ message: 'Đã xóa' });
    }
    memKhachHangs = memKhachHangs.filter(k => k.id !== id);
    res.json({ message: 'Đã xóa' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── DAT PHONG ROUTES ─────────────────────────────────────────────
app.get('/api/dat-phong', authMW, async (req, res) => {
  try {
    if (_dbMode === 'mysql') {
      const { Sequelize } = require('sequelize');
      const list = await _models.DatPhong.findAll({
        include: [
          { model: _models.KhachHang, as: 'khachHang', attributes: ['id','hoTen','sdt','email'] },
          { model: _models.Phong,     as: 'phong',     attributes: ['id','soPhong','loai','tang','gia'] },
        ],
        order: [['createdAt','DESC']],
      });
      return res.json(list);
    }
    // Memory: join manually
    const result = memDatPhongs.map(dp => ({
      ...dp,
      khachHang: memKhachHangs.find(k => k.id === dp.khachHangId) || null,
      phong:     memPhongs.find(p => p.id === dp.phongId) || null,
    }));
    res.json(result.reverse());
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/dat-phong', authMW, async (req, res) => {
  try {
    let dp;
    if (_dbMode === 'mysql') {
      dp = await _models.DatPhong.create(req.body);
    } else {
      dp = { id: nextId('dp'), trangThai:'da-dat', ghiChu:'', tongTien:0, ...req.body };
      memDatPhongs.push(dp);
    }
    broadcast('booking_update', {
      action: 'create',
      booking: { id: dp.id, khachHangId: dp.khachHangId, phongId: dp.phongId, trangThai: dp.trangThai, checkIn: dp.checkIn, checkOut: dp.checkOut },
    });
    broadcast('room_update', { action: 'sync' });
    res.status(201).json(dp);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
app.put('/api/dat-phong/:id', authMW, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    let dp;
    if (_dbMode === 'mysql') {
      dp = await _models.DatPhong.findByPk(id);
      if (!dp) return res.status(404).json({ error: 'Không tìm thấy' });
      if (req.body.trangThai === 'da-tra' && dp.trangThai !== 'da-tra') {
        req.body.checkOut = new Date().toISOString().slice(0, 10);
      }
      await dp.update(req.body);
    } else {
      const idx = memDatPhongs.findIndex(d => d.id === id);
      if (idx < 0) return res.status(404).json({ error: 'Không tìm thấy' });
      
      if (req.body.trangThai === 'da-tra' && memDatPhongs[idx].trangThai !== 'da-tra') {
        req.body.checkOut = new Date().toISOString().slice(0, 10);
      }
      
      memDatPhongs[idx] = { ...memDatPhongs[idx], ...req.body };
      dp = memDatPhongs[idx];
      // Tự cập nhật trạng thái phòng khi đặt phòng thay đổi
      if (req.body.trangThai) {
        const map = { 'dang-o':'dang-o', 'da-tra':'don-dep', 'huy':'trong' };
        const phongIdx = memPhongs.findIndex(p => p.id === dp.phongId);
        if (phongIdx >= 0 && map[req.body.trangThai]) {
          memPhongs[phongIdx].trangThai = map[req.body.trangThai];
        }
      }
    }
    broadcast('booking_update', {
      action: 'update',
      booking: { id: dp.id, khachHangId: dp.khachHangId, phongId: dp.phongId, trangThai: dp.trangThai || req.body.trangThai },
    });
    broadcast('room_update', { action: 'sync' });
    res.json(dp);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
app.delete('/api/dat-phong/:id', authMW, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (_dbMode === 'mysql') {
      const dp = await _models.DatPhong.findByPk(id);
      if (!dp) return res.status(404).json({ error: 'Không tìm thấy' });
      await dp.destroy();
    } else {
      memDatPhongs = memDatPhongs.filter(d => d.id !== id);
    }
    broadcast('booking_update', { action: 'delete', booking: { id } });
    res.json({ message: 'Đã xóa đặt phòng' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// ─── AI CHAT ACTIVE BOOKINGS ROUTE (Real-time từ Menu Đặt phòng) ───
app.get('/api/ai-chat/active-bookings', async (req, res) => {
  try {
    if (_dbMode === 'mysql') {
      const list = await _models.DatPhong.findAll({
        where: { trangThai: 'dang-o' },
        include: [
          { model: _models.KhachHang, as: 'khachHang', attributes: ['id', 'hoTen', 'sdt', 'hang', 'soLanO', 'tongChiTieu'] },
          { model: _models.Phong,     as: 'phong',     attributes: ['id', 'soPhong', 'loai', 'tang'] }
        ],
        order: [['id', 'DESC']]
      });
      return res.json(list.map(b => ({
        bookingId: b.id,
        customerId: b.khachHangId,
        guestName: b.khachHang?.hoTen || `Khách #${b.khachHangId}`,
        phone: b.khachHang?.sdt || '',
        roomNumber: b.phong?.soPhong || '',
        roomType: b.phong?.loai || '',
        tang: b.phong?.tang || 1,
        hang: b.khachHang?.hang || 'Mới',
        checkIn: b.checkIn,
        checkOut: b.checkOut
      })));
    }

    // In-memory mode fallback
    const list = memDatPhongs.filter(d => d.trangThai === 'dang-o').map(d => {
      const kh = memKhachHangs.find(k => k.id === d.khachHangId);
      const p  = memPhongs.find(item => item.id === d.phongId);
      return {
        bookingId: d.id,
        customerId: d.khachHangId,
        guestName: kh?.hoTen || `Khách #${d.khachHangId}`,
        phone: kh?.sdt || '',
        roomNumber: p?.soPhong || '',
        roomType: p?.loai || '',
        tang: p?.tang || 1,
        hang: kh?.hang || 'Mới',
        checkIn: d.checkIn,
        checkOut: d.checkOut
      };
    });
    res.json(list.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AI CHAT ROUTE ────────────────────────────────────────────────
app.post('/api/ai-chat', async (req, res) => {
  try {
    const { message, history, customerId, roomNumber, mode } = req.body;
    if (!message) return res.status(400).json({ error: 'Thiếu tin nhắn' });
    try {
      const { generateResponse } = require('./services/troLyAiService');

      let customerInfo = null;

      // ─── XÁC THỰC CÁ NHÂN HÓA THEO REAL-TIME MENU ĐẶT PHÒNG ─────────
      if (mode === 'customer' || mode === 'personal') {
        const id = parseInt(customerId);
        const roomInput = String(roomNumber || '').trim();

        if (!id || !roomInput) {
          const refuseMsg = `⚠️ **Yêu cầu xác thực phòng lưu trú:**\n\nĐể sử dụng Trợ lý AI ở chế độ Cá nhân hóa, quý khách vui lòng nhập đầy đủ cả **ID Khách hàng / Mã đặt phòng** và **Số phòng đang ở** (Ví dụ: ID 7 - Phòng 104, hoặc Mã ĐP 10 - Phòng 104).\n\n🔒 *Vì lý do bảo mật và quyền riêng tư, hệ thống chỉ hỗ trợ khi xác thực đúng số phòng khách đang ở theo thời gian thực.*`;
          return res.json({
            verified: false,
            response: refuseMsg,
            allAnswers: [
              { name: 'Gemini (Google)', text: refuseMsg },
              { name: 'ChatGPT (OpenAI)', text: refuseMsg }
            ],
            sources: [],
            ragUsed: false
          });
        }

        let matchedBooking = null;
        let kh = null;
        let phong = null;

        if (_dbMode === 'mysql') {
          const { Sequelize } = require('sequelize');

          // 1. Tìm tất cả đơn đặt phòng đang ở ('dang-o') khớp với id (là Mã Đặt Phòng HOẶC ID Khách Hàng)
          const activeBookings = await _models.DatPhong.findAll({
            where: {
              [Sequelize.Op.or]: [
                { id: id },
                { khachHangId: id }
              ],
              trangThai: 'dang-o'
            },
            include: [
              { model: _models.KhachHang, as: 'khachHang' },
              { model: _models.Phong,     as: 'phong' }
            ]
          });

          // 2. Nếu không tìm thấy lượt đang ở nào với ID này
          if (!activeBookings || activeBookings.length === 0) {
            // Kiểm tra xem ID có tồn tại ở trạng thái khác không (đã trả phòng hoặc chưa nhận phòng)
            const pastOrFutureBooking = await _models.DatPhong.findOne({
              where: {
                [Sequelize.Op.or]: [
                  { id: id },
                  { khachHangId: id }
                ]
              },
              include: [
                { model: _models.KhachHang, as: 'khachHang' },
                { model: _models.Phong,     as: 'phong' }
              ],
              order: [['id', 'DESC']]
            });

            if (pastOrFutureBooking) {
              const statusName = pastOrFutureBooking.trangThai === 'da-tra' ? 'đã thanh toán & trả phòng' : (pastOrFutureBooking.trangThai === 'da-dat' ? 'đang ở trạng thái ĐÃ ĐẶT (chưa nhận phòng)' : 'đã hủy');
              const guestName = pastOrFutureBooking.khachHang?.hoTen || `Khách #${id}`;
              const refuseMsg = `⛔ **Xác thực lưu trú không thành công:**\n\nKhách hàng **${guestName}** (Đơn #${pastOrFutureBooking.id}) hiện **${statusName}**, không có phòng nào ở trạng thái **Đang lưu trú ('dang-o')** tại khách sạn.\n\n🔒 *Trợ lý AI tuân thủ bảo mật tuyệt đối: Chỉ hỗ trợ giải đáp cá nhân hóa cho khách hàng hiện đang lưu trú tại khách sạn.*`;
              return res.json({
                verified: false,
                response: refuseMsg,
                allAnswers: [
                  { name: 'Gemini (Google)', text: refuseMsg },
                  { name: 'ChatGPT (OpenAI)', text: refuseMsg }
                ],
                sources: [],
                ragUsed: false
              });
            }

            const refuseMsg = `⛔ **Không tìm thấy dữ liệu đặt phòng:**\n\nKhông tìm thấy Mã đặt phòng hoặc ID Khách hàng **#${id}** trên hệ thống quản lý khách sạn.\n\n🔒 *Trợ lý AI từ chối trả lời câu hỏi cá nhân hóa do chưa xác minh được thông tin khách.*`;
            return res.json({
              verified: false,
              response: refuseMsg,
              allAnswers: [
                { name: 'Gemini (Google)', text: refuseMsg },
                { name: 'ChatGPT (OpenAI)', text: refuseMsg }
              ],
              sources: [],
              ragUsed: false
            });
          }

          // 3. Có phòng đang ở: Kiểm tra số phòng nhập vào
          for (const b of activeBookings) {
            if (b.phong && String(b.phong.soPhong).trim().toLowerCase() === roomInput.toLowerCase()) {
              matchedBooking = b;
              kh = b.khachHang;
              phong = b.phong;
              break;
            }
          }

          if (!matchedBooking) {
            const guestName = activeBookings[0].khachHang?.hoTen || `Khách #${id}`;
            const actualRooms = activeBookings.map(b => b.phong?.soPhong).filter(Boolean).join(', ');
            const refuseMsg = `⛔ **Số phòng không trùng khớp:**\n\nKhách hàng **${guestName}** (ID #${activeBookings[0].khachHangId}) hiện đang lưu trú tại phòng **${actualRooms}**, **KHÔNG PHẢI** phòng **${roomInput}**!\n\n🔒 *Vì lý do an ninh và bảo mật thông tin lưu trú, Trợ lý AI tuyệt đối không trả lời câu hỏi khi số phòng cung cấp không khớp với hệ thống đặt phòng thời gian thực.*`;
            return res.json({
              verified: false,
              response: refuseMsg,
              allAnswers: [
                { name: 'Gemini (Google)', text: refuseMsg },
                { name: 'ChatGPT (OpenAI)', text: refuseMsg }
              ],
              sources: [],
              ragUsed: false
            });
          }

        } else {
          // In-memory mode
          const activeBookings = memDatPhongs
            .filter(d => (d.id === id || d.khachHangId === id) && d.trangThai === 'dang-o')
            .map(d => ({
              ...d,
              khachHang: memKhachHangs.find(k => k.id === d.khachHangId),
              phong: memPhongs.find(p => p.id === d.phongId)
            }));

          if (!activeBookings || activeBookings.length === 0) {
            const refuseMsg = `⛔ **Xác thực lưu trú không thành công:**\n\nKhông tìm thấy đơn đặt phòng đang ở ('dang-o') cho ID **#${id}** trong hệ thống đặt phòng.\n\n🔒 *Trợ lý AI từ chối trả lời câu hỏi cá nhân hóa do chưa xác minh được phòng đang ở theo thời gian thực.*`;
            return res.json({
              verified: false,
              response: refuseMsg,
              allAnswers: [
                { name: 'Gemini (Google)', text: refuseMsg },
                { name: 'ChatGPT (OpenAI)', text: refuseMsg }
              ],
              sources: [],
              ragUsed: false
            });
          }

          for (const b of activeBookings) {
            if (b.phong && String(b.phong.soPhong).trim().toLowerCase() === roomInput.toLowerCase()) {
              matchedBooking = b;
              kh = b.khachHang;
              phong = b.phong;
              break;
            }
          }

          if (!matchedBooking) {
            const guestName = activeBookings[0].khachHang?.hoTen || `Khách #${id}`;
            const actualRooms = activeBookings.map(b => b.phong?.soPhong).filter(Boolean).join(', ');
            const refuseMsg = `⛔ **Số phòng không trùng khớp:**\n\nKhách hàng **${guestName}** hiện đang ở phòng **${actualRooms}**, **KHÔNG PHẢI** phòng **${roomInput}**!\n\n🔒 *Trợ lý AI từ chối trả lời do không khớp số phòng lưu trú thực tế.*`;
            return res.json({
              verified: false,
              response: refuseMsg,
              allAnswers: [
                { name: 'Gemini (Google)', text: refuseMsg },
                { name: 'ChatGPT (OpenAI)', text: refuseMsg }
              ],
              sources: [],
              ragUsed: false
            });
          }
        }

        // Xác thực thành công: Gán thông tin khách hàng đầy đủ
        customerInfo = {
          id: kh ? kh.id : matchedBooking.khachHangId,
          bookingId: matchedBooking.id,
          hoTen: kh ? kh.hoTen : `Khách #${matchedBooking.khachHangId}`,
          hang: (kh && kh.hang) ? kh.hang : 'Mới',
          soLanO: (kh && kh.soLanO) ? kh.soLanO : 1,
          tongChiTieu: (kh && kh.tongChiTieu) ? kh.tongChiTieu : matchedBooking.tongTien,
          soPhong: phong ? phong.soPhong : roomInput,
          loaiPhong: phong ? phong.loai : 'Tiêu chuẩn',
          tang: phong ? phong.tang : 1,
          checkIn: matchedBooking.checkIn,
          checkOut: matchedBooking.checkOut,
          ghiChu: (kh && kh.ghiChu) || matchedBooking.ghiChu || '',
          phongHienTai: `${phong ? phong.loai : ''} - Phòng ${phong ? phong.soPhong : roomInput} (Tầng ${phong ? phong.tang : 1})`,
          verified: true
        };
      }
      // ─── Lấy thông tin Real-time của Khách sạn (Thống kê + Danh sách khách đang ở) ───────
      let dpList = [], pList = [], khList = [];
      if (_dbMode === 'mysql') {
        dpList = await _models.DatPhong.findAll();
        pList  = await _models.Phong.findAll();
        khList = await _models.KhachHang.findAll();
      } else {
        dpList = memDatPhongs;
        pList  = memPhongs;
        khList = memKhachHangs;
      }
      const today = new Date().toISOString().slice(0, 10);
      let doanhThuHomNay = 0;
      let phongDangO = 0;
      let phongTrong = 0;
      let khachDangO = 0;
      
      dpList.forEach(dp => {
        if (dp.trangThai === 'da-tra' && dp.checkOut === today) {
          doanhThuHomNay += Number(dp.tongTien) || 0;
        }
        if (dp.trangThai === 'dang-o') khachDangO++;
      });
      pList.forEach(p => {
        if (p.trangThai === 'dang-o') phongDangO++;
        else if (p.trangThai === 'trong') phongTrong++;
      });

      // Danh sách chi tiết từng khách đang lưu trú — cho AI tra cứu real-time
      const currentGuests = dpList
        .filter(dp => dp.trangThai === 'dang-o')
        .map(dp => {
          const kh    = khList.find(k => k.id === (dp.khachHangId ?? dp.khachHang?.id));
          const phong = pList.find(p  => p.id  === (dp.phongId    ?? dp.phong?.id));
          return {
            bookingId : dp.id,
            soPhong   : phong?.soPhong   || dp.phong?.soPhong   || '?',
            loaiPhong : phong?.loai      || dp.phong?.loai      || 'Tiêu chuẩn',
            tang      : phong?.tang      || dp.phong?.tang      || 1,
            hoTen     : kh?.hoTen        || dp.khachHang?.hoTen || `Khách #${dp.khachHangId}`,
            sdt       : kh?.sdt          || dp.khachHang?.sdt   || '',
            cmnd      : kh?.cmnd         || dp.khachHang?.cmnd  || '',
            quocTich  : kh?.quocTich     || dp.khachHang?.quocTich || 'Viet Nam',
            hang      : kh?.hang         || dp.khachHang?.hang  || 'Mới',
            soLanO    : kh?.soLanO       || dp.khachHang?.soLanO || 1,
            checkIn   : dp.checkIn,
            checkOut  : dp.checkOut,
            tongTien  : dp.tongTien,
            ghiChu    : dp.ghiChu || kh?.ghiChu || '',
          };
        })
        .sort((a, b) => String(a.soPhong).localeCompare(String(b.soPhong), 'vi'));

      const hotelRealtimeStats = {
        doanhThuHomNay,
        phongDangO,
        phongTrong,
        khachDangO,
        tongSoPhong: pList.length,
        thoiGianHienTai: new Date().toLocaleString('vi-VN'),
        currentGuests,  // ← Danh sách khách đang ở (chi tiết) cho AI tra cứu real-time
      };

      const chatMode = ['customer', 'staff', 'general'].includes(mode) ? mode : 'general';
      const result   = await generateResponse(message, undefined, history, customerInfo, chatMode, hotelRealtimeStats);

      // Hỗ trợ cả response dạng cũ (string) và mới (object)
      if (typeof result === 'string') {
        return res.json({ response: result, sources: [], ragUsed: false, verified: !!customerInfo, customerInfo });
      }
      res.json({ ...result, verified: !!customerInfo, customerInfo });
    } catch (aiErr) {
      console.warn('AI service unavailable:', aiErr.message);
      res.json({ response: 'Xin lỗi, dịch vụ AI hiện không khả dụng. Vui lòng thử lại sau.', sources: [], ragUsed: false });
    }
  } catch (err) { console.error(err); res.status(500).json({ error: 'Lỗi server' }); }
});

// ─── RAGAS 5 METRICS EVALUATION ROUTE ─────────────────────────────────────────
app.post('/api/ai-chat/evaluate', async (req, res) => {
  try {
    const { question, answer, context, groundTruth, modelName } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'Thiếu dữ liệu để chấm điểm' });
    }
    const { evaluateRAG } = require('./services/troLyAiService');
    const result = await evaluateRAG(question, answer, context || "", groundTruth || "", modelName || "");
    res.json(result);
  } catch (evalErr) {
    console.error('RAGAS evaluate error:', evalErr.message);
    res.status(500).json({
      context_precision: 0,
      context_recall: 0,
      faithfulness: 0,
      response_relevancy: 0,
      answer_correctness: 0,
      overall_score: 0,
      reasoning: 'Lỗi máy chủ thẩm định RAG.'
    });
  }
});

// ─── SO SÁNH & ĐÁNH GIÁ ĐA GÓC CẠNH 2 MODEL (Gemini vs ChatGPT) ───────────────
app.post('/api/ai-chat/compare', async (req, res) => {
  try {
    const { question, answers, context, groundTruth } = req.body;
    if (!question || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Thiếu dữ liệu câu hỏi hoặc danh sách câu trả lời của model.' });
    }
    const { compareModels } = require('./services/troLyAiService');
    const result = await compareModels(question, answers, context || "", groundTruth || "");
    res.json(result);
  } catch (compErr) {
    console.error('Multi-angle compare error:', compErr.message);
    res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ khi đánh giá so sánh đa góc cạnh.'
    });
  }
});

// ─── RAGAS BATCH BENCHMARK ROUTE (Yêu cầu role admin) ──────────────────
app.get('/api/ai-chat/benchmark', authMW, async (req, res) => {
  // Chỉ cho phép admin
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Chỉ quản trị viên (admin) mới có quyền chạy benchmark.' });
  }
  try {
    const { runBatchBenchmark } = require('./evaluation/ragEvaluation');
    const result = await runBatchBenchmark();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── RAG ADMIN ROUTES ─────────────────────────────────────────────
app.use('/api/rag', require('./routes/ragRoutes'));

// ─── THONG KE ROUTES ──────────────────────────────────────────────
app.get('/api/thong-ke', authMW, async (req, res) => {
  try {
    let dpList = [], pList = [];
    if (_dbMode === 'mysql') {
      dpList = await _models.DatPhong.findAll();
      pList = await _models.Phong.findAll();
    } else {
      dpList = memDatPhongs;
      pList = memPhongs;
    }

    const today = new Date().toISOString().slice(0, 10);
    let doanhThuHomNay = 0;
    let phongDangO = 0;
    let khachDangO = 0;

    // Calculate basic stats
    dpList.forEach(dp => {
      if (dp.trangThai === 'da-tra' && dp.checkOut === today) {
        doanhThuHomNay += dp.tongTien;
      }
      if (dp.trangThai === 'dang-o') {
        khachDangO++;
      }
    });

    pList.forEach(p => {
      if (p.trangThai === 'dang-o') phongDangO++;
    });

    const congSuat = pList.length ? Math.round((phongDangO / pList.length) * 100) : 0;

    // Generate chart data for last 7 days (mocked based on total, or just fake some variance around real data to make it look good for the demo)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const shortDate = dateStr.slice(5).replace('-', '/');
      
      let dailyRev = 0;
      dpList.forEach(dp => {
        if (dp.checkOut === dateStr && (dp.trangThai === 'da-tra' || dp.trangThai === 'dang-o')) {
          dailyRev += dp.tongTien;
        }
      });
      // Thêm chút ngẫu nhiên để biểu đồ đẹp hơn nếu chưa có data thật
      if (dailyRev === 0) dailyRev = Math.floor(Math.random() * 5000000) + 2000000;

      chartData.push({
        name: shortDate,
        doanhThu: dailyRev
      });
    }

    res.json({
      doanhThuHomNay,
      congSuat,
      khachDangO,
      tongPhong: pList.length,
      chartData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SSE ENDPOINT ─────────────────────────────────────────────────
// Không cần auth header vì EventSource không hỗ trợ custom headers;
// dùng ?token= query param thay thế.
app.get('/api/events', (req, res) => {
  // Verify JWT từ query param
  const token = req.query.token;
  if (token) {
    try { jwt.verify(token, JWT_SECRET); }
    catch { return res.status(401).json({ error: 'Token không hợp lệ' }); }
  }

  // SSE headers
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Tắt nginx buffering nếu có
  res.flushHeaders();

  const clientId = ++_sseId;
  sseClients.set(clientId, res);
  console.log(`🔌 SSE client #${clientId} kết nối. Tổng: ${sseClients.size}`);

  // Gửi sự kiện kết nối đầu tiên
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, ts: Date.now() })}\n\n`);

  // Keepalive ping mỗi 25 giây để tránh timeout
  const keepalive = setInterval(() => {
    try {
      res.write(`event: ping\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);
    } catch {
      clearInterval(keepalive);
      sseClients.delete(clientId);
    }
  }, 25000);

  // Cleanup khi client ngắt kết nối
  req.on('close', () => {
    clearInterval(keepalive);
    sseClients.delete(clientId);
    console.log(`🔌 SSE client #${clientId} ngắt kết nối. Tổng: ${sseClients.size}`);
  });
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: _dbMode, port: PORT, timestamp: new Date().toISOString(), sseClients: sseClients.size });
});

app.get('/', (req, res) => {
  res.json({ message: 'Grand Palace PMS API', mode: _dbMode, port: PORT });
});

// ─── KHỞI ĐỘNG ────────────────────────────────────────────────────
(async () => {
  // Luôn seed memory data trước
  await seedMemory();

  // ─── Khởi tạo RAG index ──────────────────────────────────────────
  ragService.buildIndex();

  // Thử kết nối MySQL (không bắt buộc)
  try {
    const { Sequelize, DataTypes } = require('sequelize');
    const seq = new Sequelize(
      process.env.DB_NAME || 'qlykhachsan',
      process.env.DB_USER || 'root',
      process.env.DB_PASS || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        dialect: 'mysql',
        logging: false,
        pool: { max:5, min:0, acquire:5000, idle:3000 },
        dialectOptions: { connectTimeout: 5000 },
      }
    );
    await seq.authenticate();
    console.log('✅ Kết nối MySQL thành công! Đang dùng MySQL mode.');

    // Định nghĩa models
    const User = seq.define('User', {
      id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      password: { type: DataTypes.STRING(255), allowNull: false },
      hoTen:    { type: DataTypes.STRING(100), defaultValue: '' },
      role:     { type: DataTypes.ENUM('admin','staff'), defaultValue: 'staff' },
    }, { tableName: 'users' });

    const Phong = seq.define('Phong', {
      id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      soPhong:   { type: DataTypes.STRING(10), allowNull: false, unique: true },
      loai:      { type: DataTypes.ENUM('Don','Doi','VIP','Suite'), allowNull: false },
      tang:      { type: DataTypes.INTEGER, defaultValue: 1 },
      gia:       { type: DataTypes.BIGINT, allowNull: false },
      trangThai: { type: DataTypes.ENUM('trong','dang-o','don-dep','bao-tri'), defaultValue: 'trong' },
      tinhTrangDonDep: { type: DataTypes.ENUM('sach','ban','dang-don'), defaultValue: 'sach' },
      moTa:      { type: DataTypes.TEXT, defaultValue: '' },
    }, { tableName: 'phongs' });

    const KhachHang = seq.define('KhachHang', {
      id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      hoTen:       { type: DataTypes.STRING(100), allowNull: false },
      sdt:         { type: DataTypes.STRING(20), allowNull: false },
      email:       { type: DataTypes.STRING(100), defaultValue: '' },
      cmnd:        { type: DataTypes.STRING(20), defaultValue: '' },
      quocTich:    { type: DataTypes.STRING(50), defaultValue: 'Viet Nam' },
      soLanO:      { type: DataTypes.INTEGER, defaultValue: 0 },
      tongChiTieu: { type: DataTypes.BIGINT, defaultValue: 0 },
      hang:        { type: DataTypes.ENUM('Moi','Bac','Vang','Kim cuong'), defaultValue: 'Moi' },
      ghiChu:      { type: DataTypes.TEXT, defaultValue: '' },
    }, { tableName: 'khach_hangs' });

    const DatPhong = seq.define('DatPhong', {
      id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      khachHangId: { type: DataTypes.INTEGER, allowNull: false },
      phongId:     { type: DataTypes.INTEGER, allowNull: false },
      checkIn:     { type: DataTypes.DATEONLY, allowNull: false },
      checkOut:    { type: DataTypes.DATEONLY, allowNull: false },
      trangThai:   { type: DataTypes.ENUM('da-dat','dang-o','da-tra','huy'), defaultValue: 'da-dat' },
      ghiChu:      { type: DataTypes.TEXT, defaultValue: '' },
      tongTien:    { type: DataTypes.BIGINT, defaultValue: 0 },
    }, { tableName: 'dat_phongs' });

    DatPhong.belongsTo(KhachHang, { foreignKey: 'khachHangId', as: 'khachHang' });
    DatPhong.belongsTo(Phong,     { foreignKey: 'phongId',     as: 'phong' });

    // Tạo DB nếu chưa có
    try {
      const mysql2 = require('mysql2/promise');
      const tmp = await mysql2.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        connectTimeout: 5000,
      });
      const dbName = process.env.DB_NAME || 'hotel_management';
      await tmp.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      await tmp.end();
    } catch(e) { console.warn('⚠️ Không tạo được database:', e.message); }

    await seq.sync();
    console.log('✅ Đồng bộ bảng MySQL xong!');

    _seq    = seq;
    _models = { User, Phong, KhachHang, DatPhong };
    _dbMode = 'mysql';

    // Seed MySQL accounts
    await User.findOrCreate({
      where: { username: 'admin' },
      defaults: { password: await bcrypt.hash('admin123', 10), hoTen: 'Quản trị viên', role: 'admin' },
    });
    await User.findOrCreate({
      where: { username: 'staff' },
      defaults: { password: await bcrypt.hash('staff123', 10), hoTen: 'Nhân viên', role: 'staff' },
    });
    console.log('✅ Seed MySQL tài khoản xong!');

  } catch (dbErr) {
    console.warn('⚠️ Không kết nối được MySQL:', dbErr.message);
    console.log('🔄 Chạy ở chế độ IN-MEMORY (không cần MySQL)');
    _dbMode = 'memory';
  }

  // Luôn lắng nghe port 5001 dù MySQL có hay không
  app.listen(PORT, () => {
    console.log(`\n🚀 Grand Palace PMS Backend đang chạy!`);
    console.log(`   URL    : http://localhost:${PORT}`);
    console.log(`   Mode   : ${_dbMode.toUpperCase()}`);
    console.log(`   Health : http://localhost:${PORT}/api/health`);
    console.log(`   Login  : admin/admin123  hoặc  staff/staff123\n`);
  });
})();

module.exports = app;