// src/components/EnhancedShopSelector.js
import React from 'react';
import { ShopSelector } from '../features/shops/ShopManagementComponents';
import { ChevronDown, Store } from 'lucide-react';

const EnhancedShopSelector = ({ user, onShopChange }) => {
  const currentShop = user?.assignedShops?.find(
    shop => shop.shopId === user.currentShop
  ) || user?.assignedShops?.[0];

  if (!user?.assignedShops?.length) {
    return null;
  }

  // If only one shop, show as badge
  if (user.assignedShops.length === 1) {
    return (
      <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg">
        <Store className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {currentShop?.shopName}
        </span>
      </div>
    );
  }

  // Multiple shops - show selector
  return (
    <div className="relative group">
      <button className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200 hover:border-gray-300">
        <Store className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {currentShop?.shopName || 'Select Shop'}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </button>
      
      {/* Original ShopSelector - positioned absolutely */}
      <div className="absolute top-0 left-0 w-full opacity-0">
        <ShopSelector 
          user={user} 
          onShopChange={onShopChange}
          className="shop-selector"
        />
      </div>
    </div>
  );
};

export default EnhancedShopSelector;