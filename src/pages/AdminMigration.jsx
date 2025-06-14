// src/pages/AdminMigration.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { migrateUsersToDenormalizedStructure } from '../utils/firestoreMigration';

const AdminMigration = ({ user }) => {
  const navigate = useNavigate();
  const [migrating, setMigrating] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);

  const handleMigration = async () => {
    if (!user?.isRootAdmin) {
      setError('Only Root Admin can run migrations');
      return;
    }

    if (!window.confirm('Are you sure you want to run the migration? This will modify your Firestore data structure. Make sure you have a backup!')) {
      return;
    }

    setMigrating(true);
    setStatus('Starting migration...');
    setError('');

    try {
      await migrateUsersToDenormalizedStructure();
      setStatus('Migration completed successfully!');
      setCompleted(true);
    } catch (err) {
      setError(`Migration failed: ${err.message}`);
      console.error('Migration error:', err);
    } finally {
      setMigrating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user.isRootAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">Only Root Admin can access this page.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Firestore Data Migration</h1>
          <p className="text-gray-600 mt-2">Migrate to denormalized structure for better security rules</p>
        </div>

        {/* Warning Box */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-yellow-600 mt-1" size={24} />
            <div>
              <h2 className="font-semibold text-yellow-900 mb-2">Important: Before You Proceed</h2>
              <ul className="space-y-1 text-yellow-800">
                <li>• Make sure you have a complete backup of your Firestore data</li>
                <li>• This migration should only be run once</li>
                <li>• The process will create new collections: userRoles and shopMembers</li>
                <li>• Existing user documents will be preserved for backward compatibility</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Migration Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-semibold text-lg mb-4">What This Migration Does:</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">1. Creates userRoles Collection</h4>
              <p className="text-gray-600 text-sm">Stores global user permissions (isRootAdmin, globalRole)</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">2. Creates shopMembers Collection</h4>
              <p className="text-gray-600 text-sm">Stores shop-specific assignments with document IDs like: shopId_userId</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">3. Maintains Existing Structure</h4>
              <p className="text-gray-600 text-sm">User documents remain unchanged for backward compatibility</p>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {status && !error && (
          <div className={`rounded-lg p-4 mb-6 ${completed ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
            <div className="flex items-center gap-2">
              {completed ? (
                <CheckCircle className="text-green-600" size={20} />
              ) : (
                <Loader className="text-blue-600 animate-spin" size={20} />
              )}
              <p className={completed ? 'text-green-800' : 'text-blue-800'}>{status}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleMigration}
            disabled={migrating || completed}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {migrating && <Loader className="animate-spin" size={20} />}
            {completed ? 'Migration Completed' : migrating ? 'Migrating...' : 'Start Migration'}
          </button>
          
          {completed && (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Return to Dashboard
            </button>
          )}
        </div>

        {/* Post-Migration Instructions */}
        {completed && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-semibold text-green-900 mb-2">✅ Migration Completed Successfully!</h3>
            <p className="text-green-800 mb-4">Next steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-green-800">
              <li>Deploy the new Firestore security rules</li>
              <li>Test user login and shop access</li>
              <li>Verify all permissions are working correctly</li>
              <li>Remove this migration page from your routes</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMigration;