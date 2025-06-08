import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

/**
 * @param {{
 *   data: Array<{ name: string, income: number }>,
 *   chartView: 'daily'|'weekly'|'monthly',
 *   setChartView: (view: string) => void
 * }}
 */
export default function SalesLineGraph({ data, chartView, setChartView }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[#223163]">Sales Update</h3>
        <div className="flex space-x-2">
          {['daily', 'weekly', 'monthly'].map(type => (
            <button
              key={type}
              className={`px-3 py-1 rounded font-medium border transition 
                ${chartView === type
                  ? "bg-[#2563eb] text-white border-[#2563eb]"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"}
              `}
              onClick={() => setChartView(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="income"
            name="Income"
            stroke="#2563eb"
            strokeWidth={3}
            dot={false}
            fillOpacity={0.2}
            fill="url(#incomeFill)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
