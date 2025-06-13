// src/features/users/RoleManagementSection.jsx
import React, { useEffect, useState, useCallback } from "react";
import { db } from "../../firebase";
import { collection, getDocs, updateDoc, doc, addDoc, deleteDoc } from "firebase/firestore";
import UserForm from "./UserForm";
import UserDeleteDialog from "./UserDeleteDialog";
import { ShopSelector, ShopAssignmentModal, UserShopAssignments } from "../shops/ShopManagementComponents";
import ShopInvitationModal from "../shops/ShopInvitationModal";
import { canManageShopStaff, getCurrentShop, createShopAssignment, canChangeGlobalRole, canChangeShopRole } from "../../utils/shopPermissions";
import { logAudit } from "./auditLogService";
import { getSentInvitations, cancelInvitation } from "../../services/shopInvitationService";
import Spinner from "../../components/Spinner";
import { Mail, UserPlus, Users, AlertCircle, X } from 'lucide-react';

const EnhancedRoleManagementSection = ({ currentUser }) => {
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
  
  // Only Root Admin can delete users globally
  const canDeleteUsers = isRootAdmin;
  // Only Root Admin can manage all staff, shop owners can manage their shop staff
  const canManageStaff = isRootAdmin || isShopOwner;

  // Debug logging
  useEffect(() => {
    console.log('Current User:', currentUser);
    console.log('Is Root Admin:', isRootAdmin);
    console.log('Is Shop Owner:', isShopOwner);
  }, [currentUser, isRootAdmin, isShopOwner]);

  const loadData = useCallback(async () => {
    try {
      setError(""); // Clear any previous errors
      console.log('Loading data for user:', currentUser?.email, 'Root Admin:', isRootAdmin);

      // Try to load users
      let allUsers = [];
      let allShops = [];
      let allInvitations = [];

      try {
        const userSnapshot = await getDocs(collection(db, "users"));
        allUsers = userSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log('Loaded users:', allUsers.length);
      } catch (userError) {
        console.error('Error loading users:', userError);
        // Continue even if users fail to load
      }

      try {
        const shopSnapshot = await getDocs(collection(db, "shops"));
        allShops = shopSnapshot.docs.map(d => ({ id: d.id, shopId: d.id, ...d.data() }));
        console.log('Loaded shops:', allShops.length);
      } catch (shopError) {
        console.error('Error loading shops:', shopError);
        // Continue even if shops fail to load
      }

      if (!isRootAdmin) {
        // Shop owners only see users in their shops
        const ownedShopIds = currentUser.assignedShops?.filter(s => s.isOwner).map(s => s.shopId) || [];
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
            try {
              const shopInvites = await getSentInvitations(shopId);
              allInvitations = [...allInvitations, ...shopInvites];
            } catch (inviteError) {
              console.error('Error loading invitations for shop:', shopId, inviteError);
            }
          }
        } else {
          // Non-owners and non-root admins see nothing
          allUsers = [];
          allShops = [];
        }
      } else {
        // Root admin sees all invitations
        for (const shop of allShops) {
          try {
            const shopInvites = await getSentInvitations(shop.id);
            allInvitations = [...allInvitations, ...shopInvites];
          } catch (inviteError) {
            console.error('Error loading invitations for shop:', shop.id, inviteError);
          }
        }
      }
      
      setUsers(allUsers);
      setShops(allShops);
      setInvitations(allInvitations);
    } catch (err) {
      console.error('Error in loadData:', err);
      setError(`Failed to load data: ${err.message}. Please check your Firestore security rules.`);
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
      if (formData.id) { // UPDATE
        const { id, ...data } = formData;
        const targetUser = users.find(u => u.id === id);
        
        // Check if trying to change global role
        if (targetUser && data.role !== targetUser.role && !canChangeGlobalRole(currentUser, targetUser)) {
          throw new Error("Only Root Admin can change global user roles.");
        }
        
        await updateDoc(doc(db, "users", id), data);
        setToast("User updated successfully.");
        await logAudit({ action: "updateUser", performedBy: currentUser.email, target: formData.email, details: data });
      } else { // CREATE
        // New users default to 'viewer' role
        const newUserData = {
          ...formData,
          role: formData.role || 'viewer',
          createdAt: new Date(),
          assignedShops: [],
          currentShop: null,
          isRootAdmin: false
        };
        await addDoc(collection(db, "users"), newUserData);
        setToast("User added successfully.");
        await logAudit({ action: "addUser", performedBy: currentUser.email, target: formData.email, details: newUserData });
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
      // Non-root admins cannot assign admin role in shops
      if (assignment.role === 'admin') {
        setError("Only Root Admin can assign admin role in shops.");
        return;
      }
      // Non-root admins cannot make someone a shop owner
      if (assignment.isOwner) {
        setError("Only Root Admin can assign shop ownership.");
        return;
      }
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

  const handleCancelInvitation = async (invitationId) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) return;
    
    setLoading(true);
    setError("");
    try {
      await cancelInvitation(invitationId);
      setToast("Invitation cancelled successfully.");
      await loadData();
    } catch (err) {
      setError("Failed to cancel invitation: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    if (selectedShop === 'all') return true;
    return u.assignedShops?.some(s => s.shopId === selectedShop);
  });

  const filteredInvitations = invitations.filter(inv => {
    if (selectedShop === 'all') return true;
    return inv.shopId === selectedShop;
  });

  const selectedShopData = shops.find(s => s.id === selectedShop);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
              <p className="mt-1 text-sm text-gray-500">Manage user roles and shop assignments</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              {selectedShop !== 'all' && selectedShopData && (isRootAdmin || isShopOwner) && (
                <button
                  onClick={() => setDialog({ type: 'invite_user', data: selectedShopData })}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Invite User
                </button>
              )}
              {isRootAdmin && (
                <button
                  onClick={() => setDialog({ type: 'user_form', data: { email: '', role: 'viewer' } })}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add User
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {toast && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">{toast}</p>
            </div>
            <button
              onClick={() => setToast('')}
              className="ml-3 text-green-500 hover:text-green-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="ml-3 text-red-500 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Shop Selector */}
        {shops.length > 0 && (
          <div className="mb-6">
            <ShopSelector 
              shops={shops} 
              selectedShop={selectedShop} 
              onShopChange={setSelectedShop}
              includeAllOption={true}
            />
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('users')}
                className={`${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex-1 sm:flex-none inline-flex items-center justify-center gap-2 py-4 px-6 border-b-2 font-medium text-sm transition-colors duration-200`}
              >
                <Users className="w-4 h-4" />
                <span>Users ({filteredUsers.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('invitations')}
                className={`${
                  activeTab === 'invitations'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex-1 sm:flex-none inline-flex items-center justify-center gap-2 py-4 px-6 border-b-2 font-medium text-sm transition-colors duration-200`}
              >
                <Mail className="w-4 h-4" />
                <span>Invitations ({filteredInvitations.length})</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Spinner />
            </div>
          ) : activeTab === 'users' ? (
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Global Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Assignments</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium">No users found</p>
                          <p className="text-sm mt-1">Try adjusting your filters or add a new user.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-gray-600 font-medium">
                                    {(user.name || user.displayName || user.email || '?')[0].toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name || user.displayName || 'Unnamed User'}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full 
                              ${user.isRootAdmin ? 'bg-purple-100 text-purple-800' : 
                                user.role === 'admin' ? 'bg-red-100 text-red-800' : 
                                user.role === 'viewer' ? 'bg-gray-100 text-gray-800' :
                                'bg-green-100 text-green-800'}`}>
                              {user.isRootAdmin ? 'Root Admin' : user.role || 'viewer'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <UserShopAssignments user={user} onRemove={(u, s) => handleRemoveShopAssignment(u, s)} editable={canManageStaff}/>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-3">
                              {(isRootAdmin || (isShopOwner && user.assignedShops?.some(s => 
                                currentUser.assignedShops?.some(cs => cs.shopId === s.shopId && cs.isOwner)
                              ))) && (
                                <button 
                                  onClick={() => setDialog({ type: 'shop_assign', data: user })} 
                                  className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  Assign Shop
                                </button>
                              )}
                              <button 
                                onClick={() => setDialog({ type: 'user_form', data: user })} 
                                className="text-indigo-600 hover:text-indigo-800 font-medium"
                              >
                                Edit
                              </button>
                              {canDeleteUsers && currentUser.uid !== user.id && (
                                <button 
                                  onClick={() => setDialog({ type: 'delete_user', data: user })} 
                                  className="text-red-600 hover:text-red-800 font-medium"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invited By</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInvitations.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                          <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium">No invitations found</p>
                          <p className="text-sm mt-1">Send invitations to add users to your shops.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredInvitations.map(invitation => (
                        <tr key={invitation.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invitation.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invitation.shopName}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {invitation.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${invitation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                invitation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                invitation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'}`}>
                              {invitation.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {invitation.invitedByName || invitation.invitedByEmail}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {invitation.status === 'pending' && (
                              <button 
                                onClick={() => handleCancelInvitation(invitation.id)} 
                                className="text-red-600 hover:text-red-800 font-medium"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        {dialog.type === 'user_form' && (
          <UserForm
            user={dialog.data}
            onSave={handleSaveUser}
            onClose={() => setDialog({ type: null, data: null })}
            editMode={!!dialog.data.id}
            allowRoleChange={canChangeGlobalRole(currentUser, dialog.data)}
          />
        )}

        {dialog.type === 'shop_assign' && (
          <ShopAssignmentModal
            user={dialog.data}
            shops={shops}
            onSave={(assignment) => handleShopAssignment(dialog.data, assignment)}
            onClose={() => setDialog({ type: null, data: null })}
          />
        )}

        {dialog.type === 'delete_user' && (
          <UserDeleteDialog
            user={dialog.data}
            onClose={() => setDialog({ type: null, data: null })}
            onConfirm={() => handleDeleteUser(dialog.data.id)}
          />
        )}

        {dialog.type === 'invite_user' && (
          <ShopInvitationModal
            shop={dialog.data}
            currentUser={currentUser}
            onClose={() => setDialog({ type: null, data: null })}
            onSuccess={() => {
              setToast('Invitation sent successfully!');
              loadData();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default EnhancedRoleManagementSection;