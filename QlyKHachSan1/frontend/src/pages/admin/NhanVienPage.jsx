import { useEffect, useState } from "react";
import { authApi } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";

function NhanVienPage() {
  const [danhSach, setDanhSach] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [hienForm, setHienForm] = useState(false);
  const [form, setForm] = useState({
    tenDangNhap: "",
    matKhau: "",
    hoTen: "",
    soDienThoai: "",
    email: "",
    vaiTro: "letan",
  });
  const [thongBao, setThongBao] = useState("");
  const [loi, setLoi] = useState("");

  useEffect(() => {
    taiDanhSach();
  }, []);

  const taiDanhSach = async () => {
    setDangTai(true);
    try {
      setDanhSach([
        {
          id: 1,
          tenDangNhap: "admin",
          hoTen: "Quản trị viên",
          email: "admin@hotel.com",
          vaiTro: "admin",
          soDienThoai: "0123456789",
        },
        {
          id: 2,
          tenDangNhap: "letan1",
          hoTen: "Lê Văn An",
          email: "letan@hotel.com",
          vaiTro: "letan",
          soDienThoai: "0987654321",
        },
      ]);
    } catch {
      setLoi("Không thể tải danh sách nhân viên");
    } finally {
      setDangTai(false);
    }
  };

  const capNhatForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const themNhanVien = async (e) => {
    e.preventDefault();
    setLoi("");
    setThongBao("");

    try {
      await authApi.dangKy(form);
      setThongBao(`✅ Tạo tài khoản ${form.hoTen} thành công!`);
      setForm({
        tenDangNhap: "",
        matKhau: "",
        hoTen: "",
        soDienThoai: "",
        email: "",
        vaiTro: "letan",
      });
      setHienForm(false);
      await taiDanhSach();
    } catch (error) {
      const thongBaoLoi =
        error.response?.data?.thongBao || "Tạo tài khoản thất bại";
      setLoi(thongBaoLoi);
    }
  };

  if (dangTai) {
    return <LoadingSpinner size="lg" text="Đang tải danh sách nhân viên..." />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          👨‍💼 Quản lý nhân viên
        </h1>
        <button
          onClick={() => setHienForm(!hienForm)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {hienForm ? "❌ Đóng" : "➕ Thêm nhân viên"}
        </button>
      </div>

      {thongBao && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">
          {thongBao}
        </div>
      )}
      {loi && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
          {loi}
        </div>
      )}

      {hienForm && (
        <form
          onSubmit={themNhanVien}
          className="space-y-3 rounded-lg bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            Tạo tài khoản nhân viên mới
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <input
              name="tenDangNhap"
              value={form.tenDangNhap}
              onChange={capNhatForm}
              placeholder="Tên đăng nhập"
              className="rounded-lg border border-slate-300 px-3 py-2 input-focus"
              required
            />
            <input
              name="matKhau"
              type="password"
              value={form.matKhau}
              onChange={capNhatForm}
              placeholder="Mật khẩu"
              className="rounded-lg border border-slate-300 px-3 py-2 input-focus"
              required
            />
          </div>

          <input
            name="hoTen"
            value={form.hoTen}
            onChange={capNhatForm}
            placeholder="Họ tên"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 input-focus"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={capNhatForm}
              placeholder="Email"
              className="rounded-lg border border-slate-300 px-3 py-2 input-focus"
              required
            />
            <input
              name="soDienThoai"
              value={form.soDienThoai}
              onChange={capNhatForm}
              placeholder="Số điện thoại"
              className="rounded-lg border border-slate-300 px-3 py-2 input-focus"
              required
            />
          </div>

          <select
            name="vaiTro"
            value={form.vaiTro}
            onChange={capNhatForm}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 input-focus"
          >
            <option value="letan">👨‍💼 Lễ tân</option>
            <option value="admin">👨‍💻 Quản trị viên</option>
          </select>

          <button
            type="submit"
            className="w-full rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
          >
            ✅ Tạo tài khoản
          </button>
        </form>
      )}

      <div className="rounded-lg bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                Tên đăng nhập
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                Họ tên
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                Email
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                Vai trò
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                SĐT
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {danhSach.map((nv) => (
              <tr key={nv.id} className="border-b hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-600">
                  {nv.tenDangNhap}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{nv.hoTen}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{nv.email}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      nv.vaiTro === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {nv.vaiTro === "admin" ? "👨‍💻 Admin" : "👨‍💼 Lễ tân"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {nv.soDienThoai}
                </td>
                <td className="px-4 py-3 text-sm">
                  <button className="text-rose-600 hover:text-rose-700 font-medium">
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default NhanVienPage;
