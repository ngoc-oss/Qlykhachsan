import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Ticket,
  ReceiptText,
  Users,
  UtensilsCrossed,
  CreditCard,
  KeyRound,
  UserCog,
  Star,
} from "lucide-react";
import {
  getCurrentRole,
  hasPermission,
  PERMISSIONS,
} from "../utils/permissions";

function KhungTrang() {
  const viTri = useLocation();
  const dieuHuong = useNavigate();
  const role = getCurrentRole();

  const mucMenuChung = [
    {
      duongDan: "/admin",
      nhan: "Dashboard",
      icon: LayoutDashboard,
      chuCapPhep: PERMISSIONS.VIEW_DASHBOARD,
    },
  ];

  const mucMenuDatPhong = [
    {
      duongDan: "/admin/dat-phong",
      nhan: "Đặt phòng",
      icon: Ticket,
      chuCapPhep: PERMISSIONS.VIEW_DAT_PHONG,
    },
    {
      duongDan: "/admin/lich-su-dat-phong",
      nhan: "Lịch sử đặt phòng",
      icon: ReceiptText,
      chuCapPhep: PERMISSIONS.VIEW_DAT_PHONG,
    },
    {
      duongDan: "/admin/khach-hang",
      nhan: "Khách hàng",
      icon: Users,
      chuCapPhep: PERMISSIONS.VIEW_KHACH_HANG,
    },
  ];

  const mucMenuDichVu = [
    {
      duongDan: "/admin/dich-vu",
      nhan: "Dịch vụ",
      icon: UtensilsCrossed,
      chuCapPhep: PERMISSIONS.VIEW_DICH_VU,
    },
    {
      duongDan: "/admin/thanh-toan",
      nhan: "Thanh toán",
      icon: CreditCard,
      chuCapPhep: PERMISSIONS.VIEW_THANH_TOAN,
    },
  ];

  const mucMenuAdmin = [
    {
      duongDan: "/admin/phong",
      nhan: "Quản lý phòng",
      icon: KeyRound,
      chuCapPhep: PERMISSIONS.MANAGE_PHONG,
    },
    {
      duongDan: "/admin/nhan-vien",
      nhan: "Nhân viên",
      icon: UserCog,
      chuCapPhep: PERMISSIONS.MANAGE_NHAN_VIEN,
    },
    {
      duongDan: "/admin/danh-gia",
      nhan: "Đánh giá AI",
      icon: Star,
      chuCapPhep: PERMISSIONS.MANAGE_DANH_GIA,
    },
  ];

  const mucMenuLoc = (menu) =>
    menu.filter((muc) => hasPermission(muc.chuCapPhep));

  const mucMenuHienThi = [
    ...mucMenuChung,
    ...mucMenuLoc(mucMenuDatPhong),
    ...mucMenuLoc(mucMenuDichVu),
    ...mucMenuLoc(mucMenuAdmin),
  ];

  const getLabelRole = () => {
    switch (role) {
      case "admin":
        return " Quản trị viên";
      case "letan":
        return " Lễ tân";
      default:
        return "Nhân viên";
    }
  };

  const dangXuat = () => {
    localStorage.removeItem("token");
    dieuHuong("/admin/dang-nhap");
  };

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[280px_1fr]">
      <aside className="flex flex-col gap-4 bg-gradient-to-b from-slate-900 to-slate-800 p-6 text-white">
        <div>
          <h2 className="m-0 text-xl font-semibold"> QlyK Hotel</h2>
          <p className="m-0 text-xs text-slate-400 mt-1">{getLabelRole()}</p>
        </div>

        <div className="h-px bg-slate-700"></div>

        <nav className="flex flex-col gap-1">
          {mucMenuHienThi.map((muc) => {
            const Icon = muc.icon;
            return (
              <Link
                key={muc.duongDan}
                to={muc.duongDan}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  viTri.pathname === muc.duongDan
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <span className="mr-2 inline-flex items-center">
                  <Icon size={16} strokeWidth={2} />
                </span>
                {muc.nhan}
              </Link>
            );
          })}
        </nav>

        {role === "admin" && (
          <>
            <div className="h-px bg-slate-700 mt-2"></div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold pb-1 pt-2">
              Quản trị
            </p>
          </>
        )}

        <button
          className="mt-auto rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium hover:bg-rose-700 transition-all hover:shadow-md"
          onClick={dangXuat}
        >
          Đăng xuất
        </button>
      </aside>

      <main className="bg-slate-100 p-5 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default KhungTrang;
