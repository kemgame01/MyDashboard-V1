// src/features/customers/BulkActionBar.js
import React from "react";

export default function BulkActionBar({
  selectedCount,
  onBulkDelete,
  onBulkExport,
  onBulkTag,
}) {
  if (selectedCount === 0) return null;
  return (
    <div className="bg-blue-100 border border-blue-300 rounded mb-2 p-2 flex items-center gap-4">
      <span>{selectedCount} selected</span>
      <button
        className="text-red-600 hover:underline"
        onClick={onBulkDelete}
      >
        Delete
      </button>
      <button
        className="text-blue-700 hover:underline"
        onClick={onBulkExport}
      >
        Export
      </button>
      <select
        className="ml-2 border rounded"
        onChange={(e) => e.target.value && onBulkTag(e.target.value)}
        defaultValue=""
      >
        <option value="" disabled>Tag as...</option>
        <option value="VIP">VIP</option>
        <option value="Blocked">Blocked</option>
        <option value="New">New</option>
      </select>
    </div>
  );
}
