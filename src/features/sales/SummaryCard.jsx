// src/features/sales/SummaryCard.jsx

import React from "react";

export default function SummaryCard({ label, value, icon, color }) {
  return (
    <div
      className="rounded-2xl shadow-md flex flex-col items-center justify-center p-3 sm:p-5 min-w-[110px] bg-white border-t-4"
      style={{
        borderColor: color,
      }}
    >
      <div className="text-2xl sm:text-3xl mb-1" style={{ color }}>{icon}</div>
      <div className="text-lg sm:text-xl font-bold text-[#223163]">{value.toLocaleString()} ฿</div>
      <div className="text-xs text-[#2563eb] font-semibold mt-1">{label}</div>
    </div>
  );
}
