import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050/api";

const statusOptions = [
  {
    value: "choxacnhan",
    label: "Chờ xác nhận",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "daxacnhan",
    label: "Đã xác nhận",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "danhan",
    label: "Đang nhận",
    color: "bg-purple-100 text-purple-800",
  },
  {
    value: "hoanthanh",
    label: "Hoàn thành",
    color: "bg-green-100 text-green-800",
  },
  {
    value: "dahuy",
    label: "Đã hủy",
    color: "bg-red-100 text-red-800",
  },
];

const LichSuDatPhongPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState("");

  const fetchBookings = async (page = 1, status = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = { trang: page, gioi_han: 10 };
      if (status) {
        params.trang_thai = status;
      }

      const response = await axios.get(`${API_URL}/dat-phong`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.thanhCong) {
        setBookings(response.data.duLieu.duLieu);
        setTotalPages(response.data.duLieu.tongSoTrang);
        setCurrentPage(page);
      }
    } catch {
      setMessage("Lỗi tải lịch sử đặt phòng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(1, selectedStatus);
  }, [selectedStatus]);

  const getStatusColor = (status) => {
    return (
      statusOptions.find((opt) => opt.value === status)?.color ||
      "bg-gray-100 text-gray-800"
    );
  };

  const getStatusLabel = (status) => {
    return statusOptions.find((opt) => opt.value === status)?.label || status;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Lịch sử Đặt Phòng
        </h1>
        <p className="text-sm text-gray-600">
          Hiển thị toàn bộ lịch sử booking ở mọi trạng thái
        </p>

        {message && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
            {message}
          </div>
        )}

        <div className="mt-4 flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedStatus("")}
            className={`px-4 py-2 rounded ${selectedStatus === "" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            Tất cả
          </button>
          {statusOptions.map((status) => (
            <button
              key={status.value}
              onClick={() => setSelectedStatus(status.value)}
              className={`px-4 py-2 rounded ${selectedStatus === status.value ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Không có dữ liệu đặt phòng
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-3 text-left">Mã ĐP</th>
                <th className="border p-3 text-left">Khách hàng</th>
                <th className="border p-3 text-left">Phòng</th>
                <th className="border p-3 text-left">Check-in</th>
                <th className="border p-3 text-left">Check-out</th>
                <th className="border p-3 text-left">Tổng tiền</th>
                <th className="border p-3 text-left">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="border p-3 font-medium">
                    {booking.maDatPhong}
                  </td>
                  <td className="border p-3">
                    <div className="text-sm">
                      <div className="font-medium">
                        {booking.khachHang?.hoTen || "-"}
                      </div>
                      <div className="text-gray-600">
                        {booking.khachHang?.soDienThoai || "-"}
                      </div>
                    </div>
                  </td>
                  <td className="border p-3">
                    <div className="text-sm">
                      <div className="font-medium">
                        {booking.phong?.soPhong || booking.phongId || "-"}
                      </div>
                      <div className="text-gray-600">
                        {booking.phong?.loaiPhong?.tenLoaiPhong || "-"}
                      </div>
                    </div>
                  </td>
                  <td className="border p-3 text-sm">
                    {format(
                      new Date(booking.ngayNhanPhong),
                      "dd/MM/yyyy HH:mm",
                      {
                        locale: vi,
                      },
                    )}
                  </td>
                  <td className="border p-3 text-sm">
                    {format(
                      new Date(booking.ngayTraPhong),
                      "dd/MM/yyyy HH:mm",
                      {
                        locale: vi,
                      },
                    )}
                  </td>
                  <td className="border p-3 font-medium">
                    {Number(booking.tongTien || 0).toLocaleString("vi-VN")} ₫
                  </td>
                  <td className="border p-3">
                    <span
                      className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(booking.trangThai)}`}
                    >
                      {getStatusLabel(booking.trangThai)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => fetchBookings(page, selectedStatus)}
              className={`px-3 py-2 rounded ${currentPage === page ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LichSuDatPhongPage;
