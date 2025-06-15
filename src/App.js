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
import { useMergedUser } from './hooks/useMergedUser';
import Spinner from './components/Spinner';
import './styles/animations.css';

const App = () => {
  const user = useMergedUser();

  // Enhanced loading state with better styling
  if (user === undefined) {
    return (
      <div className="App min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center space-y-4 animate-fadeIn">
          <Spinner text="Loading dashboard..." />
          <p className="text-sm text-gray-500 animate-pulse">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<CustomerSearch />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard/*"
          element={
            <PrivateRoute>
              <div className="animate-fadeIn">
                <Dashboard user={user} />
              </div>
            </PrivateRoute>
          }
        />

        {/* Admin/Root Admin Only Routes */}
        <Route
          path="/role-management"
          element={
            <PrivateRoute role="admin">
              <div className="animate-slideIn">
                <RoleManagementSection currentUser={user} />
              </div>
            </PrivateRoute>
          }
        />
        
        <Route
          path="/manage-category"
          element={
            <PrivateRoute role="admin">
              <div className="animate-slideIn">
                <CategoryBrandManager user={user} />
              </div>
            </PrivateRoute>
          }
        />

        {/* Audit Log Route */}
        <Route 
          path="/auditlog" 
          element={
            <div className="animate-fadeIn">
              <AuditLogPage />
            </div>
          } 
        />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

export default App;

// CSS Classes to add to your global stylesheet or Tailwind config:
// @keyframes fadeIn {
//   from { 
//     opacity: 0;
//   }
//   to { 
//     opacity: 1;
//   }
// }
// .animate-fadeIn {
//   animation: fadeIn 0.5s ease-out;
// }

// @keyframes slideIn {
//   from { 
//     opacity: 0;
//     transform: translateX(-20px);
//   }
//   to { 
//     opacity: 1;
//     transform: translateX(0);
//   }
// }
// .animate-slideIn {
//   animation: slideIn 0.4s ease-out;
// }