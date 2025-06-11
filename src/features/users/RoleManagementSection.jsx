// src/features/users/EnhancedRoleManagementSection.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  deleteDoc
} from "firebase/firestore";
import UserTable from "./UserTable";
import UserForm from "./UserForm";
import { ShopSelector, ShopAssignmentModal, UserShopAssignments } from "../shops/ShopManagementComponents";
import { canManageShopStaff, getCurrentShop, createShopAssignment } from "../../utils/shopPermissions";
import { logAudit } from "./auditLogService";

const EnhancedRoleManagementSection = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formUser, setFormUser] = useState(null);
  const [assignmentModal, setAssignmentModal] = useState(null); // { user }
  const [selectedShop, setSelectedShop] = useState(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  // Get current shop context
  const currentShop = getCurrentShop(currentUser);
  const canManageStaff = canManageShopStaff(currentUser);

  useEffect(() => {
    Promise.all([
      loadUsers(),
      loadShops()
    ]).finally(() => setLoading(false));
  }, []);

  const loadUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      let allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filter users based on current user's permissions
      if (!currentUser.isRootAdmin) {
        // Show only users assigned to shops the current user manages
        const managedShopIds = currentUser.assignedShops
          ?.filter(shop => shop.isOwner)
          .map(shop => shop.shopId) || [];

        allUsers = allUsers.filter(user => 
          user.id === currentUser.uid || // Always show self
          user.assignedShops?.some(shop => managedShopIds.includes(shop.shopId))
        );
      }

      setUsers(allUsers);
    } catch (err) {
      setError("Error loading users: " + err.message);
    }
  };

  const loadShops = async () => {
    try {
      const snapshot = await getDocs(collection(db, "shops"));
      let allShops = snapshot.docs.map(doc => ({ id: doc.id, shopId: doc.id, ...doc.data() }));

      // Filter shops based on current user's permissions
      if (!currentUser.isRootAdmin) {
        const accessibleShopIds = currentUser.assignedShops?.map(shop => shop.shopId) || [];
        allShops = allShops.filter(shop => accessibleShopIds.includes(shop.shopId));
      }

      setShops(allShops);
    } catch (err) {
      setError("Error loading shops: " + err.message);
    }
  };

  const handleShopAssignment = async (user, assignment) => {
    try {
      const shopAssignment = createShopAssignment(
        assignment.shopId,
        assignment.shopName,
        assignment.role,
        assignment.isOwner,
        currentUser.uid
      );

      const updatedAssignments = [...(user.assignedShops || []), shopAssignment];
      
      await updateDoc(doc(db, "users", user.id), {
        assignedShops: updatedAssignments,
        currentShop: user.currentShop || assignment.shopId // Set as default if no current shop
      });

      setUsers(users.map(u => 
        u.id === user.id 
          ? { ...u, assignedShops: updatedAssignments, currentShop: u.currentShop || assignment.shopId }
          : u
      ));

      setToast(`User assigned to ${assignment.shopName}`);
      setAssignmentModal(null);

      await logAudit({
        action: "assignUserToShop",
        performedBy: currentUser.email,
        target: user.email,
        details: { shopId: assignment.shopId, role: assignment.role }
      });
    } catch (err) {
      setError("Assignment failed: " + err.message);
    }
  };

  const handleRemoveShopAssignment = async (userId, shopId) => {
    if (!window.confirm("Remove user from this shop?")) return;

    try {
      const user = users.find(u => u.id === userId);
      const updatedAssignments = user.assignedShops.filter(shop => shop.shopId !== shopId);
      
      // If removing current shop, set new current shop or null
      const newCurrentShop = user.currentShop === shopId 
        ? (updatedAssignments[0]?.shopId || null)
        : user.currentShop;

      await updateDoc(doc(db, "users", userId), {
        assignedShops: updatedAssignments,
        currentShop: newCurrentShop
      });

      setUsers(users.map(u => 
        u.id === userId 
          ? { ...u, assignedShops: updatedAssignments, currentShop: newCurrentShop }
          : u
      ));

      setToast("User removed from shop");

      await logAudit({
        action: "removeUserFromShop",
        performedBy: currentUser.email,
        target: user.email,
        details: { shopId }
      });
    } catch (err) {
      setError("Removal failed: " + err.message);
    }
  };

  const handleCurrentShopChange = async (newShopId) => {
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        currentShop: newShopId
      });
      
      // Update local state and reload data for new shop context
      setSelectedShop(newShopId);
      await loadUsers();
    } catch (err) {
      setError("Shop change failed: " + err.message);
    }
  };

  // Filter users based on selected shop
  const filteredUsers = selectedShop && selectedShop !== 'all'
    ? users.filter(user => 
        user.assignedShops?.some(shop => shop.shopId === selectedShop)
      )
    : users;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading role management...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with Shop Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Role Management</h2>
          <p className="text-gray-600 mt-1">
            Manage user roles and shop assignments
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center gap-4">
          <ShopSelector 
            user={currentUser} 
            onShopChange={handleCurrentShopChange}
          />
          
          {/* Shop Filter */}
          <select
            value={selectedShop || 'all'}
            onChange={(e) => setSelectedShop(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2"
          >
            <option value="all">All Shops</option>
            {shops.map(shop => (
              <option key={shop.shopId} value={shop.shopId}>
                {shop.shopName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Current Shop Context */}
      {currentShop && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-blue-800 font-semibold">Managing:</span>
            <span className="text-blue-900">{currentShop.shopName}</span>
            {currentShop.isOwner && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                Owner
              </span>
            )}
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="bg-red-100 text-red-700 rounded-lg p-3 mb-4">{error}</div>
      )}
      {toast && (
        <div className="bg-green-100 text-green-700 rounded-lg p-3 mb-4">{toast}</div>
      )}

      {/* Enhanced User Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Users ({filteredUsers.length})
            </h3>
            {canManageStaff && (
              <div className="flex gap-2">
                <button
                  onClick={() => setFormUser({})}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  + Add User
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shop Assignments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.displayName || user.name || user.email}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <UserShopAssignments
                      user={user}
                      onRemoveAssignment={handleRemoveShopAssignment}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.blocked 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.blocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAssignmentModal({ user })}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Assign Shop
                      </button>
                      <button
                        onClick={() => setFormUser(user)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {assignmentModal && (
        <ShopAssignmentModal
          user={assignmentModal.user}
          shops={shops}
          onSave={(assignment) => handleShopAssignment(assignmentModal.user, assignment)}
          onClose={() => setAssignmentModal(null)}
        />
      )}

      {formUser && (
        <UserForm
          user={formUser}
          onSave={formUser.id ? 
            (data) => {} : // Handle edit
            (data) => {} // Handle add
          }
          onClose={() => setFormUser(null)}
        />
      )}
    </div>
  );
};

export default EnhancedRoleManagementSection;