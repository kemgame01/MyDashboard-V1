// AdminFields.jsx
import React from "react";
import InputField from "../../components/InputField";
import { ROLES } from "../../utils/permissions";

const AdminFields = ({ form, onChange, isLoading, editing, allowEditRole }) => (
  <>
    <div className="mb-4">
      <label className="block text-gray-700 mb-2">Role</label>
      <select
        name="role"
        value={form.role ?? ""}
        onChange={onChange}
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={isLoading || !editing || !allowEditRole}
      >
        {ROLES.map(r => (
          <option key={r} value={r}>
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </option>
        ))}
      </select>
      {(!allowEditRole && editing) && (
        <div className="text-xs text-gray-500 mt-1">
          You cannot change your own role (admin safety).
        </div>
      )}
    </div>
    <div className="mb-4 flex items-center">
      <label className="block text-gray-700 mr-4">Blocked</label>
      <input
        type="checkbox"
        name="blocked"
        checked={!!form.blocked}
        onChange={onChange}
        disabled={isLoading || !editing}
        className="h-5 w-5"
      />
    </div>
    <InputField
      label="Is Root Admin"
      id="isRootAdmin"
      type="text"
      value={form.isRootAdmin ? 'true' : 'false'}
      onChange={() => {}}
      name="isRootAdmin"
      disabled={true}
    />
  </>
);

export default AdminFields;
