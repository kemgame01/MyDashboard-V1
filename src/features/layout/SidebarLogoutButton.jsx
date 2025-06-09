import React from "react";

export default function SidebarLogoutButton({ handleLogout }) {
  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition mt-auto w-full"
    >
      Logout
    </button>
  );
}
