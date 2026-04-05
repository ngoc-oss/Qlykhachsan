import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../services/api";
import CustomerHeader from "../../components/CustomerHeader";
import { isCustomerRole } from "../../utils/permissions";

function DangNhapKhachPage() {
  const [form, setForm] = useState({ tenDangNhap: "", matKhau: "" });
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState("");
  const dieuHuong = useNavigate();

  const capNhatForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const xuLyDangNhap = async (e) => {
    e.preventDefault();
    setLoi("");
    setDangTai(true);
    try {
      const { data } = await authApi.dangNhap(form);
      if (!isCustomerRole(data.duLieu?.nguoiDung?.vaiTro)) {
        localStorage.removeItem("customer_token");
        setLoi("Tài khoản này không thuộc khu vực khách hàng");
        return;
      }

      localStorage.setItem("customer_token", data.duLieu.token);
      dieuHuong("/");
    } catch (error) {
      setLoi(error.response?.data?.thongBao || "Đăng nhập thất bại");
    } finally {
      setDangTai(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerHeader />

      <main className="pt-24 px-4">
        <div className="max-w-md mx-auto rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900">Đăng nhập</h1>
          <p className="mt-2 text-sm text-slate-600">
            Khu vực này dành cho khách hàng.
          </p>

          <form className="mt-5 space-y-3" onSubmit={xuLyDangNhap}>
            <input
              type="text"
              name="tenDangNhap"
              placeholder="Tên đăng nhập"
              value={form.tenDangNhap}
              onChange={capNhatForm}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
            <input
              type="password"
              name="matKhau"
              placeholder="Mật khẩu"
              value={form.matKhau}
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
              {dangTai ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </form>

          <p className="mt-4 text-sm text-slate-600">
            Chưa có tài khoản?{" "}
            <Link
              to="/dang-ky"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default DangNhapKhachPage;
