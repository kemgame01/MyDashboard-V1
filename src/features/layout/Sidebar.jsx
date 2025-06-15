// src/features/layout/Sidebar.jsx
import React, { useState } from "react";
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
      <aside className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
          <div className="text-sm text-gray-400 animate-pulse">Loading user...</div>
        </div>
      </aside>
    );
  }

  const userRole = (user.role || "").toLowerCase();
  const isRootAdmin = user.isRootAdmin === true;
  const isShopOwner = user.assignedShops?.some(shop => shop.isOwner) || false;

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
    { label: "Role Management", icon: <Shield size={18} />, onClick: () => showSection("roleManagement", user), show: isRootAdmin || isShopOwner, activeKey: "roleManagement" },
    { label: "Task Management", icon: <ClipboardList size={18} />, onClick: () => showSection("taskManagement", user), show: userRole === "admin" || userRole === "manager" || isRootAdmin, activeKey: "taskManagement" },
    { label: "Inventory", icon: <Boxes size={18} />, onClick: () => showSection("inventory", user), show: userRole === "admin" || userRole === "manager" || isRootAdmin, activeKey: "inventory" },
    { label: "Sales", icon: <DollarSign size={18} />, onClick: () => showSection("sales", user), show: userRole === "sales" || userRole === "manager" || userRole === "admin" || isRootAdmin, activeKey: "sales" },
    {
      label: "Manage",
      icon: <Settings size={18} />,
      show: isRootAdmin || isShopOwner,
      activeKey: "manage",
      children: [
        { 
          label: "Brands/Categories", 
          icon: <Layers size={16} />, 
          onClick: () => showSection("brandCategory", user), 
          activeKey: "brandCategory",
          show: isRootAdmin
        },
        { 
          label: "Shop Manager", 
          icon: <Building size={16} />,
          onClick: () => showSection("shopManagement", user), 
          activeKey: "shopManagement",
          show: isRootAdmin || isShopOwner
        }
      ].filter(child => child.show !== false)
    },
    { label: "Docs", icon: <Book size={18} />, url: "https://tailwindcss.com/docs/", external: true, show: true },
  ];

  const sidebarContent = (
    <>
      {/* Enhanced User Info Section */}
      <div className="mb-5"> {/* 20px margin bottom */}
        <SidebarUserInfo user={user} />
      </div>
      
      {/* Navigation with enhanced styling */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar">
        <ul className="space-y-1 px-2">
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
                className="sidebar-nav-item"
              />
            ))}
        </ul>
      </nav>
      
      {/* Enhanced Logout Button */}
      <div className="mt-6 pt-6 border-t border-gray-700/50">
        <SidebarLogoutButton handleLogout={handleLogout} />
      </div>
    </>
  );

  return (
    <>
      {/* Enhanced Mobile Hamburger */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-gray-900/90 backdrop-blur-sm text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setMobileOpen((open) => !open)}
        aria-label="Open sidebar"
        tabIndex={0}
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Enhanced Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl min-h-screen relative overflow-hidden"
        style={{ minHeight: "100vh" }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(120, 180, 255, 0.1) 0%, transparent 50%),
                             radial-gradient(circle at 80% 80%, rgba(120, 180, 255, 0.05) 0%, transparent 50%)`
          }}></div>
        </div>
        
        {/* Content */}
        <div className="relative flex flex-col h-full p-6">
          {/* Enhanced User Info Section */}
          <div className="mb-5"> {/* 20px margin bottom */}
            <SidebarUserInfo user={user} />
          </div>
          
          {/* Navigation with enhanced styling */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar">
            <ul className="space-y-1 px-2">
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
                    className="sidebar-nav-item"
                  />
                ))}
            </ul>
          </nav>
          
          {/* Enhanced Logout Button */}
          <div className="mt-6 pt-6 border-t border-gray-700/50">
            <SidebarLogoutButton handleLogout={handleLogout} />
          </div>
        </div>
      </aside>

      {/* Enhanced Mobile Drawer */}
      <aside
        className={`fixed top-0 left-0 z-40 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white w-64 h-full flex flex-col shadow-2xl transform transition-all duration-300 ease-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:hidden`}
        style={{ minHeight: "100vh" }}
        tabIndex={-1}
        aria-modal="true"
        role="dialog"
      >
        {/* Background Pattern for Mobile */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(120, 180, 255, 0.1) 0%, transparent 50%)`
          }}></div>
        </div>
        
        {/* Content */}
        <div className="relative flex flex-col h-full p-6">
          {/* Enhanced User Info Section */}
          <div className="mb-5"> {/* 20px margin bottom */}
            <SidebarUserInfo user={user} />
          </div>
          
          {/* Navigation with enhanced styling */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar">
            <ul className="space-y-1 px-2">
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
                    className="sidebar-nav-item"
                  />
                ))}
            </ul>
          </nav>
          
          {/* Enhanced Logout Button */}
          <div className="mt-6 pt-6 border-t border-gray-700/50">
            <SidebarLogoutButton handleLogout={handleLogout} />
          </div>
        </div>
      </aside>
      
      {/* Enhanced Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}
    </>
  );
};

export default Sidebar;