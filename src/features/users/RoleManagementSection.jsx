import React, { useEffect, useState, useCallback } from "react";
import { db } from "../../firebase";
import { collection, getDocs, updateDoc, doc, addDoc, deleteDoc } from "firebase/firestore";
import UserForm from "./UserForm";
import UserDeleteDialog from "./UserDeleteDialog";
import { ShopSelector, ShopAssignmentModal, UserShopAssignments } from "../shops/ShopManagementComponents";
import { canManageShopStaff, getCurrentShop, createShopAssignment } from "../../utils/shopPermissions";
import { logAudit } from "./auditLogService";
import Spinner from "../../components/Spinner";

// HELPER FUNCTION for primary role change permissions
const canChangeRole = (editor, targetUser) => {
  if (!editor || !targetUser) return false;
  if (!targetUser.id) return true;
  if (editor.uid === targetUser.id) return false;
  if (editor.isRootAdmin) return true;
  if (editor.role === 'admin') {
    return targetUser.role !== 'admin' && !targetUser.isRootAdmin;
  }
  return false;
};

const EnhancedRoleManagementSection = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState({ type: null, data: null });
  const [selectedShop, setSelectedShop] = useState('all');
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const currentShop = getCurrentShop(currentUser);
  const canManageStaff = canManageShopStaff(currentUser);
  const canDeleteUsers = currentUser.isRootAdmin || currentUser.role === 'admin';

  const loadData = useCallback(async () => {
    try {
      const usersPromise = getDocs(collection(db, "users"));
      const shopsPromise = getDocs(collection(db, "shops"));
      
      const [userSnapshot, shopSnapshot] = await Promise.all([usersPromise, shopsPromise]);

      let allUsers = userSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      let allShops = shopSnapshot.docs.map(d => ({ id: d.id, shopId: d.id, ...d.data() }));

      if (!currentUser.isRootAdmin) {
        const managedShopIds = currentUser.assignedShops?.filter(s => s.isOwner).map(s => s.shopId) || [];
        allUsers = allUsers.filter(u => u.id === currentUser.uid || u.assignedShops?.some(s => managedShopIds.includes(s.shopId)));
        
        const accessibleShopIds = currentUser.assignedShops?.map(s => s.shopId) || [];
        allShops = allShops.filter(s => accessibleShopIds.includes(s.shopId));
      }
      setUsers(allUsers);
      setShops(allShops);
    } catch (err) {
      setError("Failed to load data: " + err.message);
    }
  }, [currentUser]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const handleSaveUser = async (formData) => {
    setLoading(true);
    setError("");
    setToast("");
    try {
      if (formData.id) { // UPDATE
        const { id, ...data } = formData;
        const targetUser = users.find(u => u.id === id);
        
        if (targetUser && data.role !== targetUser.role && !canChangeRole(currentUser, targetUser)) {
          throw new Error("You do not have permission to change this user's primary role.");
        }
        
        await updateDoc(doc(db, "users", id), data);
        setToast("User updated successfully.");
        await logAudit({ action: "updateUser", performedBy: currentUser.email, target: formData.email, details: data });
      } else { // CREATE
        await addDoc(collection(db, "users"), { ...formData, createdAt: new Date() });
        setToast("User added successfully.");
        await logAudit({ action: "addUser", performedBy: currentUser.email, target: formData.email, details: formData });
      }
      await loadData();
    } catch (err) {
      setError(`Failed to save user: ${err.message}`);
    } finally {
      setDialog({ type: null, data: null });
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === currentUser.uid) {
      setError("You cannot delete your own account.");
      setDialog({ type: null, data: null });
      return;
    }
    if (!canDeleteUsers) {
      setError("You do not have permission to delete users.");
      return;
    }
    try {
      const userToDelete = users.find(u => u.id === userId);
      await deleteDoc(doc(db, "users", userId));
      setToast("User deleted successfully.");
      await logAudit({ action: "deleteUser", performedBy: currentUser.email, target: userToDelete.email });
      await loadData();
    } catch (err) {
      setError("Failed to delete user: " + err.message);
    } finally {
      setDialog({ type: null, data: null });
    }
  };

  const handleShopAssignment = async (user, assignment) => {
    setError("");
    setToast("");
    const isAssignerAdmin = currentUser.isRootAdmin || currentUser.role === 'admin';
    if (assignment.role === 'admin' && !isAssignerAdmin) {
        setError("You do not have permission to assign the 'Admin' role.");
        return;
    }
    try {
      const shopAssignment = createShopAssignment(assignment.shopId, assignment.shopName, assignment.role, assignment.isOwner, currentUser.uid);
      const updatedAssignments = [...(user.assignedShops || []), shopAssignment];
      await updateDoc(doc(db, "users", user.id), { 
        assignedShops: updatedAssignments, 
        currentShop: user.currentShop || assignment.shopId
      });
      await loadData();
      setToast(`User assigned to ${assignment.shopName}.`);
      await logAudit({ action: "assignUserToShop", performedBy: currentUser.email, target: user.email, details: { shopId: assignment.shopId, role: assignment.role } });
    } catch (err) {
      setError("Assignment failed: " + err.message);
    } finally {
      setDialog({ type: null, data: null });
    }
  };

  const handleRemoveShopAssignment = async (userId, shopId) => {
    if (!window.confirm("Remove user from this shop?")) return;
    try {
      const user = users.find(u => u.id === userId);
      const updatedAssignments = user.assignedShops.filter(shop => shop.shopId !== shopId);
      const newCurrentShop = user.currentShop === shopId ? (updatedAssignments[0]?.shopId || null) : user.currentShop;
      await updateDoc(doc(db, "users", userId), { assignedShops: updatedAssignments, currentShop: newCurrentShop });
      await loadData();
      setToast("User removed from shop.");
      await logAudit({ action: "removeUserFromShop", performedBy: currentUser.email, target: user.email, details: { shopId } });
    } catch (err) {
      setError("Removal failed: " + err.message);
    }
  };

  const handleUpdateShopRole = async (userId, shopId, newRole) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return setError("Could not find the user to update.");
    const updatedAssignments = userToUpdate.assignedShops.map(shop => 
      shop.shopId === shopId ? { ...shop, role: newRole } : shop
    );
    try {
      await updateDoc(doc(db, "users", userId), { assignedShops: updatedAssignments });
      await loadData();
      setToast("User's shop role has been updated.");
      await logAudit({ action: "updateShopRole", performedBy: currentUser.email, target: userToUpdate.email, details: { shopId, newRole }});
    } catch (err) {
      setError("Failed to update shop role: " + err.message);
    }
  };

  const filteredUsers = selectedShop === 'all'
    ? users
    : users.filter(user => user.assignedShops?.some(shop => shop.shopId === selectedShop));

  if (loading) {
    return <Spinner text="Loading Role Management..." />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header and Filters are preserved */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Role Management</h2>
          <p className="text-gray-600 mt-1">Manage user roles and shop assignments</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-4">
          <ShopSelector user={currentUser} onShopChange={(id) => setSelectedShop(id)} />
        </div>
      </div>

      {/* Alerts are preserved */}
      {error && <div className="bg-red-100 text-red-700 rounded-lg p-3 mb-4">{error}</div>}
      {toast && <div className="bg-green-100 text-green-700 rounded-lg p-3 mb-4">{toast}</div>}

      {/* User Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Users ({filteredUsers.length})</h3>
          {canManageStaff && (
            <button
              onClick={() => setDialog({ type: 'user_form', data: {} })}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Add User
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Assignments</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.displayName || user.name || user.email}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    {/* --- FIX #1: Pass currentUser to handle permissions --- */}
                    <UserShopAssignments
                      user={user}
                      onRemoveAssignment={handleRemoveShopAssignment}
                      onUpdateRole={handleUpdateShopRole}
                      currentUser={currentUser}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.blocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {user.blocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-4">
                        <button onClick={() => setDialog({ type: 'shop_assign', data: user })} className="text-blue-600 hover:text-blue-800">Assign Shop</button>
                        <button onClick={() => setDialog({ type: 'user_form', data: user })} className="text-indigo-600 hover:text-indigo-800">Edit</button>
                        {canDeleteUsers && currentUser.uid !== user.id && (
                           <button onClick={() => setDialog({ type: 'delete_user', data: user })} className="text-red-600 hover:text-red-800">Delete</button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODALS --- */}
      {dialog.type === 'shop_assign' && (
        <ShopAssignmentModal
          user={dialog.data}
          shops={shops}
          onSave={(assignment) => handleShopAssignment(dialog.data, assignment)}
          onClose={() => setDialog({ type: null, data: null })}
          // --- FIX #2: Pass currentUser to handle permissions ---
          currentUser={currentUser}
        />
      )}
      {dialog.type === 'user_form' && (
        <UserForm
          user={dialog.data}
          onSave={handleSaveUser}
          onClose={() => setDialog({ type: null, data: null })}
          editMode={!!dialog.data.id}
          allowRoleChange={canChangeRole(currentUser, dialog.data)}
        />
      )}
      {dialog.type === 'delete_user' && (
        <UserDeleteDialog
          user={dialog.data}
          onConfirm={() => handleDeleteUser(dialog.data.id)}
          onClose={() => setDialog({ type: null, data: null })}
        />
      )}
    </div>
  );
};

export default EnhancedRoleManagementSection;