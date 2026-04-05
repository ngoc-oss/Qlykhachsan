import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../services/api";
import { isAdminPanelRole } from "../utils/permissions";

function DangNhapPage() {
  const [tenDangNhap, setTenDangNhap] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState("");
  const dieuHuong = useNavigate();

  const xuLyDangNhap = async (e) => {
    e.preventDefault();
    setLoi("");
    setDangTai(true);

    try {
      const { data } = await authApi.dangNhap({ tenDangNhap, matKhau });

      if (!isAdminPanelRole(data.duLieu?.nguoiDung?.vaiTro)) {
        localStorage.removeItem("token");
        setLoi("Tài khoản này không có quyền vào trang quản trị");
        return;
      }

      localStorage.setItem("token", data.duLieu.token);
      dieuHuong("/admin");
    } catch (error) {
      const thongBao = error.response?.data?.thongBao || "Đăng nhập thất bại";
      setLoi(thongBao);
    } finally {
      setDangTai(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <form
        className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-sm"
        onSubmit={xuLyDangNhap}
      >
        <h2 className="text-xl font-semibold text-slate-900">
          Đăng nhập nhân viên
        </h2>
        <p className="text-sm text-slate-500">
          Sử dụng tài khoản quản trị để vào hệ thống.
        </p>

        <input
          type="text"
          placeholder="Tên đăng nhập"
          value={tenDangNhap}
          onChange={(e) => setTenDangNhap(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={matKhau}
          onChange={(e) => setMatKhau(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
        />
        {loi && <p className="m-0 text-sm text-rose-600">{loi}</p>}
        <button
          type="submit"
          disabled={dangTai}
          className="w-full rounded-lg bg-slate-900 px-3 py-2 font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {dangTai ? "Đang xử lý..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}

export default DangNhapPage;
