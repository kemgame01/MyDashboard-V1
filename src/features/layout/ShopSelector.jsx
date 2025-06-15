// src/features/layout/ShopSelector.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ChevronDown, Store } from 'lucide-react';

const ShopSelector = ({ user, currentShop, onShopChange }) => {
  const [shops, setShops] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserShops();
  }, [user]);

  const loadUserShops = async () => {
    if (!user?.assignedShops) {
      setLoading(false);
      return;
    }

    try {
      // Get fresh shop data from database
      const shopsSnapshot = await getDocs(collection(db, 'shops'));
      const allShops = shopsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter shops based on user's assignments
      const userShopIds = user.assignedShops.map(shop => shop.shopId);
      const userShops = allShops.filter(shop => 
        userShopIds.includes(shop.id) || userShopIds.includes(shop.shopId)
      );

      // Merge with assignment data for roles
      const shopsWithRoles = userShops.map(shop => {
        const assignment = user.assignedShops.find(a => 
          a.shopId === shop.id || a.shopId === shop.shopId
        );
        return {
          ...shop,
          role: assignment?.role || 'staff',
          isOwner: assignment?.isOwner || false
        };
      });

      setShops(shopsWithRoles);
    } catch (error) {
      console.error('Error loading shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShopChange = async (shop) => {
    try {
      // Update user's current shop in database
      await updateDoc(doc(db, 'users', user.uid), {
        currentShop: shop.shopId || shop.id
      });

      // Call parent callback
      if (onShopChange) {
        onShopChange(shop);
      }

      setIsOpen(false);
    } catch (error) {
      console.error('Error changing shop:', error);
    }
  };

  // Find current shop data
  const currentShopData = shops.find(shop => 
    shop.id === currentShop || shop.shopId === currentShop
  );

  if (loading) return <div className="text-sm text-gray-500">Loading...</div>;
  if (shops.length === 0) return null;
  if (shops.length === 1) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Store size={16} />
        <span>{shops[0].shopName}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Store size={16} />
        <span className="text-sm font-medium">
          {currentShopData?.shopName || 'Select Shop'}
        </span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[200px] z-50">
          <div className="py-2">
            {shops.map(shop => (
              <button
                key={shop.id}
                onClick={() => handleShopChange(shop)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between ${
                  (shop.id === currentShop || shop.shopId === currentShop) ? 'bg-blue-50 text-blue-600' : ''
                }`}
              >
                <span className="text-sm">{shop.shopName}</span>
                {shop.isOwner && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Owner</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopSelector;