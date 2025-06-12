// src/features/layout/Sidebar.jsx
import React, { useState } from "react";
// --- FIX: Corrected the import statement to be valid JavaScript ---
import {
  Menu, X,
  Home, UserCircle, Shield, ClipboardList,
  Boxes, DollarSign, Layers, Settings, Ticket, Book,
  Building
} from "lucide-react";
import SidebarNavItem from "./SidebarNavItem";
import SidebarUserInfo from "./SidebarUserInfo";
import SidebarLogoutButton from "./SidebarLogoutButton";

const Sidebar = ({
  user,
  handleLogout,
  showSection,
  activeSection,
  navBadges = {},
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState(null);

  if (!user) {
    return (
      <aside className="w-64 bg-gray-800 text-white flex flex-col items-center justify-center min-h-screen">
        <div className="animate-pulse text-sm text-gray-400">Loading user...</div>
      </aside>
    );
  }

  const userRole = (user.role || "").toLowerCase();
  const isRootAdmin = user.isRootAdmin === true;

  const navLinks = [
    { label: "Dashboard", icon: <Home size={18} />, onClick: () => showSection("customers", user), show: true, activeKey: "customers" },
    { label: "Profile", icon: <UserCircle size={18} />, onClick: () => showSection("userProfile", user), show: true, activeKey: "userProfile" },
    {
      label: "Orders", icon: <Ticket size={18} />, show: true, activeKey: "orders", badge: navBadges.orders,
      children: [
        { label: "All Orders", icon: <Ticket size={16} />, onClick: () => showSection("allOrders", user), activeKey: "allOrders" },
        { label: "Pending Orders", icon: <Ticket size={16} />, onClick: () => showSection("pendingOrders", user), activeKey: "pendingOrders" }
      ]
    },
    { label: "Role Management", icon: <Shield size={18} />, onClick: () => showSection("roleManagement", user), show: userRole === "admin" || isRootAdmin, activeKey: "roleManagement" },
    { label: "Task Management", icon: <ClipboardList size={18} />, onClick: () => showSection("taskManagement", user), show: userRole === "admin" || userRole === "manager" || isRootAdmin, activeKey: "taskManagement" },
    { label: "Inventory", icon: <Boxes size={18} />, onClick: () => showSection("inventory", user), show: userRole === "admin" || userRole === "manager" || isRootAdmin, activeKey: "inventory" },
    { label: "Sales", icon: <DollarSign size={18} />, onClick: () => showSection("sales", user), show: userRole === "sales" || userRole === "manager" || userRole === "admin" || isRootAdmin, activeKey: "sales" },
    {
      label: "Manage",
      icon: <Settings size={18} />,
      show: isRootAdmin,
      activeKey: "manage",
      children: [
        { 
          label: "Brands/Categories", 
          icon: <Layers size={16} />, 
          onClick: () => showSection("brandCategory", user), 
          activeKey: "brandCategory" 
        },
        { 
          label: "Shop Manager", 
          icon: <Building size={16} />,
          onClick: () => showSection("shopManagement", user), 
          activeKey: "shopManagement" 
        }
      ]
    },
    { label: "Docs", icon: <Book size={18} />, url: "https://tailwindcss.com/docs/", external: true, show: true },
  ];

  const sidebarContent = (
    <>
      <SidebarUserInfo user={user} />
      <ul className="space-y-2">
        {navLinks
          .filter((item) => item.show)
          .map((item, idx) => (
            <SidebarNavItem
              key={idx}
              item={item}
              isActive={activeSection === (item.activeKey || item.label)}
              isExpanded={expandedIdx === idx}
              onExpand={setExpandedIdx}
              expandedIdx={expandedIdx}
              idx={idx}
              setMobileOpen={setMobileOpen}
              onClick={() => {}}
            />
          ))}
      </ul>
      <SidebarLogoutButton handleLogout={handleLogout} />
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