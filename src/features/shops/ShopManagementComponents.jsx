// src/features/shops/ShopManagementComponents.jsx
import React from 'react';

// Import the components from their dedicated files
import ShopAssignmentModal from './ShopAssignmentModal';
import UserShopAssignments from './UserShopAssignments';

import { getCurrentShop, getUserShops } from '../../utils/shopPermissions';

// ShopSelector Component with includeAllOption support
const ShopSelector = ({ user, onShopChange, shops, selectedShop, includeAllOption = false }) => {
  // If shops prop is provided, use it (for RoleManagementSection)
  if (shops && selectedShop !== undefined) {
    return (
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Shop Filter:</label>
        <select
          value={selectedShop}
          onChange={(e) => onShopChange(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {includeAllOption && <option value="all">All Shops</option>}
          {shops.map(shop => (
            <option key={shop.id || shop.shopId} value={shop.id || shop.shopId}>
              {shop.shopName}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Original behavior for user's assigned shops
  const currentShop = getCurrentShop(user);
  const userShops = getUserShops(user);

  if (userShops.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg">
        <span className="text-sm font-medium text-blue-900">🏪</span>
        <span className="text-sm font-semibold text-blue-900">
          {currentShop?.shopName || 'No Shop Assigned'}
        </span>
        {currentShop?.isOwner && (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Owner</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">🏪 Shop:</span>
      <select
        value={currentShop?.shopId || ''}
        onChange={(e) => onShopChange(e.target.value)}
        className="text-sm font-semibold bg-blue-50 border border-blue-200 rounded-lg px-3 py-1 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {userShops.map(shop => (
          <option key={shop.shopId} value={shop.shopId}>
            {shop.shopName} {shop.isOwner ? '(Owner)' : `(${shop.role})`}
          </option>
        ))}
      </select>
    </div>
  );
};

// Export all three components for easy access elsewhere in the app.
export { ShopSelector, ShopAssignmentModal, UserShopAssignments };