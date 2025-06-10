import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { useMergedUser } from '../hooks/useMergedUser'; // Import the hook
import Layout from './Layout';
import CustomerSection from '../features/customers/CustomerSection'; // Corrected import path
import RoleManagementSection from '../features/users/RoleManagementSection';
import TaskManagementSection from './TaskManagementSection';
import CategoryBrandManager from './CategoryBrandManager';
import InventoryDashboard from '../features/inventory/InventoryDashboard';
import UserProfile from '../features/userprofile/UserProfile';
import SalesDashboard from '../features/sales/SalesDashboard';
import Spinner from './Spinner'; // Import the spinner for a better loading state

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('customers');
  const user = useMergedUser(); // Use the hook to get the complete user object

  // This effect now only handles remembering the active section
  useEffect(() => {
    const savedSection = localStorage.getItem('activeSection');
    if (savedSection) {
      setActiveSection(savedSection);
    }
  }, []);

  // This effect handles redirecting if the user logs out
  useEffect(() => {
    if (user === null) { // user is loaded but not logged in
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      // The useEffect above will handle the navigation
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const showSection = (section) => {
    setActiveSection(section);
    localStorage.setItem('activeSection', section);
  };

  // Show a spinner while the user object is being fetched
  if (user === undefined) {
    return <Spinner text="Loading Dashboard..." />;
  }

  // This should not happen if the useEffect redirects, but as a fallback
  if (!user) {
    return null; 
  }

  const isRootAdmin = user.isRootAdmin === true;
  const role = (user.role || "").toLowerCase();

  return (
    <Layout
      user={user}
      activeSection={activeSection}
      handleLogout={handleLogout}
      showSection={showSection}
    >
      {activeSection === 'customers' && <CustomerSection userId={user.uid} user={user} />}
      {activeSection === 'roleManagement' && (role === "admin" || isRootAdmin) && (
        <RoleManagementSection currentUser={user} />
      )}
      {activeSection === 'taskManagement' && (role === "admin" || role === "manager" || isRootAdmin) && (
        <TaskManagementSection userId={user.uid} isRootAdmin={isRootAdmin} />
      )}
      {activeSection === 'inventory' && (role === "admin" || role === "manager" || isRootAdmin) && (
        <InventoryDashboard user={user} />
      )}
      {activeSection === 'sales' && (
        <SalesDashboard user={user} />   
      )}
      {activeSection === 'brandCategory' && isRootAdmin && (
        <CategoryBrandManager user={user} />
      )}
      {activeSection === 'userProfile' && (
        <UserProfile targetUserId={user.uid} />
      )}
    </Layout>
  );
};

export default Dashboard;