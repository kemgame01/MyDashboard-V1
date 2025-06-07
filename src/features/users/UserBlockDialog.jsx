import React from "react";

const UserBlockDialog = ({ user, type, onConfirm, onClose }) => (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded shadow-xl w-full max-w-sm">
      <h3 className="font-bold mb-2">{type === "block" ? "Block User" : "Unblock User"}</h3>
      <p>
        {type === "block" ? "Block" : "Unblock"} <b>{user.displayName || user.email}</b>?
      </p>
      <div className="mt-4 flex gap-2 justify-end">
        <button className="px-4 py-2 rounded bg-gray-200" onClick={onClose}>Cancel</button>
        <button className={`px-4 py-2 rounded ${type === "block" ? "bg-red-600 text-white" : "bg-green-600 text-white"}`} onClick={onConfirm}>
          Confirm {type === "block" ? "Block" : "Unblock"}
        </button>
      </div>
    </div>
  </div>
);

export default UserBlockDialog;
