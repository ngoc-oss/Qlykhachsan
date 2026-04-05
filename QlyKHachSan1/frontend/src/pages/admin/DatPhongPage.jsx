import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050/api";

const DatPhongPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [message, setMessage] = useState("");

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
  ];

  const fetchBookings = async (page = 1, status = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = { trang: page, gioi_han: 10, trang_thai_nhom: "dangxuly" };
      if (status) params.trang_thai = status;

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
      setMessage("Lỗi tải danh sách đặt phòng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(1, selectedStatus);
  }, [selectedStatus]);

  const handleStatusChange = (bookingId, action) => {
    setSelectedBooking({ id: bookingId, action });
  };

  const confirmAction = async () => {
    if (!selectedBooking) return;

    try {
      const token = localStorage.getItem("token");
      const endpoint = selectedBooking.action;

      const response = await axios.patch(
        `${API_URL}/dat-phong/${selectedBooking.id}/${endpoint}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.thanhCong) {
        setMessage(
          `${selectedBooking.action === "xac-nhan" ? "Xác nhận" : selectedBooking.action === "check-in" ? "Check-in" : "Check-out"} thành công`,
        );
        fetchBookings(currentPage, selectedStatus);
        setSelectedBooking(null);
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      setMessage(error.response?.data?.thongBao || "Lỗi cập nhật trạng thái");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn hủy đặt phòng này?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(
        `${API_URL}/dat-phong/${id}/huy`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.thanhCong) {
        setMessage("Hủy đặt phòng thành công");
        fetchBookings(currentPage, selectedStatus);
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      setMessage(error.response?.data?.thongBao || "Lỗi hủy đặt phòng");
    }
  };

  const getStatusColor = (status) => {
    return (
      statusOptions.find((opt) => opt.value === status)?.color ||
      "bg-gray-100 text-gray-800"
    );
  };

  const getActionButtons = (booking) => {
    const buttons = [];

    if (booking.trangThai === "choxacnhan") {
      buttons.push(
        <button
          key="confirm"
          onClick={() => handleStatusChange(booking.id, "xac-nhan")}
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
        >
          Xác nhận
        </button>,
      );
    }

    if (booking.trangThai === "daxacnhan") {
      buttons.push(
        <button
          key="checkin"
          onClick={() => handleStatusChange(booking.id, "check-in")}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          Check-in
        </button>,
      );
    }

    if (["choxacnhan", "daxacnhan"].includes(booking.trangThai)) {
      buttons.push(
        <button
          key="cancel"
          onClick={() => handleCancel(booking.id)}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
        >
          Hủy
        </button>,
      );
    }

    return buttons;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Quản lý Đặt Phòng
        </h1>

        {message && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
            {message}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedStatus("")}
            className={`px-4 py-2 rounded ${selectedStatus === "" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            Đang xử lý
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

      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Xác nhận thao tác</h2>
            <p className="mb-6">
              Bạn chắc chắn muốn{" "}
              {selectedBooking.action === "xac-nhan"
                ? "xác nhận"
                : selectedBooking.action === "check-in"
                  ? "check-in"
                  : "check-out"}{" "}
              đặt phòng này?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Hủy
              </button>
              <button
                onClick={confirmAction}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Không có đặt phòng</div>
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
                <th className="border p-3 text-left">Thao tác</th>
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
                        {booking.khachHang.hoTen}
                      </div>
                      <div className="text-gray-600">
                        {booking.khachHang.soDienThoai}
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
                    {booking.tongTien.toLocaleString("vi-VN")} ₫
                  </td>
                  <td className="border p-3">
                    <span
                      className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(booking.trangThai)}`}
                    >
                      {
                        statusOptions.find(
                          (opt) => opt.value === booking.trangThai,
                        )?.label
                      }
                    </span>
                  </td>
                  <td className="border p-3">
                    <div className="flex gap-2 flex-wrap">
                      {getActionButtons(booking)}
                    </div>
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

export default DatPhongPage;
