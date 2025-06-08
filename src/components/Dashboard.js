import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import Layout from './Layout'; // Import your new Layout!
import CustomerSection from './CustomerSection';
import RoleManagementSection from '../features/users/RoleManagementSection';
import TaskManagementSection from './TaskManagementSection';
import CategoryBrandManager from './CategoryBrandManager';
import InventoryDashboard from '../features/inventory/InventoryDashboard';
import UserProfile from '../features/userprofile/UserProfile';
import SalesDashboard from '../features/sales/SalesDashboard';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('customers');
  const [user, setUser] = useState(undefined); // undefined = loading, null = not logged in

  useEffect(() => {
    const savedSection = localStorage.getItem('activeSection');
    if (savedSection) setActiveSection(savedSection);

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        const userDocRef = doc(db, 'users', authUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUser({ ...authUser, ...userDocSnap.data() });
        } else {
          setUser(null);
          handleLogout();
        }
      } else {
        setUser(null);
        navigate('/', { replace: true });
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } finally {
      navigate('/', { replace: true });
    }
  };

  const showSection = (section) => {
    setActiveSection(section);
    localStorage.setItem('activeSection', section);
  };

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f5f7fb] text-gray-400">
        Loading user...
      </div>
    );
  }
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f5f7fb] text-red-600">
        User not found or not authorized.
      </div>
    );
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
        <UserProfile currentUser={user} />
      )}
    </Layout>
  );
};

export default Dashboard;
