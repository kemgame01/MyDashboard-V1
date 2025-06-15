// src/features/shops/ShopAssignmentModal.jsx
import React, { useState } from 'react';
import { SHOP_PERMISSIONS } from '../../utils/shopPermissions';

const ShopAssignmentModal = ({ user, shops, onSave, onClose, currentUser }) => {
  const [selectedShop, setSelectedShop] = useState('');
  const [selectedRole, setSelectedRole] = useState('staff');
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    setError('');

    if (!selectedShop) {
      setError('Please select a shop.');
      return;
    }

    // FIX: Use shop.id instead of shop.shopId
    const shop = shops.find(s => s.id === selectedShop);
    if (!shop) {
      setError('Invalid shop selected.');
      return;
    }

    // Check if user already assigned to this shop
    // FIX: Check against the actual shop.id or shop.shopId field used in assignments
    const existingAssignment = user.assignedShops?.find(a => 
      a.shopId === shop.id || a.shopId === shop.shopId
    );
    
    if (existingAssignment) {
      setError('User is already assigned to this shop.');
      return;
    }

    // FIX: Pass both id and shopId to ensure compatibility
    onSave({
      shopId: shop.shopId || shop.id, // Use shopId if available, otherwise use id
      shopName: shop.shopName,
      role: selectedRole,
      isOwner
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
        <h3 className="text-lg font-bold mb-4">Assign User to Shop</h3>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Shop</label>
            <select
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a shop...</option>
              {shops.map(shop => (
                <option key={shop.id} value={shop.id}>
                  {shop.shopName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role in Shop</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.keys(SHOP_PERMISSIONS).map(role => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {currentUser?.isRootAdmin && (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isOwner"
                checked={isOwner}
                onChange={(e) => setIsOwner(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isOwner" className="text-sm font-medium text-gray-700">
                Make this user the owner of this shop
              </label>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold"
          >
            Assign to Shop
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopAssignmentModal;