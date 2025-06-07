import React from "react";

const ACTION_TYPES = [
  { label: "All Types", value: "" },
  { label: "Add", value: "add" },
  { label: "Edit", value: "edit" },
  { label: "Delete", value: "delete" },
];

export default function InventoryHistoryFilterBar({
  search,
  setSearch,
  actionType,
  setActionType,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onExportCSV,
}) {
  return (
    <div className="flex flex-wrap gap-3 mb-3 items-end">
      <input
        className="border p-2 rounded-xl"
        placeholder="Search logs…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ minWidth: 180 }}
      />
      <select
        className="border rounded-xl p-2"
        value={actionType}
        onChange={e => setActionType(e.target.value)}
      >
        {ACTION_TYPES.map(opt => (
          <option value={opt.value} key={opt.value}>{opt.label}</option>
        ))}
      </select>
      <label className="text-sm text-gray-600">
        From:
        <input
          type="date"
          className="border rounded-xl ml-1 p-1"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
        />
      </label>
      <label className="text-sm text-gray-600">
        To:
        <input
          type="date"
          className="border rounded-xl ml-1 p-1"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
        />
      </label>
      <button
        onClick={onExportCSV}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Export to CSV
      </button>
    </div>
  );
}
