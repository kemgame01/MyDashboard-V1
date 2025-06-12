// src/components/Layout.js
import React from 'react';
import Sidebar from '../features/layout/Sidebar';

export default function Layout({
  user,
  activeSection,
  handleLogout,
  showSection,
  children,
}) {
  return (
    // The outermost background can be a slightly different shade or the same
    <div className="App flex min-h-screen bg-white">
      <Sidebar
        user={user}
        activeSection={activeSection}
        handleLogout={handleLogout}
        showSection={showSection}
      />
      {/* --- MODIFIED: Added bg-gray-50 for a consistent content background --- */}
      <main className="main-content flex-1 min-w-0 py-8 px-2 sm:px-8 bg-gray-50">
        {children}
      </main>
    </div>
  );
}