// src/components/CustomerDebug.jsx - Add this temporarily to your Dashboard
import React from 'react';

const CustomerDebug = ({ userId, user }) => {
  return (
    <div className="p-4 bg-gray-100 rounded-lg mb-4">
      <h3 className="font-bold mb-2">🔍 Customer Section Debug Info</h3>
      <div className="text-sm space-y-1">
        <p><strong>User ID:</strong> {userId || 'MISSING'}</p>
        <p><strong>User Email:</strong> {user?.email || 'MISSING'}</p>
        <p><strong>User Role:</strong> {user?.role || 'MISSING'}</p>
        <p><strong>Is Root Admin:</strong> {user?.isRootAdmin ? 'Yes' : 'No'}</p>
        <p><strong>Assigned Shops:</strong> {user?.assignedShops ? JSON.stringify(user.assignedShops) : 'NONE'}</p>
        <p><strong>Current Shop:</strong> {user?.currentShop || 'NONE'}</p>
        <p><strong>User Object:</strong> {user ? 'EXISTS' : 'MISSING'}</p>
      </div>
      
      {!userId && (
        <div className="mt-2 p-2 bg-red-100 text-red-700 rounded">
          ❌ <strong>Problem:</strong> No userId provided to CustomerSection
        </div>
      )}
      
      {!user && (
        <div className="mt-2 p-2 bg-red-100 text-red-700 rounded">
          ❌ <strong>Problem:</strong> No user object provided to CustomerSection
        </div>
      )}
      
      {user && !user.assignedShops && !user.isRootAdmin && (
        <div className="mt-2 p-2 bg-yellow-100 text-yellow-700 rounded">
          ⚠️ <strong>Issue:</strong> User has no shop assignments and is not root admin. Need to run migration.
        </div>
      )}
    </div>
  );
};

export default CustomerDebug;