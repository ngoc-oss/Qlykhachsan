import { Navigate } from "react-router-dom";
import {
  hasRole,
  hasPermission,
  hasAllPermissions,
} from "../utils/permissions";

export function RoleProtectedRoute({
  children,
  requiredRole,
  fallback = "/admin",
}) {
  const allowed = hasRole(requiredRole);

  if (!allowed) {
    return <Navigate to={fallback} replace />;
  }

  return children;
}

export function PermissionProtectedRoute({
  children,
  requiredPermission,
  fallback = "/admin",
}) {
  const allowed = hasPermission(requiredPermission);

  if (!allowed) {
    return <Navigate to={fallback} replace />;
  }

  return children;
}

export function AllPermissionsRoute({
  children,
  requiredPermissions,
  fallback = "/admin",
}) {
  const allowed = hasAllPermissions(requiredPermissions);

  if (!allowed) {
    return <Navigate to={fallback} replace />;
  }

  return children;
}

export function RoleGuard({ children, role, fallback = null }) {
  const allowed = hasRole(role);
  return allowed ? children : fallback;
}

export function PermissionGuard({ children, permission, fallback = null }) {
  const allowed = hasPermission(permission);
  return allowed ? children : fallback;
}

export function AllPermissionsGuard({
  children,
  permissions,
  fallback = null,
}) {
  const allowed = hasAllPermissions(permissions);
  return allowed ? children : fallback;
}

export function AnyPermissionGuard({ children, permissions, fallback = null }) {
  const allowed = permissions.some((perm) => hasPermission(perm));
  return allowed ? children : fallback;
}
