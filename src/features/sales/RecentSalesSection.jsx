import React, { useState, useMemo, useEffect } from "react";
import { useInventory } from "../../hooks/useInventory";
import useCustomers from "../../hooks/useCustomers";
import { exportCSV } from "../../utils/exportCSV";
import StyledDatePicker from "../../components/StyledDatePicker";

export default function RecentSalesSection({ user, sales }) {
  // Default Start Date: today
  const [dateStart, setDateStart] = useState(new Date());
  const [dateEnd, setDateEnd] = useState(null);
  const [channelFilter, setChannelFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 20;

  const inventory = useInventory(user);
  const customers = useCustomers(user?.uid, "");

  useEffect(() => { setPage(1); }, [
    dateStart, dateEnd, channelFilter, productFilter, customerFilter, search
  ]);

  const productOptions = useMemo(() => {
    const all = (inventory.inventory || []).map(p => p.name).filter(Boolean);
    return Array.from(new Set(all));
  }, [inventory.inventory]);

  const customerOptions = useMemo(() => {
    const all = (customers || []).map(c => c.name).filter(Boolean);
    return Array.from(new Set(all));
  }, [customers]);

  const channelOptions = ["", "Facebook", "LINE", "Shopee", "Lazada", "Other"];

  const filteredSales = useMemo(() => {
    return (sales || []).filter(sale => {
      let date = sale.date?.toDate ? sale.date.toDate() : new Date(sale.date);

      // Date Range Filter (date only, ignore time)
      if (dateStart && date < new Date(dateStart.setHours(0,0,0,0))) return false;
      if (dateEnd && date > new Date(dateEnd.setHours(23,59,59,999))) return false;

      // Channel
      if (channelFilter && sale.channel !== channelFilter) return false;

      // Product
      let prodName = sale.productName || (sale.products?.[0]?.productName) || "";
      if (productFilter && prodName !== productFilter) return false;

      // Customer
      if (customerFilter && sale.customerName !== customerFilter) return false;

      // Search (case-insensitive)
      if (search) {
        const searchLower = search.toLowerCase();
        const fields = [
          sale.customerName, prodName, sale.channel,
          sale.amount, date.toLocaleDateString("en-GB")
        ];
        if (!fields.some(f => (f || "").toString().toLowerCase().includes(searchLower))) return false;
      }
      return true;
    });
  }, [sales, dateStart, dateEnd, channelFilter, productFilter, customerFilter, search]);

  const pagedSales = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredSales.slice(start, start + rowsPerPage);
  }, [filteredSales, page]);

  const totalAmount = useMemo(
    () => filteredSales.reduce((sum, s) => sum + Number(s.amount || (s.products?.[0]?.amount) || 0), 0),
    [filteredSales]
  );

  const handleExport = () => {
    if (!filteredSales.length) {
      alert("No data to export!");
      return;
    }
    exportCSV("sales-report.csv", filteredSales);
  };

  const formatTime = date => {
    try {
      const d = date?.toDate ? date.toDate() : new Date(date);
      return d.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Bangkok"
      });
    } catch {
      return "-";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow mb-8 p-4 sm:p-8 w-full">
      {/* --- Filters --- */}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <span className="font-medium text-[#223163]">Date:</span>
        <StyledDatePicker
          selected={dateStart}
          onChange={date => setDateStart(date)}
          placeholder="Start date"
        />
        <span>-</span>
        <StyledDatePicker
          selected={dateEnd}
          onChange={date => setDateEnd(date)}
          placeholder="End date"
        />
        <select
          value={channelFilter}
          onChange={e => setChannelFilter(e.target.value)}
          className="border border-gray-300 p-2 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
        >
          <option value="">All Channels</option>
          {channelOptions.slice(1).map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <select
          value={productFilter}
          onChange={e => setProductFilter(e.target.value)}
          className="border border-gray-300 p-2 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
        >
          <option value="">All Products</option>
          {productOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <select
          value={customerFilter}
          onChange={e => setCustomerFilter(e.target.value)}
          className="border border-gray-300 p-2 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
        >
          <option value="">All Customers</option>
          {customerOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {/* Styled search box */}
        <input
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] w-[180px]"
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          onClick={handleExport}
          className="bg-[#2563eb] text-white px-4 py-2 rounded-lg ml-2 font-semibold hover:bg-[#1a4ecb] transition"
        >
          Export
        </button>
      </div>
      {/* --- Total Sales --- */}
      <div className="mb-2 font-bold text-right">
        Total Sales:{" "}
        <span className="text-[#2563eb]">
          {totalAmount.toLocaleString()} ฿
        </span>
      </div>
      {/* --- Table --- */}
      <table className="min-w-full text-xs sm:text-sm">
        <thead>
          <tr className="bg-[#F1F3F7]">
            <th className="p-2 sm:p-3 text-left font-semibold text-[#223163]">Time</th>
            <th className="p-2 sm:p-3 text-left font-semibold text-[#223163]">Customer</th>
            <th className="p-2 sm:p-3 text-left font-semibold text-[#223163]">Product</th>
            <th className="p-2 sm:p-3 text-left font-semibold text-[#223163]">Channel</th>
            <th className="p-2 sm:p-3 text-right font-semibold text-[#223163]">Amount (฿)</th>
          </tr>
        </thead>
        <tbody>
          {pagedSales.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-4 text-center text-gray-400">No sales found.</td>
            </tr>
          ) : pagedSales.map(sale => (
            <tr key={sale.id} className="border-b hover:bg-[#F5F7FB] transition">
              <td className="p-2 sm:p-3">{formatTime(sale.date)}</td>
              <td className="p-2 sm:p-3">{sale.customerName || "-"}</td>
              <td className="p-2 sm:p-3">{sale.productName || (sale.products?.[0]?.productName) || "-"}</td>
              <td className="p-2 sm:p-3">{sale.channel}</td>
              <td className="p-2 sm:p-3 text-right font-bold">{Number(sale.amount || (sale.products?.[0]?.amount) || 0).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Pagination */}
      {filteredSales.length > rowsPerPage && (
        <div className="flex justify-end mt-2 gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-2 py-1 border rounded-lg disabled:opacity-50">Prev</button>
          <span className="px-2 py-1">Page {page} / {Math.ceil(filteredSales.length / rowsPerPage)}</span>
          <button disabled={page >= Math.ceil(filteredSales.length / rowsPerPage)} onClick={() => setPage(p => p + 1)}
            className="px-2 py-1 border rounded-lg disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
