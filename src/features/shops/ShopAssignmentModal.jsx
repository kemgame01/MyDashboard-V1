// src/features/shops/ShopAssignmentModal.jsx
import React, { useState } from 'react';
import { SHOP_PERMISSIONS } from '../../Models/shopModel';

const ShopAssignmentModal = ({ user, shops, onSave, onClose }) => {
  const [selectedShop, setSelectedShop] = useState('');
  const [selectedRole, setSelectedRole] = useState('staff');
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    // Clear previous error
    setError('');

    if (!selectedShop) {
      setError('Please select a shop.');
      return;
    }

    const shop = shops.find(s => s.shopId === selectedShop);
    if (!shop) {
      setError('Invalid shop selected.');
      return;
    }

    // Check if user already assigned to this shop
    const existingAssignment = user.assignedShops?.find(a => a.shopId === selectedShop);
    if (existingAssignment) {
      setError('User is already assigned to this shop.');
      return;
    }

    onSave({
      shopId: selectedShop,
      shopName: shop.shopName,
      role: selectedRole,
      isOwner
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-bold mb-4">Assign User to Shop</h3>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Shop</label>
            <select
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Choose a shop...</option>
              {shops.map(shop => (
                <option key={shop.shopId} value={shop.shopId}>
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
              className="w-full border rounded-lg px-3 py-2"
            >
              {Object.keys(SHOP_PERMISSIONS).map(role => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isOwner"
              checked={isOwner}
              onChange={(e) => setIsOwner(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="isOwner" className="text-sm font-medium">
              Make this user the owner of this shop
            </label>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Assign to Shop
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Export the component as the default export for this file.
export default ShopAssignmentModal;