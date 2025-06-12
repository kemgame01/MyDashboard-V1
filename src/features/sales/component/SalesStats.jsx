import React from 'react';

const SalesStats = ({ totals = {}, shopContext }) => {
  const formatCurrency = (amount) => `${(amount || 0).toLocaleString()}฿`;

  const stats = [
    { label: 'Today', value: totals.daily, icon: '💸', color: '#2563eb' },
    { label: 'This Week', value: totals.weekly, icon: '📆', color: '#38b2ac' },
    { label: 'This Month', value: totals.monthly, icon: '📈', color: '#6C63FF' },
    { label: 'This Year', value: totals.yearly, icon: '🎯', color: '#FF6F91' }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-4 border-l-4" style={{ borderLeftColor: stat.color }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stat.value)}</p>
            </div>
            <div className="text-2xl">{stat.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SalesStats;