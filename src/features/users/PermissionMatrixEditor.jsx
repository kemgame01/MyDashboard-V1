import React from "react";
const PERMISSIONS = [
  { key: "canViewInventory", label: "View Inventory" },
  { key: "canEditInventory", label: "Edit Inventory" },
  { key: "canExportUsers", label: "Export Users" },
  { key: "canDeleteUsers", label: "Delete Users" }
];
const PermissionMatrixEditor = ({ permissions = {}, onChange }) => (
  <div className="flex flex-col gap-1 mb-2">
    <span className="font-semibold mb-1 text-xs">Permissions:</span>
    {PERMISSIONS.map(p => (
      <label key={p.key} className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={!!permissions[p.key]}
          onChange={e => onChange({ ...permissions, [p.key]: e.target.checked })}
        />
        {p.label}
      </label>
    ))}
  </div>
);
export default PermissionMatrixEditor;
