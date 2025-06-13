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
          target: formData.email, 
          details: data 
        });
      } else { 
        // CREATE new user
        if (!canAddUsers) {
          throw new Error("Only Root Admin can add new users.");
        }
        
        // New users default to 'viewer' role as requested
        const newUserData = {
          ...formData,
          role: formData.role || 'viewer',
          createdAt: new Date(),
          updatedAt: new Date(),
          assignedShops: [],
          currentShop: null,
          isRootAdmin: false,
          blocked: false
        };
        
        await addDoc(collection(db, "users"), newUserData);
        setToast("User added successfully with viewer role.");
        await logAudit({ 
          action: "addUser", 
          performedBy: currentUser.email, 
          target: formData.email, 
          details: newUserData 
        });
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
    if (!canDeleteUsers) {
      setError("Only Root Admin can delete users.");
      return;
    }
    
    try {
      const userToDelete = users.find(u => u.id === userId);
      await deleteDoc(doc(db, "users", userId));
      setToast("User deleted successfully.");
      await logAudit({ 
        action: "deleteUser", 
        performedBy: currentUser.email, 
        target: userToDelete.email 
      });
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
    
    // Permission checks
    if (!isRootAdmin) {
      // Check if current user owns the shop they're assigning to
      const ownsTargetShop = currentUser.assignedShops?.some(shop => 
        shop.shopId === assignment.shopId && shop.isOwner
      );
      
      if (!ownsTargetShop) {
        setError("You can only assign users to shops you own.");
        return;
      }
      
      // Non-root admins cannot make someone a shop owner
      if (assignment.isOwner) {
        setError("Only Root Admin can assign shop ownership.");
        return;
      }
    }
    
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
        currentShop: user.currentShop || assignment.shopId,
        updatedAt: new Date()
      });
      
      await loadData();
      setToast(`User assigned to ${assignment.shopName} as ${assignment.role}.`);
      await logAudit({ 
        action: "assignUserToShop", 
        performedBy: currentUser.email, 
        target: user.email, 
        details: { 
          shopId: assignment.shopId, 
          shopName: assignment.shopName,
          role: assignment.role,
          isOwner: assignment.isOwner 
        } 
      });
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

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
          <div className="flex-1">
            <p className="text-red-800">{error}</p>
          </div>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700">
            <X size={20} />
          </button>
        </div>
      )}

      {toast && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
          <div className="flex-1">
            <p className="text-green-800">{toast}</p>
          </div>
          <button onClick={() => setToast("")} className="text-green-500 hover:text-green-700">
            <X size={20} />
          </button>
        </div>
      )}

      {/* Shop Filter */}
      {shops.length > 0 && (
        <div className="mb-6">
          <ShopSelector
            user={currentUser}
            shops={[{ id: 'all', shopName: 'All Shops' }, ...shops]}
            selectedShop={selectedShop}
            onShopChange={setSelectedShop}
            includeAllOption={false}
          />
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('users')}
            className={`mr-6 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="inline w-4 h-4 mr-2" />
            Users ({filteredUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invitations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Mail className="inline w-4 h-4 mr-2" />
            Pending Invitations ({filteredInvitations.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'users' ? (
        <div className="space-y-6">
          {/* Add User Button - Only for Root Admin */}
          {canAddUsers && (
            <div className="flex justify-end">
              <button
                onClick={() => setDialog({ type: 'user', data: null })}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <UserPlus size={20} />
                Add New User
              </button>
            </div>
          )}

          {/* Users List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <li key={user.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {user.displayName || user.email}
                          </h3>
                          <p className="text-sm text-gray-500">{user.email}</p>
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
                  </div>
                </li>
              ))}
            </ul>
          </div>

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
            <div className="text-center py-12 bg-white rounded-lg">
              <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No pending invitations</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <ul className="divide-y divide-gray-200">
                {filteredInvitations.map((invitation) => (
                  <li key={invitation.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {invitation.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          Role: {invitation.role} | Shop: {invitation.shopName}
                        </p>
                        <p className="text-xs text-gray-400">
                          Sent: {new Date(invitation.createdAt.toDate()).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCancelInvitation(invitation.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {dialog.type === 'user' && (
        <UserForm
          user={dialog.data}
          onSave={handleSaveUser}
          onClose={() => setDialog({ type: null, data: null })}
          canChangeGlobalRole={canChangeGlobalRole(currentUser, dialog.data)}
        />
      )}

      {dialog.type === 'assign' && (
        <ShopAssignmentModal
          user={dialog.data}
          shops={shops}
          currentUser={currentUser}
          onSave={handleShopAssignment}
          onClose={() => setDialog({ type: null, data: null })}
        />
      )}

      {dialog.type === 'invite' && (
        <ShopInvitationModal
          shop={dialog.data}
          currentUser={currentUser}
          onClose={() => setDialog({ type: null, data: null })}
          onSuccess={loadData}
        />
      )}

      {dialog.type === 'delete' && (
        <UserDeleteDialog
          user={dialog.data}
          onConfirm={() => handleDeleteUser(dialog.data.id)}
          onClose={() => setDialog({ type: null, data: null })}
        />
      )}
    </div>
  );
};

export default RoleManagementSection;