// src/features/sales/components/SalesChart.jsx
import React from 'react';

const SalesChart = ({ data = [], chartView, onChartViewChange, shopContext }) => {
  const chartViews = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Sales Trend {shopContext && `- ${shopContext.shopName}`}
        </h3>
        <div className="flex space-x-2">
          {chartViews.map(view => (
            <button
              key={view.key}
              onClick={() => onChartViewChange(view.key)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                chartView === view.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-64 flex items-center justify-center text-gray-500">
        {data.length > 0 ? (
          <div>
            <div className="text-4xl mb-2">📈</div>
            <p>Chart showing {data.length} data points</p>
            <p className="text-sm">({chartView} view)</p>
          </div>
        ) : (
          <div>
            <div className="text-4xl mb-2">📊</div>
            <p>No sales data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesChart;