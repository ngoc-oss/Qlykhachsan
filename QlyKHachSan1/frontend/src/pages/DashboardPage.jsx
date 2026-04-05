import { useEffect, useState } from "react";
import { phongApi, datPhongApi } from "../services/api";

function DashboardPage() {
  const [tongPhong, setTongPhong] = useState(0);
  const [tongDatPhong, setTongDatPhong] = useState(0);
  const [dangTai, setDangTai] = useState(true);

  useEffect(() => {
    const taiDuLieu = async () => {
      try {
        const [duLieuPhong, duLieuDatPhong] = await Promise.all([
          phongApi.layDanhSach({ trang: 1, gioi_han: 100 }),
          datPhongApi.layDanhSach({ trang: 1, gioi_han: 100 }),
        ]);
        setTongPhong(duLieuPhong.data.duLieu.tongSo || 0);
        setTongDatPhong(duLieuDatPhong.data.duLieu.tongSo || 0);
      } finally {
        setDangTai(false);
      }
    };

    taiDuLieu();
  }, []);

  if (dangTai) return <p>Đang tải dữ liệu...</p>;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-slate-900">
        Tổng quan hệ thống
      </h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500">Tổng số phòng</h3>
          <p className="mt-2 text-3xl font-bold text-slate-900">{tongPhong}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500">
            Tổng đơn đặt phòng
          </h3>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {tongDatPhong}
          </p>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
