import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CustomerHeader from "../../components/CustomerHeader";
import { customerApi } from "../../services/api";
import { mockRooms } from "../../data/mockRooms";

function TrangChuPage() {
  const dieuHuong = useNavigate();
  const homNay = new Date().toISOString().split("T")[0];
  const [timKiem, setTimKiem] = useState({
    ngayNhan: homNay,
    ngayTra: homNay,
    soKhach: 2,
  });
  const [phongNoiBat, setPhongNoiBat] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [choPhepDatPhong, setChoPhepDatPhong] = useState(true);

  useEffect(() => {
    const taiPhongNoiBat = async () => {
      try {
        const { data } = await customerApi.layPhongCongKhai({
          trang: 1,
          gioi_han: 6,
        });
        const danhSachPhong = data?.duLieu?.duLieu || data?.duLieu || [];
        if (Array.isArray(danhSachPhong) && danhSachPhong.length > 0) {
          setPhongNoiBat(danhSachPhong);
          setChoPhepDatPhong(true);
        } else {
          setPhongNoiBat(mockRooms);
          setChoPhepDatPhong(false);
        }
      } catch {
        setPhongNoiBat(mockRooms);
        setChoPhepDatPhong(false);
      } finally {
        setDangTai(false);
      }
    };
    taiPhongNoiBat();
  }, []);

  const capNhatTimKiem = (e) => {
    const { name, value } = e.target;
    setTimKiem((truocDo) => ({ ...truocDo, [name]: value }));
  };

  const xuLyTimKiem = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({
      ngay_nhan: timKiem.ngayNhan,
      ngay_tra: timKiem.ngayTra,
      so_khach: String(timKiem.soKhach),
    });
    dieuHuong(`/phong?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <CustomerHeader />

      <main className="pt-20">
        <section className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 text-white animate-gradient overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 py-16 md:py-24">
            <div className="max-w-2xl mb-10">
              <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider mb-2">
                Khám phá thế giới
              </p>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight animate-fade-in-up">
                Tìm phòng khách sạn với giá tốt nhất
              </h1>
              <p
                className="text-blue-100 text-lg animate-fade-in-up"
                style={{ animationDelay: "0.1s" }}
              >
                Đặt phòng từ khách sạn hàng đầu, so sánh giá và nhận xác nhận
                tức thì
              </p>
            </div>

            <form
              onSubmit={xuLyTimKiem}
              className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 animate-scale-in"
              style={{
                animationDelay: "0.2s",
                opacity: 0,
                animationFillMode: "forwards",
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Địa điểm
                  </label>
                  <input
                    value="LumiStay"
                    readOnly
                    className="w-full rounded-lg border-2 border-slate-300 bg-gradient-to-br from-blue-50 to-blue-100 px-4 py-3 font-semibold text-slate-900 focus:border-blue-500 focus:outline-none transition cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Nhận phòng
                  </label>
                  <div className="relative">
                    <input
                      name="ngayNhan"
                      type="date"
                      value={timKiem.ngayNhan}
                      onChange={capNhatTimKiem}
                      className="w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-slate-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Trả phòng
                  </label>
                  <div className="relative">
                    <input
                      name="ngayTra"
                      type="date"
                      value={timKiem.ngayTra}
                      onChange={capNhatTimKiem}
                      className="w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-slate-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Khách
                  </label>
                  <select
                    name="soKhach"
                    value={timKiem.soKhach}
                    onChange={capNhatTimKiem}
                    className="w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-slate-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition appearance-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} khách
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105 btn-hover text-base md:text-lg shadow-lg"
                >
                  Tìm phòng
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="bg-slate-50 py-12">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                className="rounded-xl bg-white p-6 shadow-sm card-hover animate-fade-in-up"
                style={{
                  animationDelay: "0.3s",
                  opacity: 0,
                  animationFillMode: "forwards",
                }}
              >
                <div className="text-4xl mb-3"></div>
                <h3 className="font-bold text-slate-900 text-lg">
                  Giá rõ ràng
                </h3>
                <p className="text-sm text-slate-600 mt-2">
                  Không có phí ẩn, hiển thị giá đầy đủ theo đêm
                </p>
              </div>
              <div
                className="rounded-xl bg-white p-6 shadow-sm card-hover animate-fade-in-up"
                style={{
                  animationDelay: "0.4s",
                  opacity: 0,
                  animationFillMode: "forwards",
                }}
              >
                <div className="text-4xl mb-3"></div>
                <h3 className="font-bold text-slate-900 text-lg">
                  Xác nhận nhanh
                </h3>
                <p className="text-sm text-slate-600 mt-2">
                  Lễ tân sẽ liên hệ xác nhận trong vài phút
                </p>
              </div>
              <div
                className="rounded-xl bg-white p-6 shadow-sm card-hover animate-fade-in-up"
                style={{
                  animationDelay: "0.5s",
                  opacity: 0,
                  animationFillMode: "forwards",
                }}
              >
                <div className="text-4xl mb-3"></div>
                <h3 className="font-bold text-slate-900 text-lg">
                  Đặt phòng linh hoạt
                </h3>
                <p className="text-sm text-slate-600 mt-2">
                  Thay đổi / hủy dễ dàng trước khi xác nhận
                </p>
              </div>
            </div>
          </div>
        </section>

        {!dangTai && phongNoiBat.length > 0 && (
          <section className="py-16 bg-white">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Phòng nổi bật
              </h2>
              <p className="text-slate-600 mb-8">
                Những phòng được yêu thích nhất trên LumiStay
              </p>
              {!choPhepDatPhong && (
                <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  Hệ thống đặt phòng đang tạm gián đoạn hoặc đã hết phòng. Bạn
                  có thể tham khảo phòng mẫu, chức năng đặt phòng sẽ mở lại khi
                  hệ thống ổn định.
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {phongNoiBat.map((phong, idx) => (
                  <div
                    key={phong.id}
                    className="rounded-xl bg-white overflow-hidden shadow-md card-hover animate-fade-in-up border border-slate-100"
                    style={{
                      animationDelay: `${idx * 0.1}s`,
                      opacity: 0,
                      animationFillMode: "forwards",
                    }}
                  >
                    <div className="w-full h-48 bg-gradient-to-br from-cyan-100 to-blue-100 overflow-hidden">
                      <img
                        src={
                          phong.hinhAnh ||
                          `https://picsum.photos/400/300?random=${phong.id}`
                        }
                        alt={phong.loaiPhong?.tenLoaiPhong || "Phòng"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs text-slate-500 font-semibold uppercase">
                            Phòng #{phong.soPhong}
                          </p>
                          <h3 className="text-lg font-bold text-slate-900">
                            {phong.loaiPhong?.tenLoaiPhong ||
                              "Phòng tiêu chuẩn"}
                          </h3>
                        </div>
                        <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Tầng {phong.tang}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 mb-3">
                        {phong.loaiPhong?.dienTich}m² •{" "}
                        {phong.loaiPhong?.soNguoiToiDa} khách
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full badge-glow">
                          Miễn phí hủy
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full badge-glow">
                          Xác nhận nhanh
                        </span>
                      </div>

                      <div className="border-t pt-3 flex items-center justify-between">
                        <span className="text-sm text-slate-600">Từ</span>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-orange-600 animate-pulse-glow">
                            {Number(
                              phong.loaiPhong?.giaHienTai || 0,
                            ).toLocaleString("vi-VN")}
                            đ
                          </p>
                          <p className="text-xs text-slate-500">/ đêm</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (choPhepDatPhong) {
                            dieuHuong(`/phong/${phong.id}`);
                          }
                        }}
                        disabled={!choPhepDatPhong}
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition btn-hover disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {choPhepDatPhong ? "Chọn phòng" : "Tạm ngưng đặt"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6">Tại sao chọn LumiStay?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex gap-4 items-start">
                <div className="text-3xl">✓</div>
                <div>
                  <h3 className="font-bold mb-1">Phòng sạch sẽ & an toàn</h3>
                  <p className="text-slate-300 text-sm">
                    Tất cả phòng được vệ sinh kỹ lưỡng, đáp ứng tiêu chuẩn vệ
                    sinh cao
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="text-3xl">◉</div>
                <div>
                  <h3 className="font-bold mb-1">Đặt trên mobile dễ dàng</h3>
                  <p className="text-slate-300 text-sm">
                    Ứng dụng LumiStay cho phép đặt phòng từ bất kỳ đâu, bất kỳ
                    lúc nào
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="text-3xl">●</div>
                <div>
                  <h3 className="font-bold mb-1">Hỗ trợ 24/7</h3>
                  <p className="text-slate-300 text-sm">
                    Đội hỗ trợ khách hàng sẵn sàng giúp đỡ bất cứ lúc nào
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="text-3xl">♦</div>
                <div>
                  <h3 className="font-bold mb-1">Được tin cậy hơn 1M+ khách</h3>
                  <p className="text-slate-300 text-sm">
                    Hơn 1 triệu khách hàng đã đặt phòng thành công tại LumiStay
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-12">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
              Sẵn sàng để chuyến đi tiếp theo của bạn?
            </h2>
            <p className="text-slate-600 mb-6">
              Tìm phòng khách sạn hoàn hảo với giá tốt nhất ngay hôm nay
            </p>
            <button
              onClick={(e) => {
                e.preventDefault();
                document
                  .querySelector("form")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition transform hover:scale-105 btn-hover text-lg"
            >
              Tìm phòng ngay
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default TrangChuPage;
