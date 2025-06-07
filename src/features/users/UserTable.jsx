import React, { useState } from "react";
import SendPasswordResetButton from "./SendPasswordResetButton"; // Make sure path is correct

const ROLES = ["Admin", "Manager", "Staff", "Sales", "Viewer" ];

function formatDate(ts) {
  if (!ts) return "-";
  if (ts.toDate) ts = ts.toDate();
  return ts instanceof Date ? ts.toLocaleString() : "-";
}

const UserTable = ({
  users,
  loading,
  currentUser,
  onAdd,
  onEdit,
  onDelete,
  onBlock,
  onUnblock,
  onRoleChange,
}) => {
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter(
    (u) =>
      (u.displayName || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.role || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center mb-3 gap-2">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded font-bold"
          onClick={onAdd}
        >
          + Add User
        </button>
        <input
          className="border p-2 rounded w-72"
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {loading ? (
        <div>Loading users…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow rounded">
            <thead className="bg-blue-50">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Role</th>
                <th className="p-2 text-left">Root</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Last Login</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
              {filteredUsers.map((u) => (
                <tr key={u.id} className={u.blocked ? "bg-red-50" : ""}>
                  <td className="p-2">{u.displayName || "-"}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold
                      ${u.role === "Admin"
                        ? "bg-blue-100 text-blue-800"
                        : u.role === "Manager"
                        ? "bg-green-100 text-green-800"
                        : u.role === "Staff"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-700"
                      }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    {u.isRootAdmin ? (
                      <span className="text-blue-800 font-bold" title="Root Admin">⭐</span>
                    ) : ""}
                  </td>
                  <td className="p-2">
                    {u.blocked ? (
                      <span className="bg-red-200 text-red-700 px-2 rounded text-xs">Blocked</span>
                    ) : (
                      <span className="bg-green-50 text-green-700 px-2 rounded text-xs">Active</span>
                    )}
                  </td>
                  <td className="p-2 text-xs text-gray-500">{formatDate(u.lastLogin)}</td>
                  <td className="p-2 flex gap-2 flex-wrap items-center">
                    <button className="text-blue-700 underline" onClick={() => onEdit(u)}>Edit</button>
                    <select
                      value={u.role}
                      onChange={e => onRoleChange(u, e.target.value)}
                      className="border rounded p-1"
                    >
                      {ROLES.map(r => <option value={r} key={r}>{r}</option>)}
                    </select>
                    {!u.blocked && (
                      <button className="text-red-700 underline" onClick={() => onBlock(u)}>Block</button>
                    )}
                    {u.blocked && (
                      <button className="text-green-700 underline" onClick={() => onUnblock(u)}>Unblock</button>
                    )}
                    <button className="text-red-600 underline" onClick={() => onDelete(u)}>Delete</button>
                    {/* Password reset button */}
                    <SendPasswordResetButton email={u.email} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserTable;
