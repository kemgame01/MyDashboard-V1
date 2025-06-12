// src/features/sales/components/SalesHeader.jsx
import React from 'react';

const SalesHeader = ({ 
  shopContext, 
  hasSalesAccess, 
  canManageInventory, 
  legacyCanViewSales, 
  onAddSale 
}) => {
  return (
    <>
      {/* Shop Context Banner */}
      {shopContext && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium">💰 Sales Dashboard for:</span>
            <span className="font-semibold text-green-800">{shopContext.shopName}</span>
            {shopContext.isOwner && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Owner</span>
            )}
          </div>
          <p className="text-sm text-green-600 mt-1">
            Role: {shopContext.role || 'Staff'} • 
            Access Level: {hasSalesAccess ? 'Full Access' : 'View Only'}
          </p>
        </div>
      )}

      {/* Header with Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#223163]">
            Sales Dashboard
          </h1>
          {shopContext && (
            <p className="text-sm text-gray-600 mt-1">
              Managing sales for {shopContext.shopName}
            </p>
          )}
        </div>
        
        {/* Add Sale Button */}
        {(canManageInventory || legacyCanViewSales) && (
          <button
            className="bg-[#2563eb] text-white font-bold px-5 py-2 rounded-lg shadow hover:bg-[#1a4ecb] transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={onAddSale}
          >
            + Add Sale
          </button>
        )}
      </div>
    </>
  );
};

export default SalesHeader;