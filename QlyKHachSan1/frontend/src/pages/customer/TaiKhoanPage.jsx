import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  authApi,
  datPhongApi,
  customerAuthApi,
  customerDatPhongApi,
} from "../../services/api";
import CustomerHeader from "../../components/CustomerHeader";
import {
  getCustomerCurrentRole,
  isCustomerRole,
} from "../../utils/permissions";

const tabList = [
  { id: "thongtin", label: "Thông tin cá nhân" },
  { id: "matkhau", label: "Đổi mật khẩu" },
  { id: "lichsu", label: "Lịch sử đặt phòng" },
];

const mauTrangThai = {
  choxacnhan: "bg-yellow-100 text-yellow-800",
  daxacnhan: "bg-blue-100 text-blue-800",
  danhan: "bg-purple-100 text-purple-800",
  hoanthanh: "bg-green-100 text-green-800",
  dahuy: "bg-red-100 text-red-800",
};

const nhanTrangThai = {
  choxacnhan: "Chờ xác nhận",
  daxacnhan: "Đã xác nhận",
  danhan: "Đang nhận phòng",
  hoanthanh: "Hoàn thành",
  dahuy: "Đã hủy",
};

function TaiKhoanPage() {
  const [tab, setTab] = useState("thongtin");
  const [nguoiDung, setNguoiDung] = useState(null);
  const [formThongTin, setFormThongTin] = useState({
    hoTen: "",
    email: "",
    soDienThoai: "",
  });
  const [formMatKhau, setFormMatKhau] = useState({
    matKhauCu: "",
    matKhauMoi: "",
    xacNhan: "",
  });
  const [danhSachDatPhong, setDanhSachDatPhong] = useState([]);
  const [dangTai, setDangTai] = useState(false);
  const [dangTaiDatPhong, setDangTaiDatPhong] = useState(false);
  const [thongBao, setThongBao] = useState({ loai: "", noi: "" });
  const dieuHuong = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("customer_token");
    const role = getCustomerCurrentRole();

    if (!token || !isCustomerRole(role)) {
      dieuHuong("/dang-nhap");
      return;
    }

    customerAuthApi
      .thongTin()
      .then(({ data }) => {
        setNguoiDung(data.duLieu);
        setFormThongTin({
          hoTen: data.duLieu.hoTen || "",
          email: data.duLieu.email || "",
          soDienThoai: data.duLieu.soDienThoai || "",
        });
      })
      .catch(() => {
        localStorage.removeItem("customer_token");
        dieuHuong("/dang-nhap");
      });
  }, [dieuHuong]);

  useEffect(() => {
    if (tab === "lichsu") {
      setDangTaiDatPhong(true);
      customerDatPhongApi
        .layLichSuCuaToi()
        .then(({ data }) => setDanhSachDatPhong(data.duLieu.duLieu || []))
        .catch(() => setDanhSachDatPhong([]))
        .finally(() => setDangTaiDatPhong(false));
    }
  }, [tab]);

  const luuThongTin = async (e) => {
    e.preventDefault();
    setDangTai(true);
    setThongBao({ loai: "", noi: "" });
    try {
      await customerAuthApi.capNhat(formThongTin);
      setThongBao({ loai: "success", noi: "Cập nhật thông tin thành công!" });
      setNguoiDung((prev) => ({ ...prev, ...formThongTin }));
    } catch (err) {
      setThongBao({
        loai: "error",
        noi: err.response?.data?.thongBao || "Cập nhật thất bại",
      });
    } finally {
      setDangTai(false);
    }
  };

  const doiMatKhau = async (e) => {
    e.preventDefault();
    if (formMatKhau.matKhauMoi !== formMatKhau.xacNhan) {
      setThongBao({ loai: "error", noi: "Mật khẩu xác nhận không khớp" });
      return;
    }
    if (formMatKhau.matKhauMoi.length < 6) {
      setThongBao({
        loai: "error",
        noi: "Mật khẩu mới phải có ít nhất 6 ký tự",
      });
      return;
    }
    setDangTai(true);
    setThongBao({ loai: "", noi: "" });
    try {
      await customerAuthApi.doiMatKhau({
        matKhauCu: formMatKhau.matKhauCu,
        matKhauMoi: formMatKhau.matKhauMoi,
      });
      setThongBao({ loai: "success", noi: "Đổi mật khẩu thành công!" });
      setFormMatKhau({ matKhauCu: "", matKhauMoi: "", xacNhan: "" });
    } catch (err) {
      setThongBao({
        loai: "error",
        noi: err.response?.data?.thongBao || "Đổi mật khẩu thất bại",
      });
    } finally {
      setDangTai(false);
    }
  };

  const dieuChinhThongBao = (e) => {
    setThongBao({ loai: "", noi: "" });
    setFormThongTin((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const dieuChinhMatKhau = (e) => {
    setThongBao({ loai: "", noi: "" });
    setFormMatKhau((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerHeader key={nguoiDung?.hoTen} />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">
            Tài khoản của tôi
          </h1>

          <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1 mb-6">
            {tabList.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  setThongBao({ loai: "", noi: "" });
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                  tab === t.id
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            {thongBao.noi && (
              <div
                className={`mb-4 rounded-lg px-4 py-3 text-sm ${
                  thongBao.loai === "success"
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-600"
                }`}
              >
                {thongBao.noi}
              </div>
            )}

            {tab === "thongtin" && (
              <form onSubmit={luuThongTin} className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">
                  Thông tin cá nhân
                </h2>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tên đăng nhập
                  </label>
                  <input
                    type="text"
                    value={nguoiDung?.tenDangNhap || ""}
                    disabled
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    name="hoTen"
                    value={formThongTin.hoTen}
                    onChange={dieuChinhThongBao}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formThongTin.email}
                    onChange={dieuChinhThongBao}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="soDienThoai"
                    value={formThongTin.soDienThoai}
                    onChange={dieuChinhThongBao}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={dangTai}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {dangTai ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </form>
            )}

            {tab === "matkhau" && (
              <form onSubmit={doiMatKhau} className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">
                  Đổi mật khẩu
                </h2>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    name="matKhauCu"
                    value={formMatKhau.matKhauCu}
                    onChange={dieuChinhMatKhau}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    name="matKhauMoi"
                    value={formMatKhau.matKhauMoi}
                    onChange={dieuChinhMatKhau}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    name="xacNhan"
                    value={formMatKhau.xacNhan}
                    onChange={dieuChinhMatKhau}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={dangTai}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {dangTai ? "Đang xử lý..." : "Đổi mật khẩu"}
                </button>
              </form>
            )}

            {tab === "lichsu" && (
              <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-4">
                  Lịch sử đặt phòng
                </h2>
                {dangTaiDatPhong ? (
                  <p className="text-sm text-slate-500 text-center py-8">
                    Đang tải...
                  </p>
                ) : danhSachDatPhong.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500 text-sm">
                      Bạn chưa có lịch sử đặt phòng nào.
                    </p>
                    <a
                      href="/phong"
                      className="mt-3 inline-block text-blue-600 text-sm font-medium hover:underline"
                    >
                      Đặt phòng ngay →
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {danhSachDatPhong.map((dp) => (
                      <div
                        key={dp.id}
                        className="rounded-lg border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-800 text-sm">
                              {dp.phong?.loaiPhong?.tenLoaiPhong} — Phòng{" "}
                              {dp.phong?.soPhong}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Mã đặt phòng: {dp.maDatPhong}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${mauTrangThai[dp.trangThai] || "bg-slate-100 text-slate-600"}`}
                          >
                            {nhanTrangThai[dp.trangThai] || dp.trangThai}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                          <div>
                            <span className="text-slate-400">Nhận phòng: </span>
                            {format(new Date(dp.ngayNhanPhong), "dd/MM/yyyy", {
                              locale: vi,
                            })}
                          </div>
                          <div>
                            <span className="text-slate-400">Trả phòng: </span>
                            {format(new Date(dp.ngayTraPhong), "dd/MM/yyyy", {
                              locale: vi,
                            })}
                          </div>
                          <div>
                            <span className="text-slate-400">Khách: </span>
                            {dp.soNguoiLon} người lớn
                            {dp.soTreEm > 0 ? `, ${dp.soTreEm} trẻ em` : ""}
                          </div>
                          <div>
                            <span className="text-slate-400">Tổng tiền: </span>
                            <span className="font-medium text-slate-800">
                              {Number(dp.tongTien).toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default TaiKhoanPage;
