// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // ✅ CHANGED: Added useLocation
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
import ShopSelector from '../features/layout/ShopSelector';
import { 
  canViewShopSales, 
  canManageShopInventory, 
  canManageShopStaff,
  canViewRoleManagement,
  canViewShopManagement,
  getCurrentShop 
} from "../utils/shopPermissions";
import PendingInvitations from "../features/shops/PendingInvitations";

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation(); // ✅ ADDED: Get location for URL params
  
  // ✅ CHANGED: Smart state initialization with URL and localStorage
  const [activeSection, setActiveSection] = useState(() => {
    // Check URL parameters first
    const searchParams = new URLSearchParams(location.search);
    const sectionFromUrl = searchParams.get('section');
    if (sectionFromUrl) return sectionFromUrl;
    
    // Check localStorage
    const savedSection = localStorage.getItem('lastActiveSection');
    if (savedSection) return savedSection;
    
    // Default to customers
    return 'customers';
  });
  
  const [currentSection, setCurrentSection] = useState({ key: 'customers', label: 'Dashboard' });
  const [shopContext, setShopContext] = useState(null);
  const [shopName, setShopName] = useState('');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const isRootAdmin = user?.isRootAdmin === true;
  const isShopOwner = user?.assignedShops?.some(shop => shop.isOwner) || false;
  const userRole = getCurrentShop(user)?.role || user?.role || 'viewer';

  useEffect(() => {
    // Set initial shop context
    if (user?.assignedShops?.length > 0) {
      const currentShopId = user.currentShop || user.assignedShops[0].shopId;
      const shop = user.assignedShops.find(s => s.shopId === currentShopId);
      if (shop) {
        setShopContext({
          shopId: shop.shopId,
          shopName: shop.shopName
        });
        setShopName(shop.shopName);
      }
    }
  }, [user]);

  // ✅ ADDED: Persistence logic - saves section to localStorage and URL
  useEffect(() => {
    // Save active section whenever it changes
    if (activeSection) {
      localStorage.setItem('lastActiveSection', activeSection);
      
      // Update URL
      const newSearchParams = new URLSearchParams(location.search);
      newSearchParams.set('section', activeSection);
      const newUrl = `${location.pathname}?${newSearchParams.toString()}`;
      
      if (window.location.pathname + window.location.search !== newUrl) {
        navigate(newUrl, { replace: true });
      }
    }
  }, [activeSection, navigate, location]);

  const handleShopChange = async (newShop) => {
    try {
      // Update local state
      const newShopId = newShop.shopId || newShop.id;
      setShopContext({
        shopId: newShopId,
        shopName: newShop.shopName
      });
      setShopName(newShop.shopName);
      
      // Update user context (this will trigger a re-render)
      // You might want to reload the current section data here
      setToast(`Switched to ${newShop.shopName}`);
      
      // If on customers section, data will auto-reload with new shop context
      if (activeSection === 'customers') {
        // The CustomerSection component will handle reloading with new shop context
      }
    } catch (error) {
      console.error('Error changing shop:', error);
      setError('Failed to switch shop. Please try again.');
    }
  };

  // ✅ CHANGED: Added localStorage cleanup on logout
  const handleLogout = async () => {
    try {
      localStorage.removeItem('lastActiveSection'); // ✅ ADDED: Clear saved section
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
        return <CustomerSection userId={user?.uid} shopContext={shopContext} />;
      case 'userProfile':
        return <UserProfile authUser={user} />;
      case 'roleManagement':
        return <RoleManagementSection currentUser={user} />;
      case 'taskManagement':
        return <TaskManagementSection userId={user?.uid} />;
      case 'inventory':
        return <InventoryDashboard userId={user?.uid} shopContext={shopContext} />;
      case 'sales':
        return <SalesDashboard userId={user?.uid} shopContext={shopContext} />;
      case 'brandCategory':
        return <CategoryBrandManager />;
      case 'shopManagement':
        return <ShopManager user={user} />;
      default:
        return <CustomerSection userId={user?.uid} shopContext={shopContext} />;
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        user={user}
        showSection={showSection}
        userRole={userRole}
        isRootAdmin={isRootAdmin}
        isShopOwner={isShopOwner}
        activeSection={activeSection}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navigation Bar */}
        <nav className="flex items-center justify-between p-4 bg-white shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">
              {currentSection.label}
            </h1>
            {currentSection.key === 'customers' && shopName && (
              <span className="text-sm text-gray-600">for {shopName}</span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Shop Selector for consistent shop display */}
            {user && user.assignedShops && user.assignedShops.length > 0 && (
              <ShopSelector 
                user={user}
                currentShop={shopContext?.shopId}
                onShopChange={handleShopChange}
              />
            )}
            
            {/* User Role Badge */}
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                isRootAdmin 
                  ? 'bg-purple-100 text-purple-800' 
                  : userRole === 'admin' || isShopOwner
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
              }`}>
                {isRootAdmin ? 'Root Admin' : isShopOwner ? 'Owner' : userRole || 'User'}
              </span>
            </div>
          </div>
        </nav>

        {/* Toast Messages */}
        {toast && (
          <div className="mx-4 mt-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center justify-between">
            <span>{toast}</span>
            <button onClick={() => setToast('')} className="text-green-700 hover:text-green-900">
              ×
            </button>
          </div>
        )}
        
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">
              ×
            </button>
          </div>
        )}

        {/* Pending Invitations Alert */}
        <PendingInvitations user={user} />

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;