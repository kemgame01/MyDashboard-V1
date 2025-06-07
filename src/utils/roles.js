// src/utils/roles.js

// Master list of roles, labels, and badge colors for your UI
export const ROLES = [
  { value: "admin", label: "Admin", color: "bg-blue-100 text-blue-800" },
  { value: "manager", label: "Manager", color: "bg-green-100 text-green-800" },
  { value: "staff", label: "Staff", color: "bg-yellow-100 text-yellow-800" },
  { value: "sales", label: "Sales", color: "bg-purple-100 text-purple-800" },
  { value: "viewer", label: "Viewer", color: "bg-gray-100 text-gray-700" }
];

// Normalize a role (for DB/storage)
export function normalizeRole(role) {
  if (!role) return "";
  return String(role).toLowerCase();
}

// UI label for a role
export function getRoleLabel(role) {
  const found = ROLES.find(r => r.value === normalizeRole(role));
  return found ? found.label : role || "-";
}

// UI badge color for a role
export function getRoleColor(role) {
  const found = ROLES.find(r => r.value === normalizeRole(role));
  return found ? found.color : "bg-gray-100 text-gray-700";
}

// Export for use in Selectors: just value/label pairs
export const ROLE_OPTIONS = ROLES.map(({ value, label }) => ({ value, label }));

// Permission checks

// Can this user manage inventory?
export function canManageInventory(role, isRoot) {
  const r = normalizeRole(role);
  return isRoot || r === "admin" || r === "manager";
}

// Can this user edit roles (admin/root)?
export function canEditRoles(currentUser) {
  if (!currentUser) return false;
  return currentUser.isRootAdmin === true || normalizeRole(currentUser.role) === "admin";
}

// Can this user edit a profile (self, admin, root)?
export function canEditProfile(currentUser, profileUser) {
  const r = normalizeRole(currentUser?.role);
  return (
    currentUser?.isRootAdmin ||
    r === "admin" ||
    currentUser?.uid === profileUser?.id
  );
}

// Example: Add more permission checks as needed!
export function canViewAuditLog(currentUser) {
  return canEditRoles(currentUser);
}

