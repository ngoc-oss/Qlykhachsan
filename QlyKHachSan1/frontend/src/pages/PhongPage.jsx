import { useEffect, useState } from "react";
import { phongApi } from "../services/api";

const mauTrangThaiPhong = {
  trong: "bg-emerald-100 text-emerald-800",
  choxacnhan: "bg-amber-100 text-amber-800",
  daxacnhan: "bg-blue-100 text-blue-800",
  danhan: "bg-purple-100 text-purple-800",
  donphong: "bg-slate-200 text-slate-800",
  baotri: "bg-rose-100 text-rose-800",
};

function PhongPage() {
  const [danhSachPhong, setDanhSachPhong] = useState([]);
  const [dangTai, setDangTai] = useState(true);

  useEffect(() => {
    const taiPhong = async () => {
      try {
        const { data } = await phongApi.layDanhSach({ trang: 1, gioi_han: 20 });
        setDanhSachPhong(data.duLieu.duLieu || []);
      } finally {
        setDangTai(false);
      }
    };

    taiPhong();
  }, []);

  if (dangTai) return <p>Đang tải danh sách phòng...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Danh sách phòng</h1>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Số phòng</th>
              <th className="px-4 py-3">Loại phòng</th>
              <th className="px-4 py-3">Tầng</th>
              <th className="px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {danhSachPhong.map((phong) => (
              <tr key={phong.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {phong.soPhong}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {phong.loaiPhong?.tenLoaiPhong || "-"}
                </td>
                <td className="px-4 py-3 text-slate-700">{phong.tang}</td>
                <td className="px-4 py-3 text-slate-700">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium ${mauTrangThaiPhong[phong.trangThaiHienThi] || "bg-slate-100 text-slate-700"}`}
                    >
                      {phong.tenTrangThaiHienThi || phong.trangThai}
                    </span>
                    <span className="text-xs text-slate-500">
                      {phong.chiTietTrangThai || "-"}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PhongPage;
