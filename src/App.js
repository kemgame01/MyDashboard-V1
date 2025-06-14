// src/App.js
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './components/Dashboard';
import CustomerSearch from './pages/CustomerSearch';
import PrivateRoute from './components/PrivateRoute';
import AuditLogPage from './pages/AuditLogPage';
import NotFound from './pages/NotFound';
import RoleManagementSection from './features/users/RoleManagementSection';
import CategoryBrandManager from './components/CategoryBrandManager';
import AdminMigration from './pages/AdminMigration'; // Add this import
import { useMergedUser } from './hooks/useMergedUser';
import Spinner from './components/Spinner';

const App = () => {
  const user = useMergedUser();

  if (user === undefined) {
    return <div className="App"><Spinner text="Loading dashboard..." /></div>;
  }

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<CustomerSearch />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protect all /dashboard subroutes */}
        <Route
          path="/dashboard/*"
          element={
            <PrivateRoute>
              <Dashboard user={user} />
            </PrivateRoute>
          }
        />

        {/* Admin/Root Only Routes */}
        <Route
          path="/role-management"
          element={
            <PrivateRoute role="admin">
              <RoleManagementSection currentUser={user} />
            </PrivateRoute>
          }
        />
        <Route
          path="/manage-category"
          element={
            <PrivateRoute role="admin">
              <CategoryBrandManager user={user} />
            </PrivateRoute>
          }
        />
        
        {/* Add Migration Route - Root Admin Only */}
        <Route
          path="/admin/migration"
          element={
            <PrivateRoute>
              <AdminMigration user={user} />
            </PrivateRoute>
          }
        />

        <Route path="/auditlog" element={<AuditLogPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

export default App;