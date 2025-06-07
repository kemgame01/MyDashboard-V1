// src/utils/permissions.js

export const ROLES = ["admin", "manager", "staff", "viewer"];

export function normalizeRole(role) {
  if (!role) return "";
  return String(role).toLowerCase();
}

export function canEditProfile(currentUser, profileUser) {
  if (!currentUser || !profileUser) return false;
  const role = normalizeRole(currentUser.role);
  return (
    currentUser.isRootAdmin ||
    role === "admin" ||
    currentUser.uid === profileUser.id
  );
}

export function canEditRoles(currentUser) {
  if (!currentUser) return false;
  const role = normalizeRole(currentUser.role);
  return currentUser.isRootAdmin || role === "admin";
}
