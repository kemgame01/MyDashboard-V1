// src/features/users/UserInviteDialog.jsx
import React, { useState } from "react";
import InputField from "../../components/InputField";
import { inviteUser } from "./inviteService";

const ROLES = ["Admin", "Manager", "Staff", "Sales", "Viewer"];

const UserInviteDialog = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ email: "", role: "Viewer", displayName: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await inviteUser(form);
      setLoading(false);
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to invite user.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <form onSubmit={handleInvite} className="bg-white p-6 rounded shadow-xl w-full max-w-sm">
        <h3 className="font-bold mb-2 text-lg text-blue-700">Invite User by Email</h3>
        {error && <div className="bg-red-100 text-red-700 rounded p-2 mb-2">{error}</div>}

        <InputField
          label="Email"
          id="email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          disabled={loading}
        />
        <InputField
          label="Display Name"
          id="displayName"
          type="text"
          name="displayName"
          value={form.displayName}
          onChange={handleChange}
          disabled={loading}
        />

        <div className="mb-4">
          <label htmlFor="role" className="block text-gray-700 mb-2">Role</label>
          <select
            id="role"
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="flex gap-2 justify-end mt-2">
          <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white">
            {loading ? "Inviting..." : "Send Invite"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserInviteDialog;
