// src/features/users/RoleManagementSection.jsx
import React, { useEffect, useState, useCallback } from "react";
import { db } from "../../firebase";
import { collection, getDocs, updateDoc, doc, addDoc, deleteDoc } from "firebase/firestore";
import UserForm from "./UserForm";
import UserDeleteDialog from "./UserDeleteDialog";
import { ShopSelector, ShopAssignmentModal, UserShopAssignments } from "../shops/ShopManagementComponents";
import ShopInvitationModal from "../shops/ShopInvitationModal";
import { 
  canManageShopStaff, 
  getCurrentShop, 
  createShopAssignment, 
  canChangeGlobalRole, 
  canChangeShopRole,
  canViewRoleManagement 
} from "../../utils/shopPermissions";
import { logAudit } from "./auditLogService";
import { getSentInvitations, cancelInvitation } from "../../services/shopInvitationService";
import Spinner from "../../components/Spinner";
import { Mail, UserPlus, Users, AlertCircle, X, Shield } from 'lucide-react';

const RoleManagementSection = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState({ type: null, data: null });
  const [selectedShop, setSelectedShop] = useState('all');
  const [activeTab, setActiveTab] = useState('users');
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const currentShop = getCurrentShop(currentUser);
  const isRootAdmin = currentUser?.isRootAdmin === true;
  const isShopOwner = currentUser?.assignedShops?.some(shop => shop.isOwner) || false;
  
  // Permission checks
  const canDeleteUsers = isRootAdmin; // Only Root Admin can delete users
  const canAddUsers = isRootAdmin; // Only Root Admin can add new users
  const canManageStaff = isRootAdmin || isShopOwner; // Root Admin and Shop Owners

  // Check if user should have access to this section
  useEffect(() => {
    if (!canViewRoleManagement(currentUser)) {
      setError("You don't have permission to view this section.");
    }
  }, [currentUser]);

  const loadData = useCallback(async () => {
    try {
      setError("");
      
      // Load all users
      const userSnapshot = await getDocs(collection(db, "users"));
      let allUsers = userSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Load all shops
      const shopSnapshot = await getDocs(collection(db, "shops"));
      let allShops = shopSnapshot.docs.map(d => ({ id: d.id, shopId: d.id, ...d.data() }));
      
      let allInvitations = [];

      if (!isRootAdmin) {
        // Shop owners only see users in their shops and their own shops
        const ownedShopIds = currentUser.assignedShops
          ?.filter(s => s.isOwner)
          .map(s => s.shopId) || [];
        
        if (ownedShopIds.length > 0) {
          // Filter users to only show those assigned to owned shops
          allUsers = allUsers.filter(u => 
            u.id === currentUser.uid || // Always show self
            u.assignedShops?.some(assignment => ownedShopIds.includes(assignment.shopId))
          );
          
          // Only show owned shops
          allShops = allShops.filter(s => ownedShopIds.includes(s.shopId));
          
          // Load invitations for owned shops
          for (const shopId of ownedShopIds) {
            const shopInvites = await getSentInvitations(shopId);
            allInvitations = [...allInvitations, ...shopInvites];
          }
        } else {
          // Non-owners see only themselves
          allUsers = allUsers.filter(u => u.id === currentUser.uid);
          allShops = [];
        }
      } else {
        // Root admin sees all invitations
        for (const shop of allShops) {
          const shopInvites = await getSentInvitations(shop.id);
          allInvitations = [...allInvitations, ...shopInvites];
        }
      }
      
      setUsers(allUsers);
      setShops(allShops);
      setInvitations(allInvitations);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(`Failed to load data: ${err.message}`);
    }
  }, [currentUser, isRootAdmin]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const handleSaveUser = async (formData) => {
    setLoading(true);
    setError("");
    setToast("");
    
    try {
      if (formData.id) { 
        // UPDATE existing user
        const { id, ...data } = formData;
        const targetUser = users.find(u => u.id === id);
        
        // Check if trying to change global role
        if (targetUser && data.role !== targetUser.role && !canChangeGlobalRole(currentUser, targetUser)) {
          throw new Error("Only Root Admin can change global user roles.");
        }
        
        await updateDoc(doc(db, "users", id), {
          ...data,
          updatedAt: new Date()
        });
        
        setToast("User updated successfully.");
        await logAudit({ 
          action: "updateUser", 
          performedBy: currentUser.email, 
          target: data.email, 
          details: { fields: Object.keys(data) } 
        });
      } else { 
        // ADD new user
        if (!canAddUsers) {
          throw new Error("Only Root Admin can add new users.");
        }
        
        const newUser = { 
          ...formData, 
          createdAt: new Date(),
          updatedAt: new Date(),
          assignedShops: [],
          currentShop: null
        };
        await addDoc(collection(db, "users"), newUser);
        setToast("User added successfully.");
        await logAudit({ 
          action: "createUser", 
          performedBy: currentUser.email, 
          target: formData.email 
        });
      }
      
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setDialog({ type: null, data: null });
    }
  };

  const handleDeleteUser = async (userId) => {
    setLoading(true);
    setError("");
    try {
      const user = users.find(u => u.id === userId);
      await deleteDoc(doc(db, "users", userId));
      setToast("User deleted successfully.");
      await logAudit({ 
        action: "deleteUser", 
        performedBy: currentUser.email, 
        target: user.email 
      });
      await loadData();
    } catch (err) {
      setError("Failed to delete user: " + err.message);
    } finally {
      setLoading(false);
      setDialog({ type: null, data: null });
    }
  };

  const handleAssignUserToShop = async (user, assignment) => {
    if (!assignment) return;
    
    // Permission checks
    if (!isRootAdmin) {
      if (!canManageShopStaff(currentUser, assignment.shopId)) {
        setError("You don't have permission to manage staff in this shop.");
        return;
      }
      
      // Non-root admins cannot make someone a shop owner
      if (assignment.isOwner) {
        setError("Only Root Admin can assign shop ownership.");
        return;
      }
    }
    
    try {
      // FIX: Ensure shopId is properly set
      const shopId = assignment.shopId;
      if (!shopId) {
        setError("Invalid shop selection.");
        return;
      }

      const shopAssignment = createShopAssignment(
        shopId,
        assignment.shopName, 
        assignment.role, 
        assignment.isOwner, 
        currentUser.uid
      );
      
      // Check if user is already assigned to this shop
      const existingAssignment = user.assignedShops?.find(a => a.shopId === shopId);
      if (existingAssignment) {
        setError("User is already assigned to this shop.");
        return;
      }
      
      const updatedAssignments = [...(user.assignedShops || []), shopAssignment];
      
      await updateDoc(doc(db, "users", user.id), { 
        assignedShops: updatedAssignments, 
        currentShop: user.currentShop || shopId,
        updatedAt: new Date()
      });
      
      await loadData();
      setToast(`User assigned to ${assignment.shopName} as ${assignment.role}.`);
      await logAudit({ 
        action: "assignUserToShop", 
        performedBy: currentUser.email, 
        target: user.email, 
        details: { 
          shopId: shopId, 
          shopName: assignment.shopName,
          role: assignment.role,
          isOwner: assignment.isOwner 
        } 
      });
    } catch (err) {
      setError("Assignment failed: " + err.message);
      console.error("Assignment error:", err);
    } finally {
      setDialog({ type: null, data: null });
    }
  };

  const handleRemoveShopAssignment = async (userId, shopId) => {
    if (!window.confirm("Remove user from this shop?")) return;
    
    try {
      const user = users.find(u => u.id === userId);
      const updatedAssignments = user.assignedShops.filter(shop => shop.shopId !== shopId);
      const newCurrentShop = user.currentShop === shopId 
        ? (updatedAssignments[0]?.shopId || null) 
        : user.currentShop;
      
      await updateDoc(doc(db, "users", userId), { 
        assignedShops: updatedAssignments, 
        currentShop: newCurrentShop,
        updatedAt: new Date()
      });
      
      await loadData();
      setToast("User removed from shop.");
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

  const handleUpdateShopRole = async (userId, shopId, newRole) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    // Check permissions
    if (!canChangeShopRole(currentUser, user, shopId)) {
      setError("You don't have permission to change this user's role in this shop.");
      return;
    }

    try {
      const updatedAssignments = user.assignedShops.map(shop => 
        shop.shopId === shopId 
          ? { ...shop, role: newRole, updatedAt: new Date() }
          : shop
      );

      await updateDoc(doc(db, "users", userId), { 
        assignedShops: updatedAssignments,
        updatedAt: new Date()
      });

      await loadData();
      setToast(`Role updated to ${newRole}.`);
      await logAudit({ 
        action: "updateShopRole", 
        performedBy: currentUser.email, 
        target: user.email, 
        details: { shopId, newRole } 
      });
    } catch (err) {
      setError("Failed to update role: " + err.message);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) return;
    
    setLoading(true);
    setError("");
    try {
      await cancelInvitation(invitationId);
      setToast("Invitation cancelled successfully.");
      await logAudit({ 
        action: "cancelInvitation", 
        performedBy: currentUser.email, 
        details: { invitationId } 
      });
      await loadData();
    } catch (err) {
      setError("Failed to cancel invitation: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter displayed users based on selected shop
  const filteredUsers = selectedShop === 'all' 
    ? users 
    : users.filter(u => u.assignedShops?.some(s => s.shopId === selectedShop));

  // Filter displayed invitations based on selected shop
  const filteredInvitations = selectedShop === 'all'
    ? invitations
    : invitations.filter(i => i.shopId === selectedShop);

  if (!canViewRoleManagement(currentUser)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">You don't have permission to access Role Management.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <Spinner text="Loading role management..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Role Management</h1>
        <p className="text-gray-600">
          {isRootAdmin 
            ? "Manage all users and their shop assignments across the system."
            : "Manage staff in your shops."}
        </p>
      </div>

      {/* Toast and Error Messages */}
      {toast && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center justify-between">
          <span>{toast}</span>
          <button onClick={() => setToast("")} className="text-green-700 hover:text-green-900">
            <X size={20} />
          </button>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="text-red-700 hover:text-red-900">
            <X size={20} />
          </button>
        </div>
      )}

      {/* Shop Filter and Tabs */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          {shops.length > 1 && (
            <select
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
              className="border rounded-lg px-4 py-2"
            >
              <option value="all">All Shops</option>
              {shops.map(shop => (
                <option key={shop.id} value={shop.shopId}>
                  {shop.shopName}
                </option>
              ))}
            </select>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'users' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Users size={18} className="inline mr-2" />
              Users ({filteredUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'invitations' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Mail size={18} className="inline mr-2" />
              Invitations ({filteredInvitations.length})
            </button>
          </div>
        </div>

        {canAddUsers && (
          <button
            onClick={() => setDialog({ type: 'user', data: null })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <UserPlus size={20} />
            Add New User
          </button>
        )}
      </div>

      {/* Content */}
      {activeTab === 'users' ? (
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No users found for the selected filter.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredUsers.map(user => (
                <li key={user.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {user.displayName || user.name || user.email}
                        </h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        {user.phone && (
                          <p className="text-sm text-gray-500">Phone: {user.phone}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.isRootAdmin 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.isRootAdmin ? 'Root Admin' : user.role || 'viewer'}
                        </span>
                        {user.blocked && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Blocked
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Shop Assignments */}
                    <UserShopAssignments
                      user={user}
                      currentUser={currentUser}
                      onRemoveAssignment={handleRemoveShopAssignment}
                      onUpdateRole={handleUpdateShopRole}
                    />

                    {/* Action Buttons */}
                    <div className="mt-3 flex items-center gap-3">
                      {isRootAdmin && (
                        <button
                          onClick={() => setDialog({ type: 'user', data: user })}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Edit User
                        </button>
                      )}
                      
                      {canManageStaff && shops.length > 0 && (
                        <button
                          onClick={() => setDialog({ type: 'assign', data: user })}
                          className="text-sm text-green-600 hover:text-green-800"
                        >
                          Assign to Shop
                        </button>
                      )}
                      
                      {canDeleteUsers && user.id !== currentUser.uid && (
                        <button
                          onClick={() => setDialog({ type: 'delete', data: user })}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Delete User
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Invite User Button */}
          {canManageStaff && shops.length > 0 && (
            <div className="flex justify-center">
              <button
                onClick={() => setDialog({ 
                  type: 'invite', 
                  data: shops.find(s => s.shopId === selectedShop) || shops[0] 
                })}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Mail size={20} />
                Invite User to Shop
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInvitations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No pending invitations.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredInvitations.map(invitation => (
                <li key={invitation.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <p className="text-sm text-gray-500">
                        Invited to: {invitation.shopName} as {invitation.role}
                      </p>
                      <p className="text-xs text-gray-400">
                        By {invitation.invitedByName} • {new Date(invitation.createdAt?.toDate?.() || invitation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Cancel
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

     {/* Dialogs */}
      {dialog.type === 'user' && (
        <UserForm
          user={dialog.data}
          onSave={handleSaveUser}
          onClose={() => setDialog({ type: null, data: null })}
          isRootAdmin={isRootAdmin}
        />
      )}

      {dialog.type === 'assign' && (
        <ShopAssignmentModal
          user={dialog.data}
          shops={shops}
          currentUser={currentUser}
          onSave={(assignment) => handleAssignUserToShop(dialog.data, assignment)}
          onClose={() => setDialog({ type: null, data: null })}
        />
      )}

      {dialog.type === 'delete' && (
        <UserDeleteDialog
          user={dialog.data}
          onConfirm={() => handleDeleteUser(dialog.data.id)}
          onClose={() => setDialog({ type: null, data: null })}
        />
      )}

      {dialog.type === 'invite' && (
        <ShopInvitationModal
          shop={dialog.data}
          currentUser={currentUser}
          onSuccess={() => {
            loadData();
            setDialog({ type: null, data: null });
            setToast("Invitation sent successfully!");
          }}
          onClose={() => setDialog({ type: null, data: null })}
        />
      )}
    </div>
  );
};

export default RoleManagementSection;