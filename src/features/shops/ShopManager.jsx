// src/features/shops/ShopManager.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Trash2, Edit, Plus, Store, Users, Settings, AlertCircle } from 'lucide-react';
import ShopForm from './ShopForm';
import ShopAnalytics from './ShopAnalytics';
import { canViewShopManagement } from '../../utils/shopPermissions';
import Spinner from '../../components/Spinner';

const ShopManager = ({ user }) => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [deletingShop, setDeletingShop] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const isRootAdmin = user?.isRootAdmin === true;
  const isShopOwner = user?.assignedShops?.some(shop => shop.isOwner) || false;

  // Check if user should have access to this section
  useEffect(() => {
    if (!canViewShopManagement(user)) {
      setError("You don't have permission to view this section.");
    }
  }, [user]);

  // Load shops based on user permissions
  const loadShops = async () => {
    try {
      setError('');
      const snapshot = await getDocs(collection(db, 'shops'));
      let allShops = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (!isRootAdmin) {
        // Shop owners only see their own shops
        const ownedShopIds = user.assignedShops
          ?.filter(s => s.isOwner)
          .map(s => s.shopId) || [];
        allShops = allShops.filter(shop => ownedShopIds.includes(shop.id));
      }
      
      setShops(allShops);
    } catch (err) {
      setError('Failed to load shops');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShops();
  }, [user]);

  // Permission checks for actions
  const canEditShop = (shop) => {
    if (isRootAdmin) return true;
    // Shop owners can edit their own shops
    return user.assignedShops?.some(s => s.shopId === shop.id && s.isOwner);
  };

  const canDeleteShop = (shop) => {
    if (isRootAdmin) return true;
    // Shop owners can delete their own shops
    return user.assignedShops?.some(s => s.shopId === shop.id && s.isOwner);
  };

  const canCreateShop = () => {
    // Both Root Admin and Shop Owners can create shops
    return isRootAdmin || isShopOwner;
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingShop) {
        // Check edit permission
        if (!canEditShop(editingShop)) {
          setError('You do not have permission to edit this shop');
          return;
        }
        
        // Update existing shop
        const shopRef = doc(db, 'shops', editingShop.id);
        await updateDoc(shopRef, {
          ...formData,
          updatedAt: new Date()
        });
      } else {
        // Check create permission
        if (!canCreateShop()) {
          setError('You do not have permission to create shops');
          return;
        }
        
        // Create new shop
        const newShopData = {
          ...formData,
          createdAt: new Date(),
          createdBy: user.uid,
          ownerId: user.uid, // Creator becomes the owner
          status: 'active',
          updatedAt: new Date()
        };
        
        const docRef = await addDoc(collection(db, 'shops'), newShopData);
        
        // Automatically assign creator as shop owner
        if (!isRootAdmin || user.uid === formData.ownerId) {
          const userRef = doc(db, 'users', user.uid);
          const shopAssignment = {
            shopId: docRef.id,
            shopName: formData.shopName,
            role: 'owner',
            isOwner: true,
            assignedAt: new Date(),
            assignedBy: user.uid
          };
          
          const updatedAssignments = [...(user.assignedShops || []), shopAssignment];
          await updateDoc(userRef, {
            assignedShops: updatedAssignments,
            currentShop: user.currentShop || docRef.id,
            updatedAt: new Date()
          });
        }
      }
      
      setShowForm(false);
      setEditingShop(null);
      await loadShops();
    } catch (err) {
      setError('Failed to save shop');
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deletingShop) return;
    
    // Check delete permission
    if (!canDeleteShop(deletingShop)) {
      setError('You do not have permission to delete this shop');
      setDeletingShop(null);
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'shops', deletingShop.id));
      setDeletingShop(null);
      await loadShops();
    } catch (err) {
      setError('Failed to delete shop');
      console.error(err);
    }
  };

  if (!canViewShopManagement(user)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Store className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">You don't have permission to access Shop Management.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <Spinner text="Loading shops..." />;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Shop Management</h2>
          <p className="text-gray-600 mt-1">
            {isRootAdmin 
              ? "Manage all shops in the system"
              : "Manage your shops"}
          </p>
        </div>
        <div className="flex gap-3">
          {canCreateShop() && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={20} />
              Create Shop
            </button>
          )}
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {showAnalytics && <ShopAnalytics shops={shops} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shops.map(shop => (
          <div key={shop.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{shop.shopName}</h3>
                <span className={`inline-block px-2 py-1 text-xs rounded ${
                  shop.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {shop.status || 'active'}
                </span>
              </div>
              <div className="flex gap-2">
                {canEditShop(shop) && (
                  <button
                    onClick={() => {
                      setEditingShop(shop);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                    title="Edit Shop"
                  >
                    <Edit size={20} />
                  </button>
                )}
                {canDeleteShop(shop) && (
                  <button
                    onClick={() => setDeletingShop(shop)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete Shop"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Store size={16} />
                <span>{shop.address || 'No address'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={16} />
                <span>
                  {user.assignedShops?.find(s => s.shopId === shop.id)?.role || 'No role'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Settings size={16} />
                <span>
                  {shop.settings?.businessHours?.open || '09:00'} - 
                  {shop.settings?.businessHours?.close || '18:00'}
                </span>
              </div>
            </div>

            {shop.createdAt && (
              <p className="text-xs text-gray-400 mt-4">
                Created: {new Date(shop.createdAt.toDate ? shop.createdAt.toDate() : shop.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>

      {shops.length === 0 && (
        <div className="text-center py-12">
          <Store className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">
            {canCreateShop() 
              ? "No shops yet. Create your first shop!" 
              : "You don't have any shops assigned."}
          </p>
        </div>
      )}

      {/* Shop Form Modal */}
      {showForm && (
        <ShopForm
          shop={editingShop}
          onSave={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingShop(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deletingShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Delete Shop</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{deletingShop.shopName}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingShop(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Shop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopManager;