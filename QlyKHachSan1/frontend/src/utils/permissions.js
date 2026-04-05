function parseJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(""),
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getCurrentRole() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const payload = parseJwtPayload(token);
    if (!payload) return null;

    return payload.vaiTro || null;
  } catch {
    return null;
  }
}

export function getCustomerCurrentRole() {
  try {
    const token = localStorage.getItem("customer_token");
    if (!token) return null;

    const payload = parseJwtPayload(token);
    if (!payload) return null;

    return payload.vaiTro || null;
  } catch {
    return null;
  }
}

export function isCustomerRole(role) {
  return role === "khach_hang";
}

export function isAdminPanelRole(role) {
  return ["admin", "letan", "nhanvien"].includes(role);
}

export function hasRole(requiredRole) {
  const currentRole = getCurrentRole();
  if (!currentRole) return false;

  if (typeof requiredRole === "string") {
    return currentRole === requiredRole;
  }

  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(currentRole);
  }

  return false;
}

export function hasPermission(permission) {
  const role = getCurrentRole();
  if (!role) return false;

  const permissions = {
    admin: [
      "view:dashboard",
      "view:reports",
      "manage:phong",
      "create:phong",
      "edit:phong",
      "delete:phong",
      "manage:loai-phong",
      "create:loai-phong",
      "edit:loai-phong",
      "edit:loai-phong:gia",
      "delete:loai-phong",
      "manage:dat-phong",
      "view:dat-phong",
      "confirm:dat-phong",
      "cancel:dat-phong",
      "manage:khach-hang",
      "view:khach-hang",
      "edit:khach-hang",
      "manage:dich-vu",
      "create:dich-vu",
      "edit:dich-vu",
      "delete:dich-vu",
      "manage:thanh-toan",
      "create:thanh-toan",
      "edit:thanh-toan",
      "view:danh-gia",
      "manage:danh-gia",
      "manage:nhan-vien",
      "create:nhan-vien",
      "edit:nhan-vien",
      "delete:nhan-vien",
      "manage:system",
      "view:reports",
    ],
    letan: [
      "view:dashboard",
      "view:dat-phong",
      "confirm:dat-phong",
      "checkin:dat-phong",
      "checkout:dat-phong",
      "view:dat-phong:detail",
      "view:khach-hang",
      "add-service:dat-phong",
      "view:dich-vu",
      "create:thanh-toan",
      "view:thanh-toan",
      "view:danh-gia",
    ],
    nhanvien: ["view:dashboard", "view:dat-phong", "view:dat-phong:detail"],
  };

  const userPermissions = permissions[role] || [];
  return userPermissions.includes(permission);
}

export function hasAllPermissions(permissionList) {
  if (!Array.isArray(permissionList)) return false;
  return permissionList.every((perm) => hasPermission(perm));
}

export function hasAnyPermission(permissionList) {
  if (!Array.isArray(permissionList)) return false;
  return permissionList.some((perm) => hasPermission(perm));
}

export const ROLES = {
  ADMIN: "admin",
  LETAN: "letan",
  NHANVIEN: "nhanvien",
};

export const PERMISSIONS = {
  VIEW_DASHBOARD: "view:dashboard",
  VIEW_REPORTS: "view:reports",
  MANAGE_PHONG: "manage:phong",
  CREATE_PHONG: "create:phong",
  EDIT_PHONG: "edit:phong",
  DELETE_PHONG: "delete:phong",
  MANAGE_LOAI_PHONG: "manage:loai-phong",
  CREATE_LOAI_PHONG: "create:loai-phong",
  EDIT_LOAI_PHONG: "edit:loai-phong",
  EDIT_GIA_PHONG: "edit:loai-phong:gia",
  DELETE_LOAI_PHONG: "delete:loai-phong",
  MANAGE_DAT_PHONG: "manage:dat-phong",
  VIEW_DAT_PHONG: "view:dat-phong",
  CONFIRM_DAT_PHONG: "confirm:dat-phong",
  CANCEL_DAT_PHONG: "cancel:dat-phong",
  CHECKIN_DAT_PHONG: "checkin:dat-phong",
  CHECKOUT_DAT_PHONG: "checkout:dat-phong",
  VIEW_DAT_PHONG_DETAIL: "view:dat-phong:detail",
  MANAGE_KHACH_HANG: "manage:khach-hang",
  VIEW_KHACH_HANG: "view:khach-hang",
  EDIT_KHACH_HANG: "edit:khach-hang",
  MANAGE_DICH_VU: "manage:dich-vu",
  CREATE_DICH_VU: "create:dich-vu",
  EDIT_DICH_VU: "edit:dich-vu",
  DELETE_DICH_VU: "delete:dich-vu",
  ADD_SERVICE_DAT_PHONG: "add-service:dat-phong",
  VIEW_DICH_VU: "view:dich-vu",
  MANAGE_THANH_TOAN: "manage:thanh-toan",
  CREATE_THANH_TOAN: "create:thanh-toan",
  EDIT_THANH_TOAN: "edit:thanh-toan",
  VIEW_THANH_TOAN: "view:thanh-toan",
  VIEW_DANH_GIA: "view:danh-gia",
  MANAGE_DANH_GIA: "manage:danh-gia",
  MANAGE_NHAN_VIEN: "manage:nhan-vien",
  CREATE_NHAN_VIEN: "create:nhan-vien",
  EDIT_NHAN_VIEN: "edit:nhan-vien",
  DELETE_NHAN_VIEN: "delete:nhan-vien",
  MANAGE_SYSTEM: "manage:system",
};
