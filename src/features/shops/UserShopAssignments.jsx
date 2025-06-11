// src/features/shops/UserShopAssignments.jsx
import React, { useState } from 'react';

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