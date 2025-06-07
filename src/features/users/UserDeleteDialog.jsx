import React from "react";

const UserDeleteDialog = ({ user, onConfirm, onClose }) => (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded shadow-xl w-full max-w-sm">
      <h3 className="font-bold mb-2 text-red-600">Delete User</h3>
      <p>
        Are you sure you want to <b>permanently delete</b> user{" "}
        <b>{user.displayName || user.email}</b>?<br />
        <span className="text-xs text-red-500">
          This cannot be undone.
        </span>
      </p>
      <div className="mt-4 flex gap-2 justify-end">
        <button className="px-4 py-2 rounded bg-gray-200" onClick={onClose}>Cancel</button>
        <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={onConfirm}>Confirm Delete</button>
      </div>
    </div>
  </div>
);

export default UserDeleteDialog;
