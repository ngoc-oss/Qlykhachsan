import { useEffect, useState } from "react";
import { datPhongApi } from "../services/api";

function DatPhongPage() {
  const [danhSachDatPhong, setDanhSachDatPhong] = useState([]);
  const [dangTai, setDangTai] = useState(true);

  useEffect(() => {
    const taiDatPhong = async () => {
      try {
        const { data } = await datPhongApi.layDanhSach({
          trang: 1,
          gioi_han: 20,
        });
        setDanhSachDatPhong(data.duLieu.duLieu || []);
      } finally {
        setDangTai(false);
      }
    };

    taiDatPhong();
  }, []);

  if (dangTai) return <p>Đang tải danh sách đặt phòng...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">
        Danh sách đặt phòng
      </h1>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Mã đặt phòng</th>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Phòng</th>
              <th className="px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {danhSachDatPhong.map((datPhong) => (
              <tr key={datPhong.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {datPhong.maDatPhong}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {datPhong.khachHang?.hoTen || "-"}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {datPhong.phong?.soPhong || "-"}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {datPhong.trangThai}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DatPhongPage;
