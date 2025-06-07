import React, { useState } from "react";
import { ROLE_OPTIONS } from "../../utils/roles"; // Update path as needed!

const UserForm = ({ user = {}, onSave, onClose }) => {
  // Ensure role is lowercased if present, for selector value match
  const [form, setForm] = useState({
    displayName: user.displayName ?? "",
    name: user.name ?? "",
    phone: user.phone ?? "",
    address: user.address ?? "",
    email: user.email ?? "",
    role: user.role ? user.role.toLowerCase() : "", // <--- always lowercase for select!
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
    // Normalize role to lowercase for DB
    onSave({ ...form, role: form.role.toLowerCase() });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <form
        className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-2xl relative z-50"
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <button
          className="absolute right-4 top-4 text-gray-400 text-xl"
          type="button"
          onClick={onClose}
          tabIndex={-1}
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center">
          {user.id ? "Edit" : "Add"} User
        </h2>
        {error && (
          <div className="bg-red-100 text-red-800 p-2 rounded mb-3 text-center">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              className="w-full mb-3 p-2 border rounded-lg"
              placeholder="Email"
              required
            />

            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full mb-3 p-2 border rounded-lg"
              required
            >
              <option value="">Select Role</option>
              {ROLE_OPTIONS.map((r) => (
                <option value={r.value} key={r.value}>
                  {r.label}
                </option>
              ))}
              {/* Fallback for legacy/unknown roles */}
              {form.role &&
                !ROLE_OPTIONS.some(r => r.value === form.role) && (
                  <option value={form.role}>{form.role}</option>
                )}
            </select>

            <div className="flex gap-4 items-center mb-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isRootAdmin"
                  checked={!!form.isRootAdmin}
                  onChange={handleChange}
                  className="accent-blue-600"
                />
                Root Admin
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="blocked"
                  checked={!!form.blocked}
                  onChange={handleChange}
                  className="accent-red-500"
                />
                Blocked
              </label>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-8 justify-end">
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
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
