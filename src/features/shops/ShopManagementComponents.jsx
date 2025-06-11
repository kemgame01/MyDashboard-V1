// src/features/shops/ShopManagementComponents.jsx
import React, { useState } from 'react';
import { getCurrentShop, getUserShops, SHOP_PERMISSIONS } from '../../utils/shopPermissions';

// ShopSelector Component
const ShopSelector = ({ user, onShopChange }) => {
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

// ShopAssignmentModal Component
const ShopAssignmentModal = ({ user, shops, onSave, onClose }) => {
  const [selectedShop, setSelectedShop] = useState('');
  const [selectedRole, setSelectedRole] = useState('staff');
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!selectedShop) {
      setError('Please select a shop');
      return;
    }

    const shop = shops.find(s => s.shopId === selectedShop);
    if (!shop) {
      setError('Invalid shop selected');
      return;
    }

    // Check if user already assigned to this shop
    const existingAssignment = user.assignedShops?.find(a => a.shopId === selectedShop);
    if (existingAssignment) {
      setError('User is already assigned to this shop');
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

// UserShopAssignments Component
const UserShopAssignments = ({ user, onRemoveAssignment, onUpdateRole }) => {
  const [editingAssignment, setEditingAssignment] = useState(null);

  if (!user.assignedShops || user.assignedShops.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No shop assignments
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {user.assignedShops.map((assignment, index) => (
        <div key={`${assignment.shopId}-${index}`} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">{assignment.shopName}</span>
            <span className={`px-2 py-0.5 rounded text-xs ${
              assignment.isOwner ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {assignment.isOwner ? 'Owner' : assignment.role}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditingAssignment(assignment)}
              className="text-blue-600 hover:text-blue-800 text-xs"
            >
              Edit
            </button>
            {!assignment.isOwner && (
              <button
                onClick={() => onRemoveAssignment(user.id, assignment.shopId)}
                className="text-red-600 hover:text-red-800 text-xs ml-2"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export { ShopSelector, ShopAssignmentModal, UserShopAssignments };