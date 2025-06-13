// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import Sidebar from '../features/layout/Sidebar';
import CustomerSection from '../features/customers/CustomerSection';
import RoleManagementSection from '../features/users/RoleManagementSection';
import TaskManagementSection from './TaskManagementSection';
import InventoryDashboard from '../features/inventory/InventoryDashboard';
import SalesDashboard from '../features/sales/SalesDashboard';
import CategoryBrandManager from './CategoryBrandManager';
import ShopManager from '../features/shops/ShopManager';
import UserProfile from '../features/userprofile/UserProfile';
import { canViewShopSales, canManageShopInventory, canManageShopStaff } from "../utils/shopPermissions";
import PendingInvitations from "../features/shops/PendingInvitations";


const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('customers');
  const [currentSection, setCurrentSection] = useState({ key: 'customers', label: 'Dashboard' });
  const [shopContext, setShopContext] = useState(null);

  const isRootAdmin = user?.isRootAdmin === true;
  const isShopOwner = user?.assignedShops?.some(shop => shop.isOwner) || false;

  useEffect(() => {
    // Set initial shop context
    if (user?.assignedShops?.length > 0) {
      const currentShopId = user.currentShop || user.assignedShops[0].shopId;
      const shop = user.assignedShops.find(s => s.shopId === currentShopId);
      setShopContext(shop);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const showSection = (section, userData) => {
    if (!hasAccessToSection(section)) {
      alert('You do not have permission to access this section');
      return;
    }
    
    setActiveSection(section);
    const sectionLabels = {
      customers: 'Dashboard',
      userProfile: 'Profile',
      allOrders: 'All Orders',
      pendingOrders: 'Pending Orders',
      roleManagement: 'Role Management',
      taskManagement: 'Task Management',
      inventory: 'Inventory',
      sales: 'Sales',
      brandCategory: 'Brands/Categories',
      shopManagement: 'Shop Manager'
    };
    
    setCurrentSection({ 
      key: section, 
      label: sectionLabels[section] || section 
    });
  };

  const hasAccessToSection = (section) => {
    if (isRootAdmin) return true;
    
    // Non-admins with no shops can only see their profile or setup screen
    if (!shopContext && section !== 'userProfile' && section !== 'setup') {
      return false;
    }
    
    switch (section) {
      case 'customers':
      case 'userProfile':
        return true;
      case 'roleManagement':
        // Only Root Admin and Shop Owners can see Role Management
        return isRootAdmin || isShopOwner;
      case 'inventory':
      case 'taskManagement':
        return canManageShopInventory(user);
      case 'sales':
        return canViewShopSales(user);
      case 'brandCategory':
        return isRootAdmin;
      case 'shopManagement':
        return isRootAdmin || isShopOwner;
      default:
        return false;
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'customers':
        return <CustomerSection />;
      case 'userProfile':
        return <UserProfile targetUserId={user.uid} />;
      case 'roleManagement':
        return <RoleManagementSection currentUser={user} />;
      case 'taskManagement':
        return <TaskManagementSection userId={user.uid} isRootAdmin={isRootAdmin} />;
      case 'inventory':
        return <InventoryDashboard user={user} />;
      case 'sales':
        return <SalesDashboard user={user} shopContext={shopContext} />;
      case 'brandCategory':
        return <CategoryBrandManager />;
      case 'shopManagement':
        return <ShopManager user={user} />;
      default:
        return <div>Section not found</div>;
    }
  };

  const ShopSelector = ({ user }) => {
    if (!user?.assignedShops || user.assignedShops.length === 0) return null;

    const handleShopChange = async (shopId) => {
      const shop = user.assignedShops.find(s => s.shopId === shopId);
      if (shop) {
        setShopContext(shop);
        // You might want to update user's currentShop in Firestore here
      }
    };

    if (user.assignedShops.length === 1) {
      return (
        <div className="flex items-center text-sm text-gray-600">
          <span className="mr-2">Shop:</span>
          <span className="font-semibold">{user.assignedShops[0].shopName}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center">
        <label className="text-sm text-gray-600 mr-2">Shop:</label>
        <select
          value={shopContext?.shopId || ''}
          onChange={(e) => handleShopChange(e.target.value)}
          className="text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {user.assignedShops.map(shop => (
            <option key={shop.shopId} value={shop.shopId}>
              {shop.shopName} {shop.isOwner ? '(Owner)' : `(${shop.role})`}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // No need for header when sections handle their own layout
  if (activeSection === 'roleManagement') {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar 
          user={user} 
          activeSection={activeSection} 
          showSection={showSection} 
          handleLogout={handleLogout}
        />
        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
      </div>
    );
  }

  // Original layout for other sections
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        user={user} 
        activeSection={activeSection} 
        showSection={showSection} 
        handleLogout={handleLogout}
      />
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-800">{currentSection.label}</h1>
            <ShopSelector user={user} />
          </div>
        </header>
        <main className="p-6">
          {/* Show pending invitations at the top if on dashboard/customers section */}
          {currentSection.key === 'customers' && user && (
            <PendingInvitations 
              user={user} 
              onUpdate={() => {
                // Refresh user data after accepting invitation
                window.location.reload();
              }} 
            />
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;