import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../services/api";
import CustomerHeader from "../../components/CustomerHeader";
import { isCustomerRole } from "../../utils/permissions";

function DangKyKhachPage() {
  const [form, setForm] = useState({
    hoTen: "",
    tenDangNhap: "",
    email: "",
    soDienThoai: "",
    matKhau: "",
    xacNhanMatKhau: "",
  });
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState("");
  const [thanhCong, setThanhCong] = useState(false);
  const dieuHuong = useNavigate();

  const capNhatForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const xuLyDangKy = async (e) => {
    e.preventDefault();
    setLoi("");

    if (form.matKhau !== form.xacNhanMatKhau) {
      setLoi("Mật khẩu xác nhận không khớp");
      return;
    }

    if (form.matKhau.length < 6) {
      setLoi("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setDangTai(true);
    try {
      const { data } = await authApi.dangKy({
        hoTen: form.hoTen,
        tenDangNhap: form.tenDangNhap,
        email: form.email,
        soDienThoai: form.soDienThoai,
        matKhau: form.matKhau,
      });

      if (!isCustomerRole(data.duLieu?.nguoiDung?.vaiTro)) {
        setLoi("Đăng ký thất bại: vai trò tài khoản không hợp lệ");
        return;
      }

      localStorage.setItem("customer_token", data.duLieu.token);
      setThanhCong(true);
      setTimeout(() => dieuHuong("/"), 2000);
    } catch (error) {
      setLoi(error.response?.data?.thongBao || "Đăng ký thất bại");
    } finally {
      setDangTai(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerHeader />

      <main className="pt-24 px-4 pb-12">
        <div className="max-w-md mx-auto rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900">Đăng ký</h1>
          <p className="mt-2 text-sm text-slate-600">
            Tạo tài khoản để lưu thông tin đặt phòng tiện hơn.
          </p>

          {thanhCong ? (
            <div className="mt-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-green-700 text-sm">
              ✅ Đăng ký thành công! Đang chuyển về trang chủ...
            </div>
          ) : (
            <form className="mt-5 space-y-3" onSubmit={xuLyDangKy}>
              <input
                type="text"
                name="hoTen"
                placeholder="Họ và tên *"
                value={form.hoTen}
                onChange={capNhatForm}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              />
              <input
                type="text"
                name="tenDangNhap"
                placeholder="Tên đăng nhập *"
                value={form.tenDangNhap}
                onChange={capNhatForm}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              />
              <input
                type="email"
                name="email"
                placeholder="Email *"
                value={form.email}
                onChange={capNhatForm}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              />
              <input
                type="tel"
                name="soDienThoai"
                placeholder="Số điện thoại"
                value={form.soDienThoai}
                onChange={capNhatForm}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              />
              <input
                type="password"
                name="matKhau"
                placeholder="Mật khẩu * (ít nhất 6 ký tự)"
                value={form.matKhau}
                onChange={capNhatForm}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              />
              <input
                type="password"
                name="xacNhanMatKhau"
                placeholder="Xác nhận mật khẩu *"
                value={form.xacNhanMatKhau}
                onChange={capNhatForm}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              />
              {loi && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {loi}
                </p>
              )}
              <button
                type="submit"
                disabled={dangTai}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {dangTai ? "Đang xử lý..." : "Đăng ký"}
              </button>
            </form>
          )}

          <p className="mt-4 text-sm text-slate-600">
            Đã có tài khoản?{" "}
            <Link
              to="/dang-nhap"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default DangKyKhachPage;
