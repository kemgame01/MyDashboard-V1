import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import InventoryHistoryFilterBar from "./InventoryHistoryFilterBar";

const ROWS_OPTIONS = [10, 20, 50, 100];

function compare(a, b, field, direction) {
  let av = a[field];
  let bv = b[field];
  if (field === "timestamp") {
    av = a.timestamp?.toDate?.() || new Date(0);
    bv = b.timestamp?.toDate?.() || new Date(0);
  }
  if (field === "changedBy") {
    av = a.changedBy?.name || "";
    bv = b.changedBy?.name || "";
  }
  if (typeof av === "string") av = av.toLowerCase();
  if (typeof bv === "string") bv = bv.toLowerCase();
  if (av < bv) return direction === "asc" ? -1 : 1;
  if (av > bv) return direction === "asc" ? 1 : -1;
  return 0;
}

const SORT_FIELDS = [
  { key: "timestamp", label: "Time", className: "min-w-[150px]" },
  { key: "productName", label: "Product", className: "min-w-[180px]" },
  { key: "changeType", label: "Type", className: "min-w-[100px]" },
  { key: "changeAmount", label: "Change", className: "min-w-[90px] text-right" },
  { key: "changedBy", label: "By", className: "min-w-[120px]" },
];

const InventoryHistory = ({ userId, productFilter = "" }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination, search, sorting, filters
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState("timestamp");
  const [sortDir, setSortDir] = useState("desc");

  // Modular filters
  const [search, setSearch] = useState("");
  const [actionType, setActionType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      const q = query(
        collection(db, `users/${userId}/inventoryHistory`),
        orderBy("timestamp", "desc")
      );
      const snap = await getDocs(q);
      setHistory(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
      setLoading(false);
      setPage(0);
    }
    if (userId) fetchHistory();
  }, [userId]);

  // Modular filtering
  const filtered = history.filter(h => {
    if (productFilter && h.productName !== productFilter) return false;
    if (search && ![h.productName, h.changeType, h.note].some(x => (x || "").toLowerCase().includes(search.toLowerCase()))) return false;
    if (actionType && h.changeType !== actionType) return false;
    if (startDate && (!h.timestamp || h.timestamp.toDate() < new Date(startDate))) return false;
    if (endDate && (!h.timestamp || h.timestamp.toDate() > new Date(endDate + "T23:59:59"))) return false;
    return true;
  });

  // Sorting
  const sorted = filtered.slice().sort((a, b) => compare(a, b, sortField, sortDir));
  const totalRows = sorted.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const pageHistory = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  function handleSort(field) {
    if (sortField === field) {
      setSortDir(dir => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(0);
  }

  function handleExportCSV() {
    const fields = [
      "timestamp", "productName", "changeType", "changeAmount", "quantityBefore", "quantityAfter", "changedBy", "note"
    ];
    const csvRows = [
      fields.join(","),
      ...sorted.map(h =>
        [
          h.timestamp?.toDate?.().toLocaleString?.() || "",
          `"${h.productName || ""}"`,
          h.changeType,
          h.changeAmount,
          h.quantityBefore,
          h.quantityAfter,
          `"${h.changedBy?.name || ""}"`,
          `"${h.note || ""}"`
        ].join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory_history.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Pagination controls (2025 style)
  const handlePage = (p) => setPage(p);

  if (loading)
    return (
      <div className="flex items-center justify-center py-12">
        <span className="animate-spin mr-2 text-blue-600">&#9696;</span>
        <span className="font-semibold text-blue-600">Loading inventory history...</span>
      </div>
    );

  if (!history.length)
    return <div className="py-8 text-gray-500 text-center">No inventory history yet.</div>;

  return (
    <div className="p-4 mx-auto max-w-screen-2xl">
      <h2 className="text-2xl font-bold mb-6 text-blue-800">Inventory History</h2>
      <InventoryHistoryFilterBar
        search={search}
        setSearch={setSearch}
        actionType={actionType}
        setActionType={setActionType}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onExportCSV={handleExportCSV}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        totalRows={totalRows}
      />

      <div className="rounded-xl shadow overflow-x-auto bg-white">
        <table className="min-w-full table-auto">
          <thead className="bg-blue-50">
            <tr>
              {SORT_FIELDS.map(({ key, label, className }) => (
                <th
                  key={key}
                  className={`px-4 py-2 text-left font-semibold text-gray-700 cursor-pointer select-none ${className}`}
                  onClick={() => handleSort(key)}
                  scope="col"
                >
                  <span className="flex items-center gap-1">
                    {label}
                    {sortField === key && (
                      <svg
                        className="h-3 w-3"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden="true"
                      >
                        {sortDir === "asc" ? (
                          <path d="M8 4l4 6H4l4-6z" fill="currentColor" />
                        ) : (
                          <path d="M8 12l-4-6h8l-4 6z" fill="currentColor" />
                        )}
                      </svg>
                    )}
                  </span>
                </th>
              ))}
              <th className="px-4 py-2 text-right font-semibold text-gray-700 min-w-[120px]">From → To</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700 min-w-[180px]">Note</th>
            </tr>
          </thead>
          <tbody>
            {pageHistory.map((h, idx) => (
              <tr
                key={h.id}
                className={
                  idx % 2 === 0
                    ? "bg-white hover:bg-blue-50"
                    : "bg-gray-50 hover:bg-blue-50"
                }
              >
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  {h.timestamp?.toDate?.().toLocaleString?.() || ""}
                </td>
                <td className="px-4 py-2 font-medium max-w-[200px] truncate" title={h.productName}>
                  {h.productName?.length > 28 ? h.productName.slice(0, 28) + "…" : h.productName}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      h.changeType === "add"
                        ? "bg-green-100 text-green-800"
                        : h.changeType === "delete"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {h.changeType?.charAt(0).toUpperCase() + h.changeType?.slice(1)}
                  </span>
                </td>
                <td className={`px-4 py-2 text-right font-mono ${
                  h.changeAmount > 0 ? "text-green-600" : h.changeAmount < 0 ? "text-red-600" : "text-gray-700"
                }`}>
                  {h.changeAmount > 0 ? "+" : ""}
                  {h.changeAmount}
                </td>
                <td className="px-4 py-2 text-gray-700 text-sm max-w-[120px] truncate" title={h.changedBy?.name || "Unknown"}>
                  {(h.changedBy?.name || "Unknown").length > 18
                    ? (h.changedBy?.name || "Unknown").slice(0, 18) + "…"
                    : h.changedBy?.name || "Unknown"}
                </td>
                <td className="px-4 py-2 text-right text-xs">
                  {h.quantityBefore} → <span className="font-bold text-blue-800">{h.quantityAfter}</span>
                </td>
                <td className="px-4 py-2 text-xs text-gray-500 max-w-[260px] truncate" title={h.note}>
                  {h.note?.length > 35 ? h.note.slice(0, 35) + "…" : h.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-3 text-xs text-gray-500">
        <div>
          Showing {totalRows === 0 ? 0 : page * rowsPerPage + 1}–
          {Math.min((page + 1) * rowsPerPage, totalRows)} of {totalRows} entries
        </div>
        <div className="flex gap-1">
          <button
            className="px-2 py-1 rounded bg-gray-200 hover:bg-blue-200"
            onClick={() => handlePage(0)}
            disabled={page === 0}
            aria-label="First page"
          >{"<<"}</button>
          <button
            className="px-2 py-1 rounded bg-gray-200 hover:bg-blue-200"
            onClick={() => handlePage(Math.max(0, page - 1))}
            disabled={page === 0}
            aria-label="Previous page"
          >{"<"}</button>
          <span className="px-2 py-1">{page + 1} / {totalPages}</span>
          <button
            className="px-2 py-1 rounded bg-gray-200 hover:bg-blue-200"
            onClick={() => handlePage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            aria-label="Next page"
          >{">"}</button>
          <button
            className="px-2 py-1 rounded bg-gray-200 hover:bg-blue-200"
            onClick={() => handlePage(totalPages - 1)}
            disabled={page >= totalPages - 1}
            aria-label="Last page"
          >{">>"}</button>
        </div>
      </div>
    </div>
  );
};

export default InventoryHistory;
