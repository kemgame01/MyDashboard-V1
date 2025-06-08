import React, { useState } from "react";
import { Menu, X } from "lucide-react";

const Sidebar = ({
  user,
  handleLogout,
  showSection,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) {
    return (
      <aside className="w-64 bg-gray-800 text-white flex flex-col items-center justify-center min-h-screen">
        <div className="animate-pulse text-sm text-gray-400">Loading user...</div>
      </aside>
    );
  }

  // User info (with safe defaults)
  const userId = user.uid || "-";
  const userName = user.name || user.displayName || (user.email ? user.email.split('@')[0] : "Unknown");
  const userEmail = user.email || "-";
  const userRole = (user.role || "").toLowerCase();
  const isRootAdmin = user.isRootAdmin === true;
  const photoURL = user.photoURL || "";

  const getMaskedId = (uid) => {
    if (!uid) return "-";
    return uid.slice(0, 10) + "-XXXXXXX";
  };

  const getInitials = (nameOrEmail) => {
    if (!nameOrEmail) return "?";
    return nameOrEmail
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navLinks = [
    { label: "Dashboard", onClick: () => showSection("customers", user), show: true },
    { label: "Profile", onClick: () => showSection("userProfile", user), show: true },
    { label: "Role Management", onClick: () => showSection("roleManagement", user), show: userRole === "admin" || isRootAdmin },
    { label: "Task Management", onClick: () => showSection("taskManagement", user), show: userRole === "admin" || userRole === "manager" || isRootAdmin },
    { label: "Inventory Management", onClick: () => showSection("inventory", user), show: userRole === "admin" || userRole === "manager" || isRootAdmin },
    { label: "Sales", onClick: () => showSection("sales", user), show: userRole === "sales" || userRole === "manager" || userRole === "admin" || isRootAdmin },
    { label: "Manage Brands/Categories", onClick: () => showSection("brandCategory", user), show: isRootAdmin },
  ];

  const sidebarContent = (
    <>
      {/* User info */}
      <div>
        <div className="flex items-center mb-6 space-x-3">
          {photoURL ? (
            <img
              src={photoURL}
              alt="User"
              className="rounded-full w-12 h-12 object-cover border-2 border-blue-500 shadow"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="rounded-full bg-blue-500 w-12 h-12 flex items-center justify-center text-lg font-bold">
              {getInitials(userName || userEmail)}
            </div>
          )}
          <div>
            <div className="font-semibold text-white">{userName}</div>
            <div className="text-xs text-white">{userEmail}</div>
            <div className="text-xs text-white capitalize">
              Role: {userRole || "-"}
              {isRootAdmin && " / Root Admin"}
            </div>
            <div className="text-xs text-gray-300 break-all">ID: {getMaskedId(userId)}</div>
          </div>
        </div>
        {/* Nav links */}
        <ul className="space-y-2">
          {navLinks
            .filter((item) => item.show)
            .map((item, idx) => (
              <li key={idx} className="hover:bg-gray-700 p-2 rounded">
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    item.onClick();
                  }}
                  className="block w-full text-left"
                >
                  {item.label}
                </button>
              </li>
            ))}
        </ul>
      </div>
      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition mt-auto w-full"
      >
        Logout
      </button>
    </>
  );

  return (
    <>
      {/* Hamburger (mobile) */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-gray-800 text-white p-2 rounded-md focus:outline-none"
        onClick={() => setMobileOpen((open) => !open)}
        aria-label="Open sidebar"
        tabIndex={0}
      >
        {mobileOpen ? <X size={28} /> : <Menu size={28} />}
      </button>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col justify-between w-64 bg-gray-800 text-white p-6 min-h-screen"
        style={{ minHeight: "100vh" }}
      >
        {sidebarContent}
      </aside>
      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 left-0 z-40 bg-gray-800 text-white w-64 h-full flex flex-col justify-between p-6 transform transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:hidden`}
        style={{ minHeight: "100vh" }}
        tabIndex={-1}
        aria-modal="true"
        role="dialog"
      >
        {sidebarContent}
      </aside>
      {/* Overlay when sidebar open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}
    </>
  );
};

export default Sidebar;
