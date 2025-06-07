import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  Timestamp
} from "firebase/firestore";
import UserTable from "./UserTable";
import UserForm from "./UserForm";
import UserDeleteDialog from "./UserDeleteDialog";
import UserBlockDialog from "./UserBlockDialog";
import UserRoleDialog from "./UserRoleDialog";
import UserInviteDialog from "./UserInviteDialog";
import UserResetPasswordDialog from "./UserResetPasswordDialog";
import { logAudit } from "./auditLogService";

const initialForm = { email: "", displayName: "", role: "Viewer", isRootAdmin: false, blocked: false, permissions: {} };

const RoleManagementSection = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formUser, setFormUser] = useState(null); // Add/Edit user
  const [deleteUser, setDeleteUser] = useState(null);
  const [blockUser, setBlockUser] = useState(null);
  const [unblockUser, setUnblockUser] = useState(null);
  const [roleDialog, setRoleDialog] = useState(null); // { user, pendingRole }
  const [inviteDialog, setInviteDialog] = useState(false);
  const [resetDialog, setResetDialog] = useState(null); // { email: string }
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    getDocs(collection(db, "users"))
      .then(snap => {
        if (!ignore) setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      })
      .catch(err => setError("Error loading users: " + err.message))
      .finally(() => !ignore && setLoading(false));
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // --- Handlers ---

  const handleAddUser = async (data) => {
    try {
      const ref = await addDoc(collection(db, "users"), data);
      setUsers([...users, { ...data, id: ref.id }]);
      setToast("User added.");
      await logAudit({ action: "addUser", performedBy: currentUser.email, target: data.email, details: data });
    } catch (err) {
      setError("Add failed: " + err.message);
    }
  };

  const handleEditUser = async (id, data) => {
    try {
      await updateDoc(doc(db, "users", id), data);
      setUsers(users.map(u => u.id === id ? { ...u, ...data } : u));
      setToast("User updated.");
      await logAudit({ action: "editUser", performedBy: currentUser.email, target: data.email, details: data });
    } catch (err) {
      setError("Update failed: " + err.message);
    }
  };

  const handleDeleteUser = async (user) => {
    try {
      await deleteDoc(doc(db, "users", user.id));
      setUsers(users.filter(u => u.id !== user.id));
      setToast("User deleted.");
      await logAudit({ action: "deleteUser", performedBy: currentUser.email, target: user.email, details: { userId: user.id } });
      setDeleteUser(null);
    } catch (err) {
      setError("Delete failed: " + err.message);
    }
  };

  const handleBlockUser = async (user) => {
    try {
      await updateDoc(doc(db, "users", user.id), { blocked: true });
      setUsers(users.map(u => u.id === user.id ? { ...u, blocked: true } : u));
      setToast("User blocked.");
      await logAudit({ action: "blockUser", performedBy: currentUser.email, target: user.email, details: { userId: user.id } });
      setBlockUser(null);
    } catch (err) {
      setError("Block failed: " + err.message);
    }
  };

  const handleUnblockUser = async (user) => {
    try {
      await updateDoc(doc(db, "users", user.id), { blocked: false });
      setUsers(users.map(u => u.id === user.id ? { ...u, blocked: false } : u));
      setToast("User unblocked.");
      await logAudit({ action: "unblockUser", performedBy: currentUser.email, target: user.email, details: { userId: user.id } });
      setUnblockUser(null);
    } catch (err) {
      setError("Unblock failed: " + err.message);
    }
  };

  const handleRoleChange = async (user, pendingRole) => {
    try {
      await updateDoc(doc(db, "users", user.id), { role: pendingRole });
      setUsers(users.map(u => u.id === user.id ? { ...u, role: pendingRole } : u));
      setToast("Role changed.");
      await logAudit({ action: "changeRole", performedBy: currentUser.email, target: user.email, details: { userId: user.id, newRole: pendingRole } });
      setRoleDialog(null);
    } catch (err) {
      setError("Role update failed: " + err.message);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">User Role Management</h2>
      {error && <div className="bg-red-100 text-red-700 rounded p-2 mb-3">{error}</div>}
      {toast && <div className="bg-green-100 text-green-700 rounded p-2 mb-3">{toast}</div>}
      <div className="flex gap-2 mb-3">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded font-bold"
          onClick={() => setInviteDialog(true)}
        >
          + Invite by Email
        </button>
        <button
          className="bg-gray-700 text-white px-4 py-2 rounded font-bold"
          onClick={() => window.location.href = "/auditlog"}
        >
          View Audit Log
        </button>
      </div>
      <UserTable
        users={users}
        loading={loading}
        currentUser={currentUser}
        onAdd={() => setFormUser(initialForm)}
        onEdit={user => setFormUser(user)}
        onDelete={user => setDeleteUser(user)}
        onBlock={user => setBlockUser(user)}
        onUnblock={user => setUnblockUser(user)}
        onRoleChange={(user, pendingRole) => setRoleDialog({ user, pendingRole })}
        onResetPassword={user => setResetDialog({ email: user.email })}
      />
      {formUser && (
        <UserForm
          user={formUser}
          onSave={formUser.id ? (data) => handleEditUser(formUser.id, data) : handleAddUser}
          onClose={() => setFormUser(null)}
        />
      )}
      {deleteUser && (
        <UserDeleteDialog
          user={deleteUser}
          onConfirm={() => handleDeleteUser(deleteUser)}
          onClose={() => setDeleteUser(null)}
        />
      )}
      {blockUser && (
        <UserBlockDialog
          user={blockUser}
          type="block"
          onConfirm={() => handleBlockUser(blockUser)}
          onClose={() => setBlockUser(null)}
        />
      )}
      {unblockUser && (
        <UserBlockDialog
          user={unblockUser}
          type="unblock"
          onConfirm={() => handleUnblockUser(unblockUser)}
          onClose={() => setUnblockUser(null)}
        />
      )}
      {roleDialog && (
        <UserRoleDialog
          user={roleDialog.user}
          pendingRole={roleDialog.pendingRole}
          onConfirm={() => handleRoleChange(roleDialog.user, roleDialog.pendingRole)}
          onClose={() => setRoleDialog(null)}
        />
      )}
      {inviteDialog && (
        <UserInviteDialog
          onClose={() => setInviteDialog(false)}
          onSuccess={() => setToast("Invite sent!")}
        />
      )}
      {resetDialog && (
        <UserResetPasswordDialog
          email={resetDialog.email}
          onClose={() => setResetDialog(null)}
        />
      )}
    </div>
  );
};

export default RoleManagementSection;
