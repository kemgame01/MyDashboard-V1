// src/components/ShopMigrationTool.jsx
import React, { useState } from 'react';
import { migrateUsersToShopSystem, createShop, assignUserToShop } from '../utils/shopMigration';

const ShopMigrationTool = ({ user }) => {
  const [migrationStatus, setMigrationStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Only show to root admin
  if (!user?.isRootAdmin) {
    return null;
  }

  const handleMigration = async () => {
    if (!window.confirm('This will migrate your existing data to the shop system. Continue?')) {
      return;
    }

    setIsLoading(true);
    setError('');
    setMigrationStatus('Starting migration...');

    try {
      await migrateUsersToShopSystem();
      setMigrationStatus('Migration completed successfully! Please refresh the page.');
    } catch (err) {
      setError('Migration failed: ' + err.message);
      setMigrationStatus('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="text-yellow-600 text-xl">⚠️</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Shop System Migration
          </h3>
          <p className="text-yellow-700 text-sm mb-4">
            Your system needs to be migrated to support shop-based role management. 
            This will create a default shop called "Whey อร่อยดี" and assign all existing users to it.
          </p>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm">
              {error}
            </div>
          )}
          
          {migrationStatus && (
            <div className="bg-blue-100 text-blue-700 p-2 rounded mb-3 text-sm">
              {migrationStatus}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleMigration}
              disabled={isLoading}
              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50 text-sm font-medium"
            >
              {isLoading ? 'Migrating...' : 'Run Migration'}
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm font-medium"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopMigrationTool;