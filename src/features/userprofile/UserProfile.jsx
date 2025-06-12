// src/features/userprofile/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { Upload, Link as LinkIcon } from 'lucide-react'; // Added for icons
import ProfileFields from './ProfileFields';
import AdminFields from './AdminFields';
import SendPasswordResetButton from '../users/SendPasswordResetButton';
import { useUserProfile } from './useUserProfile';
import { canEditProfile, canEditRoles } from '../../utils/permissions';
import { useMergedUser } from '../../hooks/useMergedUser';
import { getRoleLabel, getRoleColor } from "../../utils/roles";
import UserShopAssignments from '../shops/UserShopAssignments';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { logAudit } from '../users/auditLogService';

function isFormChanged(form, userData) {
  if (!userData) return false;
  return (
    form.displayName !== (userData.displayName ?? "") ||
    form.name !== (userData.name ?? "") ||
    form.phone !== (userData.phone ?? "") ||
    form.address !== (userData.address ?? "") ||
    (form.role?.toLowerCase?.() || "") !== ((userData.role ?? "").toLowerCase()) ||
    !!form.blocked !== !!userData.blocked
  );
}

const UserProfile = ({ targetUserId = null }) => {
  const authUser = useMergedUser();
  const currentUserId = targetUserId || authUser?.uid || null;

  const {
    userData,
    form,
    imagePreview,
    imageLink,
    loading,
    saving,
    error,
    setForm,
    setImagePreview,
    setProfileImage,
    setImageLink,
    handleChange,
    handleImageLinkChange,
    handleImageChange,
    handleSave,
    setUserData,
  } = useUserProfile(currentUserId, authUser);

  const [editing, setEditing] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    setEditing(false);
    setHasChanged(false);
  }, [userData]);
    
  const onSubmit = async (e) => {
    e.preventDefault();
    const success = await handleSave();
    if (success !== false) {
      setEditing(false);
      setHasChanged(false);
    }
  };
    
  const onCancel = () => {
    setEditing(false);
    setHasChanged(false);
    if (userData) {
      setForm({
        displayName: userData.displayName ?? '',
        name: userData.name ?? '',
        phone: userData.phone ?? '',
        address: userData.address ?? '',
        email: userData.email ?? '',
        role: (userData.role ?? "").toLowerCase(),
        blocked: !!userData.blocked,
        isRootAdmin: !!userData.isRootAdmin,
      });
      setImagePreview(userData.photoURL ?? '');
      setImageLink(userData.photoURL ?? '');
      setProfileImage(null);
    }
  };

  const onAnyChange = (e) => {
    handleChange(e);
    const maybeChanged = isFormChanged(
      { ...form, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value },
      userData
    );
    setHasChanged(maybeChanged);
  };

  const onImageChange = (e) => {
    handleImageChange(e);
    setHasChanged(true);
  };

  const handleRemoveShopAssignment = async (userId, shopId) => {
    if (!window.confirm("Are you sure you want to remove this shop assignment?")) return;
    const currentAssignments = userData.assignedShops || [];
    const updatedAssignments = currentAssignments.filter(shop => shop.shopId !== shopId);
    try {
      await updateDoc(doc(db, "users", userId), { assignedShops: updatedAssignments });
      setUserData(prevData => ({ ...prevData, assignedShops: updatedAssignments }));
      await logAudit({ action: "removeShopAssignment", performedBy: authUser.email, target: userData.email, details: { shopId } });
    } catch (error) {
      console.error("Error removing shop assignment:", error);
    }
  };

  const handleUpdateShopRole = async (userId, shopId, newRole) => {
    const currentAssignments = userData.assignedShops || [];
    const updatedAssignments = currentAssignments.map(shop =>
      shop.shopId === shopId ? { ...shop, role: newRole } : shop
    );
    try {
      await updateDoc(doc(db, "users", userId), { assignedShops: updatedAssignments });
      setUserData(prevData => ({ ...prevData, assignedShops: updatedAssignments }));
      await logAudit({ action: "updateShopRole", performedBy: authUser.email, target: userData.email, details: { shopId, newRole } });
    } catch (error) {
      console.error("Error updating shop role:", error);
    }
  };

  if (authUser === undefined || loading || !userData) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-gray-400">
        Loading profile...
      </div>
    );
  }

  const isAdmin = canEditRoles(authUser);
  const canEdit = canEditProfile(authUser, userData);
  const isSelf = authUser?.uid === userData?.id;
  const allowEditRole = isAdmin && (!isSelf);

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg p-8 mt-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center tracking-tight">
        User Profile
      </h2>
      
      {error && <div className="text-red-500 mb-4 text-center">{error}</div>}
      
      {/* --- MODIFIED PROFILE PICTURE SECTION --- */}
      <div className="flex flex-col items-center mb-10">
        <div className="relative mb-4">
          <img
            src={
              imagePreview ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                form.displayName || form.name || ''
              )}`
            }
            alt="Profile"
            className="rounded-full w-32 h-32 object-cover border-4 border-gray-200 shadow-md"
          />
        </div>

        <div className="w-full max-w-sm space-y-3">
          <label
            htmlFor="file-upload"
            className={`
              relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500
              focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500
              border border-gray-300 p-2 text-center block
              ${!editing && 'opacity-50 cursor-not-allowed'}
            `}
          >
            <div className="flex items-center justify-center gap-2">
              <Upload size={16} />
              <span>Upload a file</span>
            </div>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              accept="image/*"
              onChange={onImageChange}
              disabled={!editing}
            />
          </label>
          
          <div className="text-center text-xs text-gray-500">OR</div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LinkIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Paste an image URL"
              value={imageLink}
              onChange={(e) => {
                handleImageLinkChange(e);
                setHasChanged(true);
              }}
              className={`
                block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md
                leading-5 bg-white placeholder-gray-500
                focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                sm:text-sm
                ${!editing && 'opacity-50 bg-gray-50'}
              `}
              disabled={!editing}
            />
          </div>
        </div>
      </div>
      
      <form onSubmit={onSubmit} autoComplete="off">
        {/* Two-Column Grid for Profile Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT COLUMN: Account Information */}
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4 text-center md:text-left">
              Account Information
            </h3>
            <ProfileFields
              form={form}
              onChange={onAnyChange}
              isLoading={loading}
              editing={editing}
              userId={userData?.id}
            />
          </div>
          {/* RIGHT COLUMN: Security & Status */}
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4 text-center md:text-left">
              Security & Status
            </h3>
            <div className="space-y-3 bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div>
                <span className="font-medium">Current Role: </span>
                <span className={`ml-1 px-2 py-1 rounded text-xs font-semibold ${getRoleColor(userData.role)}`}>
                  {getRoleLabel(userData.role)}
                </span>
              </div>
              <div>
                <span className="font-medium">Root Admin: </span>
                <span className="ml-1">
                  {userData.isRootAdmin ? "Yes" : "No"}
                </span>
              </div>
              <div>
                <SendPasswordResetButton email={form.email ?? ""} />
              </div>
            </div>
            {isAdmin && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-700 mb-2">Admin Controls</h4>
                <AdminFields
                  form={form}
                  onChange={onAnyChange}
                  isLoading={loading}
                  editing={editing}
                  allowEditRole={allowEditRole}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Shop Assignments Section */}
        <div className="mt-10">
            <h3 className="text-xl font-semibold text-gray-700 mb-4 border-t pt-6">
              Shop Assignments
            </h3>
            <UserShopAssignments
                user={userData}
                onRemoveAssignment={handleRemoveShopAssignment}
                onUpdateRole={handleUpdateShopRole}
                canEdit={canEdit}
            />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 mt-8">
          {!editing ? (
            <button
              type="button"
              className="bg-blue-500 text-white py-2 px-8 rounded hover:bg-blue-600 shadow"
              onClick={() => setEditing(true)}
              disabled={saving || !canEdit}
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <button
                type="submit"
                className="bg-green-500 text-white py-2 px-8 rounded hover:bg-green-600 shadow disabled:opacity-60"
                disabled={saving || !hasChanged}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="bg-gray-400 text-white py-2 px-8 rounded hover:bg-gray-500 shadow"
                onClick={onCancel}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default UserProfile;