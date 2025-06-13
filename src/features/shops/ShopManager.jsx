// src/features/shops/ShopManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Store, MapPin, Phone, Mail, Clock, Settings, Trash2, Edit, Plus, BarChart } from 'lucide-react';

const ShopManager = ({ user }) => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [deletingShop, setDeletingShop] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const isRootAdmin = user?.isRootAdmin === true;
  const isShopOwner = user?.assignedShops?.some(shop => shop.isOwner) || false;
  
  // Determine what shops the user can see
  const getVisibleShops = useCallback(async () => {
    try {
      const shopsCollection = collection(db, 'shops');
      const snapshot = await getDocs(shopsCollection);
      let allShops = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (!isRootAdmin) {
        // Shop owners only see their owned shops
        const ownedShopIds = user.assignedShops
          ?.filter(s => s.isOwner)
          .map(s => s.shopId) || [];
        allShops = allShops.filter(shop => ownedShopIds.includes(shop.id));
      }

      return allShops;
    } catch (err) {
      console.error('Error fetching shops:', err);
      throw err;
    }
  }, [user, isRootAdmin]);

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      setLoading(true);
      const visibleShops = await getVisibleShops();
      setShops(visibleShops);
    } catch (err) {
      setError('Failed to load shops');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
          shopOwner: isRootAdmin ? formData.shopOwner || user.uid : user.uid
        };
        
        const docRef = await addDoc(collection(db, 'shops'), newShopData);
        
        // If non-root admin creates a shop, automatically assign them as owner
        if (!isRootAdmin) {
          const userRef = doc(db, 'users', user.uid);
          const shopAssignment = {
            shopId: docRef.id,
            shopName: formData.shopName,
            role: 'admin',
            isOwner: true,
            assignedAt: new Date(),
            assignedBy: user.uid
          };
          
          const updatedAssignments = [...(user.assignedShops || []), shopAssignment];
          await updateDoc(userRef, {
            assignedShops: updatedAssignments,
            currentShop: user.currentShop || docRef.id
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

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading shops...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Shop Management</h2>
        <div className="flex gap-3">
          {canCreateShop() && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Shop
            </button>
          )}
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            {showAnalytics ? 'Hide' : 'Show'} Analytics
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {showAnalytics && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Shops</p>
                <p className="text-2xl font-bold">{shops.length}</p>
              </div>
              <Store className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Shops</p>
                <p className="text-2xl font-bold">{shops.filter(s => s.status === 'active').length}</p>
              </div>
              <BarChart className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Inactive Shops</p>
                <p className="text-2xl font-bold">{shops.filter(s => s.status === 'inactive').length}</p>
              </div>
              <BarChart className="w-8 h-8 text-gray-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold">฿0</p>
              </div>
              <BarChart className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shops.map(shop => (
          <div key={shop.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{shop.shopName}</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${
                shop.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {shop.status}
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{shop.address || 'No address'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{shop.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{shop.email || 'No email'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>
                  {shop.settings?.businessHours?.open || '09:00'} - {shop.settings?.businessHours?.close || '18:00'}
                </span>
              </div>
            </div>
            
            <div className="mt-4 flex gap-2">
              {canEditShop(shop) && (
                <button
                  onClick={() => {
                    setEditingShop(shop);
                    setShowForm(true);
                  }}
                  className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit
                </button>
              )}
              {canDeleteShop(shop) && (
                <button
                  onClick={() => setDeletingShop(shop)}
                  className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Shop Form Modal */}
      {showForm && (
        <ShopForm
          shop={editingShop}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingShop(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Delete Shop</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{deletingShop.shopName}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingShop(null)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Shop Form Component
const ShopForm = ({ shop, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    shopName: shop?.shopName || '',
    address: shop?.address || '',
    phone: shop?.phone || '',
    email: shop?.email || '',
    status: shop?.status || 'active',
    settings: {
      currency: shop?.settings?.currency || 'THB',
      timezone: shop?.settings?.timezone || 'Asia/Bangkok',
      businessHours: {
        open: shop?.settings?.businessHours?.open || '09:00',
        close: shop?.settings?.businessHours?.close || '18:00'
      }
    }
  });

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child, subchild] = field.split('.');
      if (subchild) {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [subchild]: value
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-6">
          {shop ? 'Edit Shop' : 'Create New Shop'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Shop Name</label>
              <input
                type="text"
                value={formData.shopName}
                onChange={(e) => handleChange('shopName', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <input
                type="text"
                value={formData.settings.currency}
                onChange={(e) => handleChange('settings.currency', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Timezone</label>
              <input
                type="text"
                value={formData.settings.timezone}
                onChange={(e) => handleChange('settings.timezone', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Opening Time</label>
              <input
                type="time"
                value={formData.settings.businessHours.open}
                onChange={(e) => handleChange('settings.businessHours.open', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Closing Time</label>
              <input
                type="time"
                value={formData.settings.businessHours.close}
                onChange={(e) => handleChange('settings.businessHours.close', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {shop ? 'Update Shop' : 'Create Shop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShopManager;