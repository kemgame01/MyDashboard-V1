// src/features/users/UserForm.jsx
import React, { useState } from "react";
import { ROLE_OPTIONS } from "../../utils/roles";

const UserForm = ({ user = null, onSave, onClose, isRootAdmin = false }) => {
  const isEditMode = !!user?.id;
  
  const [form, setForm] = useState({
    id: user?.id || null,
    displayName: user?.displayName || "",
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    email: user?.email || "",
    role: user?.role ? user.role.toLowerCase() : "staff",
    isRootAdmin: user?.isRootAdmin || false,
    blocked: user?.blocked || false,
  });
  
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validation
    if (!form.email || !form.email.trim()) {
      setError("Email is required.");
      return;
    }
    
    if (!form.role) {
      setError("Role is required.");
      return;
    }
    
    // For new users, ensure basic fields are set
    if (!isEditMode && !form.displayName && !form.name) {
      setError("Please provide either Display Name or Name.");
      return;
    }
    
    try {
      // Clean up the form data
      const userData = {
        ...form,
        email: form.email.trim().toLowerCase(),
        role: form.role.toLowerCase(),
        displayName: form.displayName || form.name || form.email.split('@')[0],
        updatedAt: new Date()
      };
      
      // For new users, add created timestamp
      if (!isEditMode) {
        userData.createdAt = new Date();
        userData.assignedShops = [];
        userData.currentShop = null;
      }
      
      await onSave(userData);
    } catch (err) {
      setError(err.message || "Failed to save user.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <form
        className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-2xl relative"
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <button
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-2xl"
          type="button"
          onClick={onClose}
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          {isEditMode ? "Edit User" : "Add New User"}
        </h2>
        
        {error && (
          <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Left Column */}
          <div>
            <label className="block text-sm font-medium mb-1">Display Name</label>
            <input
              name="displayName"
              value={form.displayName}
              onChange={handleChange}
              className="w-full mb-3 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Display Name"
              autoFocus
            />
            
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full mb-3 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Full Name"
            />
            
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full mb-3 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Phone Number"
              type="tel"
            />
          </div>
          
          {/* Right Column */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className={`w-full mb-3 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              placeholder="user@example.com"
              required
              disabled={isEditMode}
            />

            <label className="block text-sm font-medium mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className={`w-full mb-4 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                !isRootAdmin && isEditMode ? 'bg-gray-100' : ''
              }`}
              required
              disabled={!isRootAdmin && isEditMode}
            >
              {ROLE_OPTIONS.map((r) => (
                <option value={r.value} key={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            
            {!isRootAdmin && isEditMode && (
              <p className="text-xs text-gray-500 -mt-2 mb-4">
                Only Root Admin can change user roles.
              </p>
            )}

            <label className="block text-sm font-medium mb-1">Address</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full mb-3 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Address"
            />
          </div>
        </div>

        {/* Admin Controls - Only visible to Root Admin */}
        {isRootAdmin && (
          <div className="mt-6 space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700">Admin Controls</h3>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="isRootAdmin"
                checked={form.isRootAdmin}
                onChange={handleChange}
                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Root Admin Privileges</span>
            </label>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="blocked"
                checked={form.blocked}
                onChange={handleChange}
                className="h-4 w-4 rounded text-red-600 focus:ring-red-500"
              />
              <span className="text-sm">Account Blocked</span>
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end mt-8">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isEditMode ? "Save Changes" : "Add User"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;