import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { customerApi } from "../../services/api";
import CustomerHeader from "../../components/CustomerHeader";
import LoadingSpinner from "../../components/LoadingSpinner";
import { mockRooms } from "../../data/mockRooms";

function DanhSachPhongPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [danhSachPhong, setDanhSachPhong] = useState([]);
  const [boLocLoaiPhong, setBoLocLoaiPhong] = useState("tatca");
  const [sapXepGia, setSapXepGia] = useState("macdinh");
  const [ngayNhan, setNgayNhan] = useState(searchParams.get("ngay_nhan") || "");
  const [ngayTra, setNgayTra] = useState(searchParams.get("ngay_tra") || "");
  const [dangTai, setDangTai] = useState(true);
  const [choPhepDatPhong, setChoPhepDatPhong] = useState(true);

  useEffect(() => {
    const taiDanhSachPhong = async () => {
      setDangTai(true);
      try {
        if (ngayNhan && ngayTra) {
          const { data } = await customerApi.layPhongTrongCongKhai({
            ngay_nhan: ngayNhan,
            ngay_tra: ngayTra,
          });
          const danhSachPhongTrong = Array.isArray(data?.duLieu)
            ? data.duLieu
            : [];

          if (danhSachPhongTrong.length > 0) {
            setDanhSachPhong(danhSachPhongTrong);
            setChoPhepDatPhong(true);
          } else {
            setDanhSachPhong(mockRooms);
            setChoPhepDatPhong(false);
          }
        } else {
          const { data } = await customerApi.layPhongCongKhai({
            trang: 1,
            gioi_han: 30,
          });
          const danhSachCongKhai = data?.duLieu?.duLieu || data?.duLieu || [];
          if (Array.isArray(danhSachCongKhai) && danhSachCongKhai.length > 0) {
            setDanhSachPhong(danhSachCongKhai);
            setChoPhepDatPhong(true);
          } else {
            setDanhSachPhong(mockRooms);
            setChoPhepDatPhong(false);
          }
        }
      } catch {
        setDanhSachPhong(mockRooms);
        setChoPhepDatPhong(false);
      } finally {
        setDangTai(false);
      }
    };

    taiDanhSachPhong();
  }, [ngayNhan, ngayTra]);

  const dsSauLoc = useMemo(() => {
    let ketQua = [...danhSachPhong];

    if (boLocLoaiPhong !== "tatca") {
      ketQua = ketQua.filter(
        (phong) =>
          (phong.loaiPhong?.tenLoaiPhong || "").toLowerCase() ===
          boLocLoaiPhong,
      );
    }

    if (sapXepGia === "tang") {
      ketQua.sort(
        (a, b) =>
          Number(a.loaiPhong?.giaHienTai || 0) -
          Number(b.loaiPhong?.giaHienTai || 0),
      );
    }
    if (sapXepGia === "giam") {
      ketQua.sort(
        (a, b) =>
          Number(b.loaiPhong?.giaHienTai || 0) -
          Number(a.loaiPhong?.giaHienTai || 0),
      );
    }

    return ketQua;
  }, [danhSachPhong, boLocLoaiPhong, sapXepGia]);

  const dsLoaiPhong = useMemo(() => {
    const tapLoai = new Set(
      danhSachPhong
        .map((phong) => (phong.loaiPhong?.tenLoaiPhong || "").toLowerCase())
        .filter(Boolean),
    );
    return ["tatca", ...Array.from(tapLoai)];
  }, [danhSachPhong]);

  const xuLyTim = () => {
    const params = new URLSearchParams();
    if (ngayNhan) params.set("ngay_nhan", ngayNhan);
    if (ngayTra) params.set("ngay_tra", ngayTra);
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 pt-24">
        <div className="rounded-2xl bg-white p-4 shadow-sm md:p-5">
          <h1 className="text-2xl font-bold text-slate-900">
            Khách sạn tại LumiStay
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Phong cách booking site: lọc theo ngày, loại phòng và giá.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <input
              type="date"
              value={ngayNhan}
              onChange={(e) => setNgayNhan(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 input-focus"
            />
            <input
              type="date"
              value={ngayTra}
              onChange={(e) => setNgayTra(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 input-focus"
            />
            <button
              onClick={xuLyTim}
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 btn-hover"
            >
              Cập nhật tìm kiếm
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[250px_1fr]">
          <aside className="h-fit rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
              Bộ lọc
            </h3>
            <label className="mt-3 block text-sm text-slate-600">
              Loại phòng
            </label>
            <select
              value={boLocLoaiPhong}
              onChange={(e) => setBoLocLoaiPhong(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {dsLoaiPhong.map((loai) => (
                <option key={loai} value={loai}>
                  {loai === "tatca" ? "Tất cả" : loai}
                </option>
              ))}
            </select>

            <label className="mt-3 block text-sm text-slate-600">
              Sắp xếp giá
            </label>
            <select
              value={sapXepGia}
              onChange={(e) => setSapXepGia(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="macdinh">Mặc định</option>
              <option value="tang">Giá tăng dần</option>
              <option value="giam">Giá giảm dần</option>
            </select>
          </aside>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                {dangTai ? "Đang tải..." : `${dsSauLoc.length} phòng phù hợp`}
              </p>
            </div>
            {!dangTai && !choPhepDatPhong && (
              <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Hiện đang hiển thị dữ liệu phòng mẫu để tránh trang trống. Chức
                năng đặt phòng tạm khóa khi hệ thống không lấy được phòng khả
                dụng.
              </div>
            )}

            {dangTai ? (
              <LoadingSpinner size="lg" text="Đang tìm kiếm phòng phù hợp..." />
            ) : (
              <div className="space-y-4">
                {dsSauLoc.map((phong, index) => (
                  <article
                    key={phong.id}
                    className="grid gap-4 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-[220px_1fr_180px] card-hover animate-fade-in-up"
                    style={{
                      animationDelay: `${index * 0.1}s`,
                      opacity: 0,
                      animationFillMode: "forwards",
                    }}
                  >
                    <div className="rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100 overflow-hidden h-[140px] md:h-auto">
                      <img
                        src={
                          phong.hinhAnh ||
                          `https://picsum.photos/500/360?random=${phong.id}`
                        }
                        alt={phong.loaiPhong?.tenLoaiPhong || "Phòng"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {phong.loaiPhong?.tenLoaiPhong || "Phòng tiêu chuẩn"} ·
                        #{phong.soPhong}
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        Tầng {phong.tang} • {phong.loaiPhong?.dienTich || "-"}m²
                        • {phong.loaiPhong?.soNguoiToiDa || "-"} khách
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700 badge-glow transition-all hover:scale-105">
                          Miễn phí hủy trước xác nhận
                        </span>
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700 badge-glow transition-all hover:scale-105">
                          Thanh toán tại khách sạn
                        </span>
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700 badge-glow transition-all hover:scale-105">
                          Xác nhận nhanh
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <p className="text-right text-xs text-slate-500">
                        Giá mỗi đêm từ
                      </p>
                      <p className="text-xl font-bold text-orange-600">
                        {Number(
                          phong.loaiPhong?.giaHienTai || 0,
                        ).toLocaleString("vi-VN")}
                        đ
                      </p>
                      {choPhepDatPhong ? (
                        <Link
                          to={`/phong/${phong.id}`}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 btn-hover transform transition-all"
                        >
                          Chọn phòng
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="rounded-lg bg-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 cursor-not-allowed"
                        >
                          Tạm ngưng đặt
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default DanhSachPhongPage;
