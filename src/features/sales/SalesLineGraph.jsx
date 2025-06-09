import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// Icons for clarity
const chartIcons = {
  daily: "📅",
  weekly: "🗓️",
  monthly: "📈",
};

/**
 * @param {Object} props
 * @param {Array<{ name: string, income: number }>} props.data
 * @param {'daily'|'weekly'|'monthly'} props.chartView
 * @param {function} props.setChartView
 */
export default function SalesLineGraph({ data, chartView, setChartView }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 mb-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-bold text-[#223163] flex items-center gap-2">
          Sales Update
        </h3>
        <div className="flex space-x-2">
          {["daily", "weekly", "monthly"].map((type) => (
            <button
              key={type}
              className={`px-3 py-1 rounded font-medium border transition flex items-center gap-1
                ${chartView === type
                  ? "bg-[#2563eb] text-white border-[#2563eb]"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"}
              `}
              onClick={() => setChartView(type)}
              aria-pressed={chartView === type}
              tabIndex={0}
            >
              <span aria-hidden="true">{chartIcons[type]}</span>
              <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis
            tickFormatter={(val) =>
              val > 1000
                ? `${(val / 1000).toFixed(1)}k`
                : val.toLocaleString()
            }
          />
          <Tooltip
            formatter={(val) => `${Number(val).toLocaleString()} ฿`}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="income"
            name="Income"
            stroke="#2563eb"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      {(!data || data.length === 0) && (
        <div className="text-center text-gray-400 text-sm py-8">No sales data for this range.</div>
      )}
    </div>
  );
}
