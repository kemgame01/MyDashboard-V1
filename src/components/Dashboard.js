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
import { AlertTriangle, Database, X } from 'lucide-react';

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('customers');
  const [currentSection, setCurrentSection] = useState({ key: 'customers', label: 'Dashboard' });
  const [shopContext, setShopContext] = useState(null);
  const [showMigrationButton, setShowMigrationButton] = useState(true);
  const [migrationStatus, setMigrationStatus] = useState('');
  const [migrationError, setMigrationError] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);

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

  // Quick Migration Function
  const runQuickMigration = async () => {
    if (!isRootAdmin) {
      alert('Only Root Admin can run migrations');
      return;
    }
    
    const confirmMessage = `
🚨 FIRESTORE MIGRATION WARNING 🚨

This will:
• Create new collections: userRoles and shopMembers
• Restructure your data for better security rules
• This is a ONE-TIME operation

⚠️ Make sure you have a backup of your Firestore data!

Do you want to proceed?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    setIsMigrating(true);
    setMigrationStatus('Starting migration...');
    setMigrationError('');
    
    try {
      // Dynamic import to avoid issues if file doesn't exist
      const { migrateUsersToDenormalizedStructure } = await import('../utils/firestoreMigration');
      
      console.log('Starting Firestore migration...');
      setMigrationStatus('Processing users and creating denormalized structure...');
      
      const result = await migrateUsersToDenormalizedStructure();
      
      setMigrationStatus(`✅ Migration completed successfully! Processed ${result.processedCount} users.`);
      console.log('Migration result:', result);
      
      // Hide button after successful migration
      setTimeout(() => {
        setShowMigrationButton(false);
      }, 5000);
      
    } catch (error) {
      console.error('Migration failed:', error);
      setMigrationError(`❌ Migration failed: ${error.message}`);
      setMigrationStatus('');
    } finally {
      setIsMigrating(false);
    }
  };

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
            <ShopSelector user={user} onShopChange={handleShopChange} />
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

      {/* Migration Button - Only visible to Root Admin */}
      {isRootAdmin && showMigrationButton && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 max-w-md">
            {/* Close button */}
            <button
              onClick={() => setShowMigrationButton(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            {/* Migration status messages */}
            {migrationStatus && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                {migrationStatus}
              </div>
            )}
            
            {migrationError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                {migrationError}
              </div>
            )}

            {/* Migration button and info */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Database className="text-orange-500 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-gray-900">Firestore Migration Available</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Migrate to denormalized structure for better security rules
                  </p>
                </div>
              </div>
              
              <button 
                onClick={runQuickMigration}
                disabled={isMigrating}
                className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg shadow hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isMigrating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Migrating...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={20} />
                    <span>Run One-Time Migration</span>
                  </>
                )}
              </button>
              
              <p className="text-xs text-gray-500 text-center">
                This button will disappear after migration
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;