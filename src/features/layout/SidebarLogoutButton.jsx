import React from "react";
import { LogOut } from "lucide-react";
import '../../styles/sidebar-profile-enhancement.css';

export default function SidebarLogoutButton({ handleLogout }) {
  return (
    <button
      onClick={handleLogout}
      className="sidebar-logout-button"
    >
      <LogOut size={18} className="sidebar-logout-icon" />
      <span className="sidebar-logout-text">Logout</span>
    </button>
  );
}