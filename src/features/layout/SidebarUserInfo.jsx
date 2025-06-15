import React from "react";
import '../../styles/sidebar-profile-enhancement.css';

// --- Helper Functions ---
// Moved here from Sidebar.jsx for better encapsulation.
const getMaskedId = (uid) => (!uid ? "-" : uid.slice(0, 10) + "-XXXXXXX");

const getInitials = (nameOrEmail) =>
  !nameOrEmail
    ? "?"
    : nameOrEmail
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

// --- Component ---
// Now it only needs the 'user' prop.
export default function SidebarUserInfo({ user }) {
  const userName = user.name || user.displayName || (user.email ? user.email.split('@')[0] : "Unknown");
  const userEmail = user.email || "-";
  const userRole = (user.role || "").toLowerCase();
  const isRootAdmin = user.isRootAdmin === true;
  const isShopOwner = user.assignedShops?.some(shop => shop.isOwner) || false;
  const photoURL = user.photoURL || "";
  
  // Determine user status (you can make this dynamic based on real-time data)
  const userStatus = 'online'; // 'online', 'away', 'busy', 'offline'
  
  const getRoleDisplay = () => {
    if (isRootAdmin) return 'Root Admin';
    if (isShopOwner) return 'Shop Owner';
    return userRole || 'Staff';
  };

  return (
    <div className="sidebar-profile-wrapper">
      <div className="sidebar-profile">
        {/* Profile Image with Online Status */}
        <div className="sidebar-profile-image">
          {photoURL ? (
            <img
              src={photoURL}
              alt="User"
              className="sidebar-profile-avatar-img"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="sidebar-profile-avatar">
              {getInitials(userName || userEmail)}
            </div>
          )}
          {/* Online Status Indicator */}
          <div className={`online-status ${userStatus !== 'online' ? userStatus : ''}`}></div>
        </div>
        
        {/* Profile Info */}
        <div className="sidebar-profile-info">
          <div className="sidebar-profile-name">{userName}</div>
          <div className="sidebar-profile-email">{userEmail}</div>
          <div className={`sidebar-profile-role ${
            isRootAdmin ? 'root-admin' : isShopOwner ? 'shop-owner' : 'staff'
          }`}>
            {getRoleDisplay()}
          </div>
          <div className="sidebar-profile-id">ID: {getMaskedId(user.uid)}</div>
          
          {/* Optional: Status Text */}
          <div className="sidebar-profile-status">
            <span className="status-dot"></span>
            <span>Active now</span>
          </div>
        </div>
      </div>
    </div>
  );
}