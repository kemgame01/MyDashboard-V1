import React, { useState, useEffect } from 'react';
import ProfileFields from './ProfileFields';
import AdminFields from './AdminFields';
import SendPasswordResetButton from '../users/SendPasswordResetButton';
import { useUserProfile } from './useUserProfile';
import { canEditProfile, canEditRoles } from '../../utils/permissions';
import { useMergedUser } from '../../hooks/useMergedUser';
import { getRoleLabel, getRoleColor } from "../../utils/roles";

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
  const [editing, setEditing] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);

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
    handleChange,
    handleImageLinkChange,
    handleImageChange,
    handleSave,
    setImageLink,
  } = useUserProfile(currentUserId, authUser);

  useEffect(() => {
    setEditing(false);
    setHasChanged(false);
  }, [userData]);

  if (authUser === undefined || loading || !userData) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-gray-400">
        Loading profile...
      </div>
    );
  }
  if (!authUser) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-red-500">
        No user found. Please log in.
      </div>
    );
  }

  const isAdmin = canEditRoles(authUser);
  const canEdit = canEditProfile(authUser, userData);
  const isSelf = authUser?.uid === userData?.id;
  const allowEditRole = isAdmin && (!isSelf);

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
  };

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg p-8 mt-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center tracking-tight">
        User Profile
      </h2>
      {error && <div className="text-red-500 mb-4 text-center">{error}</div>}
      {editing && hasChanged && (
        <div className="mb-4 p-2 bg-yellow-100 text-yellow-700 border-l-4 border-yellow-500 rounded text-center">
          <span>⚠️ You have unsaved changes!</span>
        </div>
      )}

      {/* Centered profile picture */}
      <div className="flex flex-col items-center mb-10">
        <div className="mb-3">
          <img
            src={
              imagePreview ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                form.displayName || form.name || ''
              )}`
            }
            alt="Profile"
            className="rounded-full w-32 h-32 object-cover border-4 border-gray-200 shadow"
          />
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={onImageChange}
          className="block text-sm mt-2"
          disabled={!editing}
        />
        <input
          type="text"
          placeholder="Image URL"
          value={imageLink}
          onChange={(e) => {
            handleImageLinkChange(e);
            setHasChanged(true);
          }}
          className="block text-sm mt-2 border rounded px-2 py-1"
          disabled={!editing}
        />
      </div>

      <form onSubmit={onSubmit} autoComplete="off">
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
        {/* ACTION BUTTONS */}
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
