# 🏨 Hệ Thống Quản Lý Khách Sạn Thông Minh

Ứng dụng quản lý khách sạn hiện đại với React + Express.js + MySQL

## � Cách Nhanh Nhất: Docker (Không Cần Cài MySQL)

> Chỉ cần cài **Docker Desktop** là chạy được ngay, không cần cài MySQL thủ công.

### **[Option 1] Chạy Bằng Docker Compose**

```bash
# 1. Cài Docker Desktop: https://www.docker.com/products/docker-desktop

# 2. Mở terminal tại thư mục gốc (QlyKHachSan/)
docker-compose up --build
```

**Xong!** Docker sẽ tự:

- ✅ Tạo MySQL container
- ✅ Tạo database `hotel_management`
- ✅ Chạy backend trên port 5050
- ✅ Seed dữ liệu mẫu (16 phòng)

**Dừng app:**

```bash
docker-compose down
```

**Xóa sạch data (reset):**

```bash
docker-compose down -v
```

Sau khi backend chạy, khởi động frontend bằng cách:

```bash
cd frontend
npm install
npm run dev
```

Truy cập: http://localhost:5173

---

### **[Option 2] Export SQL Dump (Gửi File Database)**

Nếu muốn gửi nguyên database hiện có (kèm dữ liệu thật):

```bash
# Trên máy có MySQL, export:
mysqldump -u root -p hotel_management > hotel_dump.sql

# Người nhận import vào MySQL local:
mysql -u root -p hotel_management < hotel_dump.sql
```

---

## 📋 Yêu Cầu Hệ Thống (Không Dùng Docker)

- **Node.js** v18+
- **MySQL** v8.0+
- **npm** hoặc **yarn**

---

## 🚀 Hướng Dẫn Setup Thủ Công

### **1️⃣ Chuẩn Bị Môi Trường**

#### **A. Cài MySQL & Tạo Database**

```bash
# Trên Windows, dùng MySQL Command Line Client
mysql -u root -p

# Tạo database
CREATE DATABASE hotel_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Thoát
exit
```

#### **B. Clone/Giải Nén Project**

```bash
cd QlyKHachSan
```

---

### **2️⃣ Setup Backend**

```bash
cd backend

# 1. Cài dependencies
npm install

# 2. Tạo file .env (nếu chưa có)
# Copy từ .env.example hoặc tạo thủ công
cp .env.example .env

# 3. Mở .env và cấu hình:
# PORT=5050
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=<your_mysql_password>
# DB_NAME=hotel_management
```

#### **Cấu Hình Chi Tiết .env**

```dotenv
PORT=5050
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=hotel_management
DB_USER=root
DB_PASSWORD=your_mysql_password_here  # ⚠️ ĐỔI THÀNH MẬT KHẨU CỦA BẠN

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRE=30d

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:4200

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

#### **Tạo Dữ Liệu Mẫu**

```bash
# Chạy seed để khởi tạo phòng, loại phòng, v.v
node seed.js

# Output sẽ hiển thị:
# ✓ Đã tạo 3 loại phòng
# ✓ Đã tạo 16 phòng
# ✅ HOÀN THÀNH! Dữ liệu mẫu đã sẵn sàng
```

#### **Khởi Chạy Server**

```bash
# Development (có auto-reload)
npm run dev

# Production
npm start

# Server sẽ chạy tại http://localhost:5050
```

---

### **3️⃣ Setup Frontend**

```bash
cd ../frontend

# 1. Cài dependencies
npm install

# 2. Tạo file .env (nếu chưa có)
cp .env.example .env

# 3. Kiểm tra .env
# VITE_API_URL=http://localhost:5050/api
```

#### **Khởi Chạy Frontend**

```bash
# Development (Vite dev server)
npm run dev

# Build production
npm run build

# Preview production build
npm run preview

# Frontend sẽ chạy tại http://localhost:5173
```

---

## 📊 Dữ Liệu Mẫu Được Tạo

### **Loại Phòng**

| Tên      | Giá       | Diện Tích | Max Khách | Tiện Nghi                                             |
| -------- | --------- | --------- | --------- | ----------------------------------------------------- |
| Standard | 650k/đêm  | 25m²      | 2         | WiFi, A/C, TV 32", Mini bar                           |
| Deluxe   | 1.2tr/đêm | 35m²      | 2         | WiFi, A/C, TV 43", Mini bar, Ban công                 |
| Suite    | 2tr/đêm   | 50m²      | 4         | WiFi, A/C, TV 55", Mini bar, Bồn tắm nằm, Phòng khách |

### **Phòng**

- **8 phòng Standard** (Tầng 2: 201-208)
- **5 phòng Deluxe** (Tầng 3: 301-305)
- **3 phòng Suite** (Tầng 4: 401-403)
- **Tổng: 16 phòng** sẵn sàng cho khách đặt

---

## 🔐 Tài Khoản Mặc Định

Hiện tại chưa có tài khoản mặc định. Bạn cần:

### **Tạo Admin Account**

1. **Mở Postman** hoặc **cURL** để call API:

```bash
POST http://localhost:5050/api/auth/dang-ky
Content-Type: application/json

