// src/features/shops/UserShopAssignments.jsx
import React, { useState } from 'react';
import { Edit, Trash2, Save, X } from 'lucide-react'; // For nice icons
import { SHOP_PERMISSIONS } from '../../Models/shopModel'; // Assuming this holds your roles

const UserShopAssignments = ({ user, onRemoveAssignment, onUpdateRole }) => {
  const [editingAssignment, setEditingAssignment] = useState(null); // Holds the shop being edited

  if (!user.assignedShops || user.assignedShops.length === 0) {
    return <div className="text-sm text-gray-500 italic">No shop assignments</div>;
  }

  const handleUpdate = (newRole) => {
    if (onUpdateRole) {
      onUpdateRole(user.id, editingAssignment.shopId, newRole);
    }
    setEditingAssignment(null); // Close the modal
  };

  return (
    <div className="space-y-2">
      {user.assignedShops.map((assignment) => (
        <div key={assignment.shopId} className="flex items-center justify-between bg-gray-50 p-2 rounded-md text-sm">
          {/* Shop Name and Role */}
          <div>
            <span className="font-medium mr-2">{assignment.shopName}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              assignment.isOwner ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {assignment.isOwner ? 'Owner' : (assignment.role || 'staff')}
            </span>
          </div>

          {/* Edit and Remove Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditingAssignment(assignment)}
              className="text-blue-600 hover:text-blue-800"
              title="Edit Role"
            >
              <Edit size={16} />
            </button>
            {!assignment.isOwner && (
              <button
                onClick={() => onRemoveAssignment(user.id, assignment.shopId)}
                className="text-red-600 hover:text-red-800"
                title="Remove Assignment"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* --- The Modal for Editing a Role --- */}
      {editingAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold mb-4">Edit Role for {editingAssignment.shopName}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">New Role</label>
                <select
                  defaultValue={editingAssignment.role}
                  onChange={(e) => (editingAssignment.role = e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {Object.keys(SHOP_PERMISSIONS).map(role => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => handleUpdate(editingAssignment.role)}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Save size={18}/> Save
              </button>
              <button
                onClick={() => setEditingAssignment(null)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 flex items-center justify-center gap-2"
              >
                <X size={18}/> Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserShopAssignments;