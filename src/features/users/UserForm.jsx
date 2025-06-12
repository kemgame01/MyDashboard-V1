// src/features/users/UserForm.jsx
import React, { useState } from "react";
import { ROLE_OPTIONS } from "../../utils/roles"; // Make sure this path is correct

const UserForm = ({ user = {}, onSave, onClose, editMode, allowRoleChange }) => {
  const [form, setForm] = useState({
    id: user.id ?? null,
    displayName: user.displayName ?? "",
    name: user.name ?? "",
    phone: user.phone ?? "",
    address: user.address ?? "",
    email: user.email ?? "",
    role: user.role ? user.role.toLowerCase() : "staff",
    isRootAdmin: !!user.isRootAdmin,
    blocked: !!user.blocked,
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.role) {
      setError("Email and role are required.");
      return;
    }
    setError("");
    onSave({ ...form, role: form.role.toLowerCase() });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <form
        className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-2xl relative z-50"
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <button
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-2xl"
          type="button"
          onClick={onClose}
          tabIndex={-1}
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          {user.id ? "Edit User" : "Add New User"}
        </h2>
        
        {error && (
          <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-center">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          {/* Left Column */}
          <div>
            <label className="block text-sm font-medium mb-1">Display Name</label>
            <input
              name="displayName"
              value={form.displayName}
              onChange={handleChange}
              className="w-full mb-3 p-2 border rounded-lg"
              placeholder="Display Name"
              autoFocus
            />
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full mb-3 p-2 border rounded-lg"
              placeholder="Full Name"
            />
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full mb-3 p-2 border rounded-lg"
              placeholder="Phone Number"
              type="tel"
            />
            <label className="block text-sm font-medium mb-1">Address</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full mb-3 p-2 border rounded-lg"
              placeholder="Address"
            />
          </div>
          {/* Right Column */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full mb-3 p-2 border rounded-lg bg-gray-100 cursor-not-allowed"
              placeholder="Email"
              required
              disabled={editMode}
            />

            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full mb-4 p-2 border rounded-lg"
              required
              disabled={!allowRoleChange} // Use the prop to control this field
            >
              <option value="">Select Role</option>
              {ROLE_OPTIONS.map((r) => (
                <option value={r.value} key={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            
            {!allowRoleChange && editMode && (
                <p className="text-xs text-gray-500 -mt-2 mb-4">You cannot change your own primary role.</p>
            )}

            <div className="space-y-3">
                <label className="flex items-center gap-3 font-medium">
                  <input
                    type="checkbox"
                    name="isRootAdmin"
                    checked={!!form.isRootAdmin}
                    onChange={handleChange}
                    className="h-5 w-5 rounded accent-blue-600"
                    disabled={!allowRoleChange} // Also disable this if role cannot be changed
                  />
                  Root Admin Privileges
                </label>
                <label className="flex items-center gap-3 font-medium">
                  <input
                    type="checkbox"
                    name="blocked"
                    checked={!!form.blocked}
                    onChange={handleChange}
                    className="h-5 w-5 rounded accent-red-500"
                  />
                  Account Blocked
                </label>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-8 justify-end">
          <button
            className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold"
            type="submit"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;