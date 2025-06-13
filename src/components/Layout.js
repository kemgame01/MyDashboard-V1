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
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      <Sidebar
        user={user}
        activeSection={activeSection}
        handleLogout={handleLogout}
        showSection={showSection}
      />
      <main className="flex-1 w-full overflow-x-hidden py-8 px-4 sm:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
