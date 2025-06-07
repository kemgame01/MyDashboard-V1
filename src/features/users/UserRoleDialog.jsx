import React from "react";

const UserRoleDialog = ({ user, pendingRole, onConfirm, onClose }) => (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded shadow-xl w-full max-w-sm">
      <h3 className="font-bold mb-2">Confirm Role Change</h3>
      <p>
        Change <b>{user.displayName || user.email}</b> from <b>{user.role}</b> to <b>{pendingRole}</b>?
      </p>
      <div className="mt-4 flex gap-2 justify-end">
        <button className="px-4 py-2 rounded bg-gray-200" onClick={onClose}>Cancel</button>
        <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={onConfirm}>Confirm</button>
      </div>
    </div>
  </div>
);

export default UserRoleDialog;