{
  "hoTen": "Admin",
  "tenDangNhap": "admin",
  "email": "admin@hotel.com",
  "matKhau": "admin123",
  "soDienThoai": "0123456789",
  "vaiTro": "admin"
}
```

2. **Hoặc dùng giao diện:** Truy cập `/admin/dang-nhap` → Đăng ký tài khoản

---

## 🌐 Truy Cập Ứng Dụng

### **Khách Hàng**

- **Homepage**: http://localhost:5173
- **Đăng nhập**: http://localhost:5173/dang-nhap
- **Đăng ký**: http://localhost:5173/dang-ky
- **Danh sách phòng**: http://localhost:5173/phong

### **Quản Lý**

- **Admin Panel**: http://localhost:5173/admin
- **Đăng nhập Admin**: http://localhost:5173/admin/dang-nhap

---

## 📁 Cấu Trúc Project

```
QlyKHachSan/
├── backend/
│   ├── src/
│   │   ├── config/       (Database config)
│   │   ├── controllers/  (API handlers)
│   │   ├── models/       (Sequelize models)
│   │   ├── routes/       (API routes)
│   │   ├── services/     (Business logic)
│   │   ├── middlewares/  (Auth, validation)
│   │   ├── utils/        (Helpers)
│   │   └── server.js     (Entry point)
│   ├── .env             (Environment variables)
│   ├── .env.example     (Template)
│   ├── seed.js          (Sample data generator)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/  (React components)
│   │   ├── pages/       (Page components)
│   │   ├── services/    (API client)
│   │   ├── utils/       (Helpers)
│   │   ├── App.jsx      (Main app)
│   │   └── index.css    (Tailwind CSS)
│   ├── .env             (Environment variables)
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## 🔧 Troubleshooting

### **❌ "Cannot connect to database"**

- ✅ Kiểm tra MySQL đang chạy: `mysql -u root -p`
- ✅ Kiểm tra `.env` có đúng password không
- ✅ Tạo database: `CREATE DATABASE hotel_management;`

### **❌ "Port 5050 already in use"**

- ✅ Thay `PORT` trong `.env` thành port khác (5051, 5052, ...)
- ✅ Hoặc kill process: `lsof -i :5050` (macOS/Linux) hoặc `netstat -ano | findstr :5050` (Windows)

### **❌ "Seed failed"**

- ✅ Database đã tồn tại bảng? Xóa và tạo lại:

```bash
mysql -u root -p
DROP DATABASE hotel_management;
CREATE DATABASE hotel_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit
node seed.js
```

### **❌ Frontend không kết nối backend**

- ✅ Kiểm tra `frontend/.env`: `VITE_API_URL=http://localhost:5050/api`
- ✅ Kiểm tra backend đang chạy: curl `http://localhost:5050/api`
- ✅ CORS có enable không: Check `backend/.env` `ALLOWED_ORIGINS`

---

## 📱 Chức Năng Chính

### **🔐 Khách Hàng**

- ✅ Đăng ký / Đăng nhập
- ✅ Xem danh sách phòng
- ✅ Xem chi tiết phòng
- ✅ **Đặt phòng** với:
  - Real-time kiểm tra phòng trống
  - Kiểm tra sức chứa (maks X khách)
  - Chọn phương thức thanh toán
  - Hiển thị giá dự kiến
- ✅ Theo dõi lịch sử đặt phòng
- ✅ Đánh giá phòng

### **👨‍💼 Quản Lý (Admin/Lễ Tân)**

- ✅ Xác nhận đặt phòng
- ✅ Check-in / Check-out
- ✅ Quản lý phòng
- ✅ Quản lý khách hàng
- ✅ Quản lý dịch vụ
- ✅ Quản lý thanh toán
- ✅ Xem thống kê Dashboard
- ✅ Lịch sử đặt phòng (lọc theo trạng thái)

---

## 🛡️ Bảo Mật

- ✅ JWT Authentication (7 ngày)
- ✅ Refresh Token (30 ngày)
- ✅ Password hashing (bcryptjs)
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Request validation
- ✅ Role-based access control (admin/letan)

---

## 📦 Dependencies Chính

### **Backend**

- express.js - Web framework
- sequelize - ORM
- mysql2 - MySQL client
- jsonwebtoken - JWT auth
- bcryptjs - Password hashing
- cors - CORS middleware
- helmet - Security headers

### **Frontend**

- react - UI framework
- react-router-dom - Routing
- axios - HTTP client
- date-fns - Date formatting
- tailwindcss - CSS framework
- lucide-react - Icons

---

## 📝 License

Private Project - Không được phép sao chép mà không permission

---

## 👥 Support

Nếu gặp issues, kiểm tra:

1. MySQL đang chạy ✅
2. `.env` cấu hình đúng ✅
3. `npm install` đã chạy ✅
4. `node seed.js` đã tạo dữ liệu ✅
5. Ports 5050 (backend) & 5173 (frontend) không bị chiếm ✅

---

**Happy coding! 🚀**
