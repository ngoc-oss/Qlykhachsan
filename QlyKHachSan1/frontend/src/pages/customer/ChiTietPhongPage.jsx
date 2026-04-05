import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  customerApi,
  datPhongApi,
  customerDatPhongApi,
} from "../../services/api";
import CustomerHeader from "../../components/CustomerHeader";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  getCustomerCurrentRole,
  isCustomerRole,
} from "../../utils/permissions";

const giaTriMacDinhForm = {
  hoTen: "",
  soDienThoai: "",
  email: "",
  hinhThucDat: "ngay",
  phuongThucThanhToan: "tienmat",
  ngayNhanPhong: "",
  ngayTraPhong: "",
  gioNhanPhong: "14:00",
  soGio: 1,
  soDem: 1,
  soThang: 1,
  soNguoiLon: 1,
  soTreEm: 0,
  ghiChu: "",
};

const nhanHinhThucDat = {
  gio: "Theo giờ",
  ngay: "Theo ngày",
  dem: "Theo đêm",
  thang: "Theo tháng",
};

const nhanPhuongThucThanhToan = {
  tienmat: "Tiền mặt",
  chuyenkhoan: "Chuyển khoản ngân hàng",
  theonline: "Thẻ/Online",
};

function ChiTietPhongPage() {
  const { id } = useParams();
  const [phong, setPhong] = useState(null);
  const [dangTai, setDangTai] = useState(true);
  const [dangGui, setDangGui] = useState(false);
  const [thongBao, setThongBao] = useState("");
  const [loi, setLoi] = useState("");
  const [form, setForm] = useState(giaTriMacDinhForm);
  const [tinhTrangPhong, setTinhTrangPhong] = useState(null);
  const [dangKiemTra, setDangKiemTra] = useState(false);

  const dinhDangNgayGio = (giaTriIso) => {
    const thoiGian = new Date(giaTriIso);
    const ngay = thoiGian.toLocaleDateString("vi-VN");
    const gio = thoiGian.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${ngay} ${gio}`;
  };

  useEffect(() => {
    const taiChiTiet = async () => {
      try {
        const { data } = await customerApi.layChiTietPhongCongKhai(id);
        setPhong(data.duLieu);
      } catch {
        setLoi("Không thể tải thông tin phòng.");
      } finally {
        setDangTai(false);
      }
    };

    taiChiTiet();
  }, [id]);

  useEffect(() => {
    const kiemTraTinhTrang = async () => {
      const khoangThoiGian = taoKhoangThoiGianDat();
      if (!khoangThoiGian) {
        setTinhTrangPhong(null);
        return;
      }

      setDangKiemTra(true);
      try {
        const { data } = await customerApi.kiemTraPhongCoSan(id, {
          ngay_nhan: khoangThoiGian.ngayNhanPhong,
          ngay_tra: khoangThoiGian.ngayTraPhong,
        });
        setTinhTrangPhong(data.duLieu);
      } catch {
        setTinhTrangPhong(null);
      } finally {
        setDangKiemTra(false);
      }
    };

    kiemTraTinhTrang();
  }, [
    id,
    form.hinhThucDat,
    form.ngayNhanPhong,
    form.ngayTraPhong,
    form.gioNhanPhong,
    form.soGio,
    form.soDem,
    form.soThang,
  ]);

  const giaHienThi = useMemo(() => {
    return Number(phong?.loaiPhong?.giaHienTai || 0).toLocaleString("vi-VN");
  }, [phong]);

  const bangGia = useMemo(() => {
    const giaCoSo = Number(phong?.loaiPhong?.giaHienTai || 0);
    const giaTheoGio = Math.max(100000, Math.round(giaCoSo / 6 / 1000) * 1000);
    const giaTheoDem = Math.max(
      500000,
      Math.round((giaCoSo * 0.85) / 1000) * 1000,
    );
    const giaTheoThang = Math.max(
      8000000,
      Math.round((giaCoSo * 26) / 1000) * 1000,
    );

    return {
      gio: giaTheoGio,
      ngay: giaCoSo,
      dem: giaTheoDem,
      thang: giaTheoThang,
    };
  }, [phong]);

  const soNguoiToiDa = Number(phong?.loaiPhong?.soNguoiToiDa || 0);
  const tongSoKhach = Number(form.soNguoiLon || 0) + Number(form.soTreEm || 0);
  const vuotSucChua = soNguoiToiDa > 0 && tongSoKhach > soNguoiToiDa;

  const tongTienDuKien = useMemo(() => {
    if (form.hinhThucDat === "gio") {
      return Number(form.soGio || 1) * bangGia.gio;
    }
    if (form.hinhThucDat === "ngay") {
      if (!form.ngayNhanPhong || !form.ngayTraPhong) return bangGia.ngay;
      const batDau = new Date(`${form.ngayNhanPhong}T00:00:00`);
      const ketThuc = new Date(`${form.ngayTraPhong}T00:00:00`);
      const soNgay = Math.max(
        1,
        Math.ceil(
          (ketThuc.getTime() - batDau.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );
      return soNgay * bangGia.ngay;
    }
    if (form.hinhThucDat === "dem") {
      return Number(form.soDem || 1) * bangGia.dem;
    }
    return Number(form.soThang || 1) * bangGia.thang;
  }, [form, bangGia]);

  const taoKhoangThoiGianDat = () => {
    if (form.hinhThucDat === "gio") {
      if (!form.ngayNhanPhong || !form.gioNhanPhong) return null;
      const batDau = new Date(`${form.ngayNhanPhong}T${form.gioNhanPhong}:00`);
      const ketThuc = new Date(
        batDau.getTime() + Number(form.soGio || 1) * 60 * 60 * 1000,
      );
      return {
        ngayNhanPhong: batDau.toISOString(),
        ngayTraPhong: ketThuc.toISOString(),
      };
    }

    if (form.hinhThucDat === "ngay") {
      if (!form.ngayNhanPhong || !form.ngayTraPhong || !form.gioNhanPhong)
        return null;
      return {
        ngayNhanPhong: `${form.ngayNhanPhong}T${form.gioNhanPhong}:00`,
        ngayTraPhong: `${form.ngayTraPhong}T${form.gioNhanPhong}:00`,
      };
    }

    if (form.hinhThucDat === "dem") {
      if (!form.ngayNhanPhong) return null;
      const batDau = new Date(`${form.ngayNhanPhong}T20:00:00`);
      const ketThuc = new Date(batDau);
      ketThuc.setDate(ketThuc.getDate() + Number(form.soDem || 1));
      return {
        ngayNhanPhong: batDau.toISOString(),
        ngayTraPhong: ketThuc.toISOString(),
      };
    }

    if (!form.ngayNhanPhong) return null;
    const batDau = new Date(`${form.ngayNhanPhong}T14:00:00`);
    const ketThuc = new Date(batDau);
    ketThuc.setMonth(ketThuc.getMonth() + Number(form.soThang || 1));
    return {
      ngayNhanPhong: batDau.toISOString(),
      ngayTraPhong: ketThuc.toISOString(),
    };
  };

  const khoangThoiGianHienThi = useMemo(
    () => taoKhoangThoiGianDat(),
    [
      form.hinhThucDat,
      form.ngayNhanPhong,
      form.ngayTraPhong,
      form.gioNhanPhong,
      form.soGio,
      form.soDem,
      form.soThang,
    ],
  );

  const capNhatForm = (e) => {
    const { name, value } = e.target;
    setForm((truocDo) => {
      if (name === "soNguoiLon") {
        const nguoiLonMoi = Math.max(1, Number(value || 1));
        const treEmHienTai = Number(truocDo.soTreEm || 0);
        const treEmToiDa =
          soNguoiToiDa > 0
            ? Math.max(0, soNguoiToiDa - nguoiLonMoi)
            : treEmHienTai;

        return {
          ...truocDo,
          soNguoiLon: nguoiLonMoi,
          soTreEm: Math.min(treEmHienTai, treEmToiDa),
        };
      }

      if (name === "soTreEm") {
        const treEmMoi = Math.max(0, Number(value || 0));
        const nguoiLonHienTai = Number(truocDo.soNguoiLon || 1);
        const treEmToiDa =
          soNguoiToiDa > 0
            ? Math.max(0, soNguoiToiDa - nguoiLonHienTai)
            : treEmMoi;

        return {
          ...truocDo,
          soTreEm: Math.min(treEmMoi, treEmToiDa),
        };
      }

      return { ...truocDo, [name]: value };
    });
  };

  const guiYeuCau = async (e) => {
    e.preventDefault();
    setLoi("");
    setThongBao("");
    setDangGui(true);

    try {
      const khoangThoiGian = taoKhoangThoiGianDat();
      if (!khoangThoiGian) {
        setLoi("Vui lòng nhập đủ thời gian đặt phòng theo hình thức đã chọn.");
        setDangGui(false);
        return;
      }

      if (vuotSucChua) {
        setLoi(`Phòng này chỉ nhận tối đa ${soNguoiToiDa} khách.`);
        setDangGui(false);
        return;
      }

      const ghiChuTongHop = [
        form.ghiChu,
        `Hình thức đặt: ${nhanHinhThucDat[form.hinhThucDat]}`,
        `Phương thức thanh toán dự kiến: ${nhanPhuongThucThanhToan[form.phuongThucThanhToan]}`,
        `Giá dự kiến: ${Number(tongTienDuKien).toLocaleString("vi-VN")}đ`,
      ]
        .filter(Boolean)
        .join(" | ");

      const duLieuDatPhong = {
        phongId: Number(id),
        ngayNhanPhong: khoangThoiGian.ngayNhanPhong,
        ngayTraPhong: khoangThoiGian.ngayTraPhong,
        soNguoiLon: Number(form.soNguoiLon || 1),
        soTreEm: Number(form.soTreEm || 0),
        ghiChu: ghiChuTongHop,
      };

      // Kiểm tra xem khách có đăng nhập (có token) hay không
      const token = localStorage.getItem("customer_token");
      const role = getCustomerCurrentRole();

      if (token && isCustomerRole(role)) {
        // Khách đã đăng nhập → gọi API /dat-phong (lưu lịch sử cá nhân)
        await customerDatPhongApi.taoMoi(duLieuDatPhong);
        setThongBao(
          "✅ Đặt phòng thành công! Bạn có thể xem lịch sử đặt phòng của mình tại trang tài khoản.",
        );
      } else {
        // Khách chưa đăng nhập → gọi API /dat-phong/cong-khai
        await customerApi.taoYeuCauDatPhong({
          hoTen: form.hoTen,
          soDienThoai: form.soDienThoai,
          email: form.email,
          ...duLieuDatPhong,
        });
        setThongBao(
          "📋 Yêu cầu đặt phòng đã được gửi thành công! Lễ tân sẽ liên hệ qua số điện thoại hoặc email để xác nhận trong thời gian sớm nhất.",
        );
      }

      setForm(giaTriMacDinhForm);
    } catch (error) {
      const thongBaoLoi =
        error.response?.data?.thongBao || "Gửi yêu cầu thất bại.";
      setLoi(thongBaoLoi);
    } finally {
      setDangGui(false);
    }
  };

  if (dangTai) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Đang tải thông tin phòng..." />
      </div>
    );
  }

  if (!phong) {
    return (
      <div className="p-8">
        <p className="text-rose-600">Không tìm thấy phòng phù hợp.</p>
        <Link
          to="/phong"
          className="mt-3 inline-flex text-blue-600 hover:text-blue-700"
        >
          Quay lại danh sách phòng
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerHeader />

      <main className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-8 pt-24 lg:grid-cols-[1.1fr_1fr]">
        <section className="rounded-2xl bg-white p-8 shadow-lg card-hover animate-fade-in-left">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                Phòng {phong.soPhong}
              </p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                {phong.loaiPhong?.tenLoaiPhong || "Phòng tiêu chuẩn"}
              </h1>
            </div>
          </div>

          <p className="text-slate-600 leading-relaxed">
            {phong.loaiPhong?.moTa ||
              "Phòng đầy đủ tiện nghi cho kỳ nghỉ thoải mái."}
          </p>

          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-4 border border-blue-200">
              <p className="text-xs font-semibold text-slate-600 mb-1">Tầng</p>
              <p className="text-2xl font-bold text-blue-700">{phong.tang}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 border border-cyan-200">
              <p className="text-xs font-semibold text-slate-600 mb-1">
                Diện tích
              </p>
              <p className="text-2xl font-bold text-cyan-700">
                {phong.loaiPhong?.dienTich || "-"} m²
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-4 border border-purple-200">
              <p className="text-xs font-semibold text-slate-600 mb-1">
                Sức chứa
              </p>
              <p className="text-2xl font-bold text-purple-700">
                {phong.loaiPhong?.soNguoiToiDa || "-"} khách
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 p-4 border border-amber-200">
              <p className="text-xs font-semibold text-slate-600 mb-1">
                Giường
              </p>
              <p className="text-2xl font-bold text-amber-700">
                {phong.loaiPhong?.soGiuong || "-"}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white shadow-xl">
            <p className="text-sm font-semibold opacity-90 mb-2">Giá cơ bản</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{giaHienThi}</span>
              <span className="text-lg opacity-90">đ/đêm</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 hover:shadow-md transition-shadow">
              <p className="text-xs font-semibold text-slate-600 mb-1">
                Theo giờ
              </p>
              <p className="text-lg font-bold text-slate-900">
                {Number(bangGia.gio).toLocaleString("vi-VN")}
              </p>
              <p className="text-xs text-slate-500">đ/giờ</p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 hover:shadow-md transition-shadow">
              <p className="text-xs font-semibold text-slate-600 mb-1">
                Theo ngày
              </p>
              <p className="text-lg font-bold text-slate-900">
                {Number(bangGia.ngay).toLocaleString("vi-VN")}
              </p>
              <p className="text-xs text-slate-500">đ/ngày</p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 hover:shadow-md transition-shadow">
              <p className="text-xs font-semibold text-slate-600 mb-1">
                Theo đêm
              </p>
              <p className="text-lg font-bold text-slate-900">
                {Number(bangGia.dem).toLocaleString("vi-VN")}
              </p>
              <p className="text-xs text-slate-500">đ/đêm</p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 hover:shadow-md transition-shadow">
              <p className="text-xs font-semibold text-slate-600 mb-1">
                Theo tháng
              </p>
              <p className="text-lg font-bold text-slate-900">
                {Number(bangGia.thang).toLocaleString("vi-VN")}
              </p>
              <p className="text-xs text-slate-500">đ/tháng</p>
            </div>
          </div>
        </section>

        <section
          className="rounded-2xl bg-white p-8 shadow-lg card-hover animate-fade-in-up"
          style={{
            animationDelay: "0.2s",
            opacity: 0,
            animationFillMode: "forwards",
          }}
        >
          <h2 className="text-2xl font-bold text-slate-900">Đặt phòng</h2>

          <div className="mt-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4">
            <p className="text-sm font-semibold text-amber-900 mb-2">
              Quy trình đặt phòng
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-800 leading-relaxed">
              <span>Điền thông tin</span>
              <span className="text-amber-400">→</span>
              <span>Lễ tân xem xét</span>
              <span className="text-amber-400">→</span>
              <span>Liên hệ xác nhận</span>
              <span className="text-amber-400">→</span>
              <span>Hoàn tất</span>
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={guiYeuCau}>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">
                Hình thức đặt phòng
              </label>
              <select
                name="hinhThucDat"
                value={form.hinhThucDat}
                onChange={capNhatForm}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="gio">Đặt theo giờ</option>
                <option value="ngay">Đặt theo ngày</option>
                <option value="dem">Đặt theo đêm</option>
                <option value="thang">Đặt theo tháng</option>
              </select>
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700">
                Thông tin liên hệ
              </h3>
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1.5">
                  Họ và tên
                </label>
                <input
                  name="hoTen"
                  value={form.hoTen}
                  onChange={capNhatForm}
                  placeholder="Nhập họ và tên của bạn"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1.5">
                  Số điện thoại
                </label>
                <input
                  name="soDienThoai"
                  value={form.soDienThoai}
                  onChange={capNhatForm}
                  placeholder="0912345678"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1.5">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={capNhatForm}
                  placeholder="your@email.com"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700">
                Thời gian đặt phòng
              </h3>
              {form.hinhThucDat === "gio" && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                      Ngày
                    </label>
                    <input
                      name="ngayNhanPhong"
                      type="date"
                      value={form.ngayNhanPhong}
                      onChange={capNhatForm}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                      Giờ
                    </label>
                    <input
                      name="gioNhanPhong"
                      type="time"
                      value={form.gioNhanPhong}
                      onChange={capNhatForm}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                      Số giờ
                    </label>
                    <input
                      name="soGio"
                      type="number"
                      min="1"
                      value={form.soGio}
                      onChange={capNhatForm}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              )}

              {form.hinhThucDat === "ngay" && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                      Ngày nhận
                    </label>
                    <input
                      name="ngayNhanPhong"
                      type="date"
                      value={form.ngayNhanPhong}
                      onChange={capNhatForm}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                      Giờ nhận
                    </label>
                    <input
                      name="gioNhanPhong"
                      type="time"
                      value={form.gioNhanPhong}
                      onChange={capNhatForm}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                      Ngày trả
                    </label>
                    <input
                      name="ngayTraPhong"
                      type="date"
                      value={form.ngayTraPhong}
                      onChange={capNhatForm}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              )}

              {form.hinhThucDat === "dem" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                      Ngày
                    </label>
                    <input
                      name="ngayNhanPhong"
                      type="date"
                      value={form.ngayNhanPhong}
                      onChange={capNhatForm}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                      Số đêm
                    </label>
                    <input
                      name="soDem"
                      type="number"
                      min="1"
                      value={form.soDem}
                      onChange={capNhatForm}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              )}

              {form.hinhThucDat === "thang" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                      Ngày bắt đầu
                    </label>
                    <input
                      name="ngayNhanPhong"
                      type="date"
                      value={form.ngayNhanPhong}
                      onChange={capNhatForm}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                      Số tháng
                    </label>
                    <input
                      name="soThang"
                      type="number"
                      min="1"
                      value={form.soThang}
                      onChange={capNhatForm}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {khoangThoiGianHienThi && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-700 mb-2">
                  Mốc thời gian hiển thị cho khách
                </p>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-700">
                    <span className="font-medium">Ngày nhận:</span>{" "}
                    {dinhDangNgayGio(khoangThoiGianHienThi.ngayNhanPhong)}
                  </p>
                  <p className="text-slate-700">
                    <span className="font-medium">Ngày trả:</span>{" "}
                    {dinhDangNgayGio(khoangThoiGianHienThi.ngayTraPhong)}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 shadow-lg">
              <p className="text-sm font-semibold opacity-90 mb-1">
                Tổng tiền dự kiến
              </p>
              <p className="text-3xl font-bold">
                {Number(tongTienDuKien).toLocaleString("vi-VN")}đ
              </p>
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700">
                Thêm thông tin
              </h3>
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1.5">
                  Phương thức thanh toán dự kiến
                </label>
                <select
                  name="phuongThucThanhToan"
                  value={form.phuongThucThanhToan}
                  onChange={capNhatForm}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="tienmat">Tiền mặt</option>
                  <option value="chuyenkhoan">Chuyển khoản ngân hàng</option>
                  <option value="theonline">Thẻ/Online</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Lễ tân sẽ xác nhận lại phương thức thanh toán khi gọi chốt
                  đơn.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-600 block mb-1.5">
                    Số người lớn
                  </label>
                  <input
                    name="soNguoiLon"
                    type="number"
                    min="1"
                    max={soNguoiToiDa || undefined}
                    value={form.soNguoiLon}
                    onChange={capNhatForm}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 block mb-1.5">
                    Số trẻ em
                  </label>
                  <input
                    name="soTreEm"
                    type="number"
                    min="0"
                    max={
                      Math.max(
                        0,
                        soNguoiToiDa - Number(form.soNguoiLon || 1),
                      ) || undefined
                    }
                    value={form.soTreEm}
                    onChange={capNhatForm}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Sức chứa phòng: tối đa {soNguoiToiDa || "-"} khách • Hiện tại:{" "}
                {tongSoKhach} khách
              </p>
              {vuotSucChua && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
                  <p className="text-sm text-rose-700">
                    Vượt quá sức chứa phòng. Vui lòng giảm số khách xuống tối đa{" "}
                    {soNguoiToiDa}.
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1.5">
                  Ghi chú thêm
                </label>
                <textarea
                  name="ghiChu"
                  value={form.ghiChu}
                  onChange={capNhatForm}
                  placeholder="Các yêu cầu đặc biệt..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                />
              </div>
            </div>

            {tinhTrangPhong && (
              <div
                className={`rounded-xl border p-4 flex items-center gap-3 ${
                  tinhTrangPhong.coSan
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-rose-50 border-rose-200"
                }`}
              >
                <span className="text-2xl">
                  {tinhTrangPhong.coSan ? "✅" : "❌"}
                </span>
                <div>
                  <p
                    className={`font-semibold ${
                      tinhTrangPhong.coSan
                        ? "text-emerald-800"
                        : "text-rose-800"
                    }`}
                  >
                    {tinhTrangPhong.coSan ? "Còn phòng" : "Hết phòng"}
                  </p>
                  <p
                    className={`text-sm ${
                      tinhTrangPhong.coSan
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}
                  >
                    {tinhTrangPhong.thongBao}
                  </p>
                </div>
              </div>
            )}

            {dangKiemTra && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-sm text-blue-800">
                  Đang kiểm tra tình trạng phòng...
                </p>
              </div>
            )}

            {thongBao && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 animate-fade-in-up">
                <p className="text-sm text-emerald-800">{thongBao}</p>
              </div>
            )}
            {loi && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 animate-fade-in-up">
                <p className="text-sm text-rose-800">{loi}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={
                dangGui ||
                dangKiemTra ||
                vuotSucChua ||
                (tinhTrangPhong && !tinhTrangPhong.coSan)
              }
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 font-semibold text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 disabled:cursor-not-allowed btn-hover transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {dangGui
                ? "Đang gửi yêu cầu..."
                : vuotSucChua
                  ? "Vượt sức chứa phòng"
                  : tinhTrangPhong && !tinhTrangPhong.coSan
                    ? "Phòng không khả dụng"
                    : "Gửi yêu cầu đặt phòng"}
            </button>

            <p className="text-xs text-center text-slate-500 pt-2">
              Lễ tân sẽ xem xét và liên hệ xác nhận trong vòng 24h
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}

export default ChiTietPhongPage;
