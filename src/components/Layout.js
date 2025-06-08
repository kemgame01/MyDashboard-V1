import React from 'react';
import Sidebar from './Sidebar'; // Adjust the path if needed

export default function Layout({ user, activeSection, handleLogout, showSection, children }) {
  return (
    <div className="App flex min-h-screen bg-[#f5f7fb]">
      <Sidebar
        user={user}
        activeSection={activeSection}
        handleLogout={handleLogout}
        showSection={showSection}
      />
      <main className="main-content flex-1 min-w-0 py-8 px-2 sm:px-8">
        {children}
      </main>
    </div>
  );
}
