import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { customerAuthApi } from "../services/api";
import { getCustomerCurrentRole, isCustomerRole } from "../utils/permissions";

function CustomerHeader() {
  const [menuMo, setMenuMo] = useState(false);
  const [tenNguoiDung, setTenNguoiDung] = useState(null);
  const dieuHuong = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("customer_token");
    const role = getCustomerCurrentRole();

    if (token && isCustomerRole(role)) {
      customerAuthApi
        .thongTin()
        .then(({ data }) =>
          setTenNguoiDung(data.duLieu.hoTen || data.duLieu.tenDangNhap),
        )
        .catch(() => {
          localStorage.removeItem("customer_token");
          setTenNguoiDung(null);
        });
      return;
    }

    setTenNguoiDung(null);
  }, []);

  const xuLyDangXuat = () => {
    localStorage.removeItem("customer_token");
    setTenNguoiDung(null);
    dieuHuong("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between">
          {}
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold text-blue-600 hover:text-blue-700 transition"
          >
            <span className="text-2xl">H</span>
            <span>LumiStay</span>
          </Link>

          {}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors relative group"
              to="/"
            >
              Trang chủ
              <span className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-blue-600 to-cyan-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors relative group"
              to="/phong"
            >
              Xem phòng
              <span className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-blue-600 to-cyan-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <a
              href="#contact"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors relative group"
            >
              Liên hệ
              <span className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-blue-600 to-cyan-600 group-hover:w-full transition-all duration-300"></span>
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {tenNguoiDung ? (
              <>
                <Link
                  to="/tai-khoan"
                  className="text-sm text-slate-600 hover:text-blue-600 transition"
                >
                  Xin chào,{" "}
                  <span className="font-medium text-slate-800">
                    {tenNguoiDung}
                  </span>
                </Link>
                <Link
                  to="/tai-khoan"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 transition"
                >
                  Tài khoản
                </Link>
                <button
                  onClick={xuLyDangXuat}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/dang-nhap"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 transition"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/dang-ky"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 transition"
                >
                  Đăng ký
                </Link>
              </>
            )}
            <Link
              to="/phong"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition transform hover:scale-105"
            >
              Đặt phòng ngay
            </Link>
          </div>

          {}
          <button
            className="md:hidden text-slate-600 hover:text-slate-900 transition"
            onClick={() => setMenuMo(!menuMo)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {}
        {menuMo && (
          <nav className="md:hidden mt-4 py-4 border-t border-slate-200 space-y-3 animate-fade-in-down">
            <Link
              className="block text-sm font-medium text-slate-600 hover:text-blue-600 transition"
              to="/"
              onClick={() => setMenuMo(false)}
            >
              Trang chủ
            </Link>
            <Link
              className="block text-sm font-medium text-slate-600 hover:text-blue-600 transition"
              to="/phong"
              onClick={() => setMenuMo(false)}
            >
              Xem phòng
            </Link>
            <a
              href="#contact"
              className="block text-sm font-medium text-slate-600 hover:text-blue-600 transition"
            >
              Liên hệ
            </a>
            {tenNguoiDung ? (
              <>
                <Link
                  to="/tai-khoan"
                  className="block text-sm font-medium text-slate-600 hover:text-blue-600 transition"
                  onClick={() => setMenuMo(false)}
                >
                  Tài khoản
                </Link>
                <button
                  onClick={xuLyDangXuat}
                  className="block text-sm font-medium text-red-600 hover:text-red-700 transition"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/dang-nhap"
                  className="block text-sm font-medium text-slate-600 hover:text-blue-600 transition"
                  onClick={() => setMenuMo(false)}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/dang-ky"
                  className="block text-sm font-medium text-slate-600 hover:text-blue-600 transition"
                  onClick={() => setMenuMo(false)}
                >
                  Đăng ký
                </Link>
              </>
            )}
            <Link
              to="/phong"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition"
              onClick={() => setMenuMo(false)}
            >
              Đặt phòng
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

export default CustomerHeader;
