// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import Sidebar from '../features/layout/Sidebar';
import CustomerSection from '../features/customers/CustomerSection';
import RoleManagementSection from '../features/users/RoleManagementSection';
import TaskManagementSection from './TaskManagementSection';
import InventoryDashboard from '../features/inventory/InventoryDashboard';
import SalesDashboard from '../features/sales/SalesDashboard';
import CategoryBrandManager from './CategoryBrandManager';
import ShopManager from '../features/shops/ShopManager';
import UserProfile from '../features/userprofile/UserProfile';
import { 
  canViewShopSales, 
  canManageShopInventory, 
  canManageShopStaff,
  canViewRoleManagement,
  canViewShopManagement,
  getCurrentShop 
} from "../utils/shopPermissions";
import PendingInvitations from "../features/shops/PendingInvitations";
import { ShopSelector } from '../features/shops/ShopManagementComponents';

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

  const handleShopChange = async (shopId) => {
    if (!user || !shopId) return;
    
    try {
      // Update user's current shop in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        currentShop: shopId,
        updatedAt: new Date()
      });
      
      // Update local state
      const newShop = user.assignedShops.find(s => s.shopId === shopId);
      setShopContext(newShop);
      
      // Reload page to refresh all data with new shop context
      window.location.reload();
    } catch (error) {
      console.error('Error changing shop:', error);
      alert('Failed to change shop. Please try again.');
    }
  };

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
    
    // Non-admins with no shops can only see their profile
    if (!shopContext && section !== 'userProfile') {
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
        return <CustomerSection 
          userId={user?.uid} 
          user={user} 
          shopContext={shopContext} 
        />;
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
        return <div className="flex items-center justify-center h-full text-gray-500">Section not found</div>;
    }
  };

  // Special layout for Role Management section
  if (activeSection === 'roleManagement') {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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

  // Main layout for other sections
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100">
      <Sidebar 
        user={user} 
        activeSection={activeSection} 
        showSection={showSection} 
        handleLogout={handleLogout}
      />
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Professional Modern Header 2025 - Simplified */}
        <header className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-100">
          <div className="px-6 py-5">
            <div className="flex justify-between items-center">
              {/* Left Section - Title and Breadcrumb */}
              <div className="flex flex-col space-y-1">
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    {currentSection.label}
                  </h1>
                  {shopContext && (
                    <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-full">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-blue-700">
                        {shopContext.shopName}
                      </span>
                    </div>
                  )}
                </div>
                {/* Dynamic Breadcrumb */}
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span className="hover:text-gray-700 cursor-pointer transition-colors">Home</span>
                  <span>›</span>
                  <span className="text-gray-700 font-medium">{currentSection.label}</span>
                </div>
              </div>

              {/* Right Section - Shop Selector Only */}
              <div className="flex items-center">
                {/* Shop Selector with enhanced styling */}
                {user?.assignedShops?.length > 0 && (
                  <div className="relative shop-selector-wrapper">
                    <ShopSelector 
                      user={user} 
                      onShopChange={handleShopChange}
                      className="shop-selector"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-transparent">
          <div className="p-6 max-w-7xl mx-auto">
            {/* Pending Invitations Card - Enhanced styling */}
            {currentSection.key === 'customers' && user && (
              <div className="mb-6 animate-fadeIn">
                <PendingInvitations 
                  user={user} 
                  onUpdate={() => {
                    // Refresh user data after accepting invitation
                    window.location.reload();
                  }} 
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow duration-300"
                />
              </div>
            )}
            
            {/* Content Container with subtle animation */}
            <div className="animate-slideUp">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

// Add these CSS classes to your global styles or Tailwind config:
// @keyframes fadeIn {
//   from { opacity: 0; }
//   to { opacity: 1; }
// }
// .animate-fadeIn {
//   animation: fadeIn 0.3s ease-in-out;
// }

// @keyframes slideUp {
//   from { 
//     opacity: 0;
//     transform: translateY(10px);
//   }
//   to { 
//     opacity: 1;
//     transform: translateY(0);
//   }
// }
// .animate-slideUp {
//   animation: slideUp 0.4s ease-out;
// }