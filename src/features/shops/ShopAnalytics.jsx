// src/features/shops/ShopAnalytics.jsx
import React, { useMemo } from 'react';
import { Store, BarChart, TrendingUp, Activity, Users, Calendar, DollarSign, Package } from 'lucide-react';

const ShopAnalytics = ({ shops }) => {
  const analytics = useMemo(() => {
    const stats = {
      totalShops: shops.length,
      activeShops: shops.filter(s => s.status === 'active').length,
      inactiveShops: shops.filter(s => s.status === 'inactive').length,
      suspendedShops: shops.filter(s => s.status === 'suspended').length,
      totalRevenue: 0, // This would come from sales data
      shopsByMonth: {}
    };

    // Group shops by creation month
    shops.forEach(shop => {
      if (shop.createdAt) {
        const date = shop.createdAt.toDate ? shop.createdAt.toDate() : new Date(shop.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        stats.shopsByMonth[monthKey] = (stats.shopsByMonth[monthKey] || 0) + 1;
      }
    });

    return stats;
  }, [shops]);

  const StatCard = ({ icon: Icon, title, value, color, subtitle }) => (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
    </div>
  );

  return (
    <div className="mb-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={Store}
          title="Total Shops"
          value={analytics.totalShops}
          color="text-blue-500"
        />
        <StatCard
          icon={Activity}
          title="Active Shops"
          value={analytics.activeShops}
          color="text-green-500"
          subtitle={`${Math.round((analytics.activeShops / analytics.totalShops) * 100) || 0}% of total`}
        />
        <StatCard
          icon={BarChart}
          title="Inactive Shops"
          value={analytics.inactiveShops}
          color="text-gray-500"
        />
        <StatCard
          icon={DollarSign}
          title="Total Revenue"
          value="฿0"
          color="text-purple-500"
          subtitle="This month"
        />
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart size={20} />
            Shop Status Distribution
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Active</span>
                <span className="font-medium">{analytics.activeShops}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(analytics.activeShops / analytics.totalShops) * 100 || 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Inactive</span>
                <span className="font-medium">{analytics.inactiveShops}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gray-500 h-2 rounded-full"
                  style={{ width: `${(analytics.inactiveShops / analytics.totalShops) * 100 || 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Suspended</span>
                <span className="font-medium">{analytics.suspendedShops}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${(analytics.suspendedShops / analytics.totalShops) * 100 || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar size={20} />
            Recent Shop Activity
          </h3>
          <div className="space-y-3">
            {shops.slice(0, 5).map((shop, index) => (
              <div key={shop.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{shop.shopName}</p>
                  <p className="text-xs text-gray-500">
                    {shop.createdAt && 
                      `Created ${new Date(shop.createdAt.toDate ? shop.createdAt.toDate() : shop.createdAt).toLocaleDateString()}`
                    }
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  shop.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : shop.status === 'suspended'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {shop.status || 'active'}
                </span>
              </div>
            ))}
            {shops.length === 0 && (
              <p className="text-center text-gray-500 py-4">No shops yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={20} />
          Shop Growth Trend
        </h3>
        <div className="h-48 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Package size={48} className="mx-auto mb-2 text-gray-300" />
            <p>Monthly shop growth chart will appear here</p>
            <p className="text-sm">Connect with sales data for detailed analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopAnalytics;