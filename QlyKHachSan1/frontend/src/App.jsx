import { Navigate, Route, Routes } from "react-router-dom";
import KhungTrang from "./components/KhungTrang";
import DangNhapPage from "./pages/DangNhapPage";
import DashboardPage from "./pages/DashboardPage";
import PhongPage from "./pages/PhongPage";
import TrangChuPage from "./pages/customer/TrangChuPage";
import DanhSachPhongPage from "./pages/customer/DanhSachPhongPage";
import ChiTietPhongPage from "./pages/customer/ChiTietPhongPage";
import DangNhapKhachPage from "./pages/customer/DangNhapKhachPage";
import DangKyKhachPage from "./pages/customer/DangKyKhachPage";
import TaiKhoanPage from "./pages/customer/TaiKhoanPage";
import DatPhongPage from "./pages/admin/DatPhongPage";
import LichSuDatPhongPage from "./pages/admin/LichSuDatPhongPage";
import KhachHangPage from "./pages/admin/KhachHangPage";
import DichVuPage from "./pages/admin/DichVuPage";
import ThanhToanPage from "./pages/admin/ThanhToanPage";
import DanhGiaPage from "./pages/admin/DanhGiaPage";
import NhanVienPage from "./pages/admin/NhanVienPage";
import ChatbotWidget from "./components/ChatbotWidget";
import {
  getCurrentRole,
  getCustomerCurrentRole,
  isAdminPanelRole,
  isCustomerRole,
} from "./utils/permissions";

function BaoVeRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/admin/dang-nhap" replace />;
  }

  const role = getCurrentRole();
  if (!isAdminPanelRole(role)) {
    return <Navigate to="/dang-nhap" replace />;
  }

  return children;
}

function ChuyenHuongNeuDaDangNhap() {
  const token = localStorage.getItem("token");
  const role = getCurrentRole();

  if (token && isAdminPanelRole(role)) {
    return <Navigate to="/admin" replace />;
  }
  return <DangNhapPage />;
}

function BaoVeTaiKhoanKhach({ children }) {
  const token = localStorage.getItem("customer_token");
  const role = getCustomerCurrentRole();

  if (!token || !isCustomerRole(role)) {
    return <Navigate to="/dang-nhap" replace />;
  }

  return children;
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<TrangChuPage />} />
        <Route path="/phong" element={<DanhSachPhongPage />} />
        <Route path="/phong/:id" element={<ChiTietPhongPage />} />
        <Route path="/dang-nhap" element={<DangNhapKhachPage />} />
        <Route path="/dang-ky" element={<DangKyKhachPage />} />
        <Route
          path="/tai-khoan"
          element={
            <BaoVeTaiKhoanKhach>
              <TaiKhoanPage />
            </BaoVeTaiKhoanKhach>
          }
        />

        <Route path="/admin/dang-nhap" element={<ChuyenHuongNeuDaDangNhap />} />
        <Route
          path="/admin"
          element={
            <BaoVeRoute>
              <KhungTrang />
            </BaoVeRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="phong" element={<PhongPage />} />
          <Route path="dat-phong" element={<DatPhongPage />} />
          <Route path="lich-su-dat-phong" element={<LichSuDatPhongPage />} />
          <Route path="khach-hang" element={<KhachHangPage />} />
          <Route path="dich-vu" element={<DichVuPage />} />
          <Route path="thanh-toan" element={<ThanhToanPage />} />
          <Route path="danh-gia" element={<DanhGiaPage />} />
          <Route path="nhan-vien" element={<NhanVienPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ChatbotWidget />
    </>
  );
}

export default App;
