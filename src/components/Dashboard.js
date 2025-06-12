// src/components/EnhancedDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useMergedUser } from '../hooks/useMergedUser';
import Layout from './Layout';
import CustomerSection from '../features/customers/CustomerSection';
import RoleManagementSection from '../features/users/RoleManagementSection';
import TaskManagementSection from './TaskManagementSection';
import CategoryBrandManager from './CategoryBrandManager';
import ShopManager from './ShopManager'; // 1. Import the new component
import InventoryDashboard from '../features/inventory/InventoryDashboard';
import UserProfile from '../features/userprofile/UserProfile';
import SalesDashboard from '../features/sales/SalesDashboard';
import Spinner from './Spinner';
import { ShopSelector } from '../features/shops/ShopManagementComponents';

import { 
  getCurrentShop, 
  canManageShopStaff,
  canManageShopInventory,
  canViewShopSales 
} from '../utils/shopPermissions';

const EnhancedDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('customers');
  const [shopContext, setShopContext] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const user = useMergedUser();

  // Initialize dashboard when user loads
  useEffect(() => {
    if (user === null) {
      navigate('/login', { replace: true });
      return;
    }

    if (user && user !== undefined) {
      initializeDashboard();
    }
  }, [user, navigate]);

  const initializeDashboard = async () => {
    try {
      setDashboardLoading(true);
      
      const currentShop = getCurrentShop(user);
      setShopContext(currentShop);

      const savedSection = localStorage.getItem('activeSection');
      if (savedSection) {
        setActiveSection(savedSection);
      }

      if (!user.isRootAdmin && (!user.assignedShops || user.assignedShops.length === 0)) {
        setActiveSection('setup');
      }

    } catch (error) {
      console.error('Dashboard initialization error:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const showSection = (section) => {
    setActiveSection(section);
    localStorage.setItem('activeSection', section);
  };

  const handleShopChange = async (newShopId) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        currentShop: newShopId
      });
      
      const newShop = user.assignedShops.find(shop => shop.shopId === newShopId);
      setShopContext(newShop);
      
      window.location.reload();
    } catch (error) {
      console.error('Shop change error:', error);
    }
  };

  if (user === undefined || dashboardLoading) {
    return <Spinner text="Loading Dashboard..." />;
  }

  if (!user) {
    return null; 
  }

  const isRootAdmin = user.isRootAdmin === true;
  const canManageInventory = canManageShopInventory(user);
  const canManageStaff = canManageShopStaff(user);
  const canViewSales = canViewShopSales(user);

  if (!isRootAdmin && (!user.assignedShops || user.assignedShops.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏪</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No Shop Access</h2>
            <p className="text-gray-600 mb-4">
              You haven't been assigned to any shops yet. Please contact your administrator to get access.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">User: {user.email}</p>
            <button
              onClick={handleLogout}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout
      user={user}
      activeSection={activeSection}
      handleLogout={handleLogout}
      showSection={showSection}
      shopContext={shopContext}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {getSectionTitle(activeSection)}
          </h1>
          {shopContext && (
            <p className="text-gray-600 text-sm mt-1">
              Managing: {shopContext.shopName}
            </p>
          )}
        </div>
        {user.assignedShops && user.assignedShops.length > 1 && (
          <ShopSelector 
            user={user} 
            onShopChange={handleShopChange}
          />
        )}
      </div>

      {/* Section Content */}
      {activeSection === 'customers' && (
        <CustomerSection userId={user.uid} user={user} shopContext={shopContext} />
      )}
      
      {activeSection === 'roleManagement' && canManageStaff && (
        <RoleManagementSection currentUser={user} />
      )}
      
      {activeSection === 'taskManagement' && canManageInventory && (
        <TaskManagementSection userId={user.uid} isRootAdmin={isRootAdmin} />
      )}
      
      {activeSection === 'inventory' && canManageInventory && (
        <InventoryDashboard user={user} shopContext={shopContext} />
      )}
      
      {activeSection === 'sales' && canViewSales && (
        <SalesDashboard user={user} shopContext={shopContext} />
      )}
      
      {activeSection === 'brandCategory' && isRootAdmin && (
        <CategoryBrandManager user={user} />
      )}

      {/* 2. Add render logic for the new section */}
      {activeSection === 'shopManagement' && isRootAdmin && (
        <ShopManager />
      )}
      
      {activeSection === 'userProfile' && (
        <UserProfile targetUserId={user.uid} />
      )}

      {/* Access Denied Message */}
      {!hasAccessToSection(activeSection, user) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-yellow-600 mb-2">🔒</div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Access Denied</h3>
          <p className="text-yellow-700">
            You don't have permission to access this section in your current shop role.
          </p>
        </div>
      )}
    </Layout>
  );
};

// 3. Update Helper functions
function getSectionTitle(section) {
  const titles = {
    customers: 'Customer Management',
    roleManagement: 'Role Management',
    taskManagement: 'Task Management',
    inventory: 'Inventory Management',
    sales: 'Sales Dashboard',
    brandCategory: 'Brand & Category Management',
    shopManagement: 'Shop Management', // <-- Added
    userProfile: 'User Profile'
  };
  return titles[section] || 'Dashboard';
}

function hasAccessToSection(section, user) {
  const isRootAdmin = user.isRootAdmin === true;
  
  if (isRootAdmin) return true;
  
  switch (section) {
    case 'customers':
      return true;
    case 'roleManagement':
      return canManageShopStaff(user);
    case 'inventory':
      return canManageShopInventory(user);
    case 'sales':
      return canViewShopSales(user);
    case 'taskManagement':
      return canManageShopInventory(user);
    case 'brandCategory':
      return isRootAdmin;
    case 'shopManagement': // <-- Added
      return isRootAdmin;
    case 'userProfile':
      return true;
    default:
      return false;
  }
}

export default EnhancedDashboard;