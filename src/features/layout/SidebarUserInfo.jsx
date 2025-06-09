import React from "react";

export default function SidebarUserInfo({ user, getMaskedId, getInitials }) {
  const userName = user.name || user.displayName || (user.email ? user.email.split('@')[0] : "Unknown");
  const userEmail = user.email || "-";
  const userRole = (user.role || "").toLowerCase();
  const isRootAdmin = user.isRootAdmin === true;
  const photoURL = user.photoURL || "";

  return (
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
        <div className="text-xs text-gray-300 break-all">ID: {getMaskedId(user.uid)}</div>
      </div>
    </div>
  );
}
