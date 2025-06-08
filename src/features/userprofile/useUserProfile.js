import { useState, useEffect } from 'react';
import { fetchUserData, updateUserData, uploadProfileImage } from './profileService';

export function useUserProfile(editingUserId, currentUser) {
  const [userData, setUserData] = useState(null);
  const [form, setForm] = useState({
    displayName: "",
    name: "",
    phone: "",
    address: "",
    email: "",
    role: "",
    blocked: false,
    isRootAdmin: false,
  });
  const [imagePreview, setImagePreview] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [imageLink, setImageLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isAdmin =
    !!currentUser &&
    (currentUser.role === 'admin' || currentUser.isRootAdmin === true);

  useEffect(() => {
    if (!editingUserId) return;
    setLoading(true);
    fetchUserData(editingUserId)
      .then(data => {
        setUserData(data);
        if (data) {
          setForm({
            displayName: data.displayName ?? '',
            name: data.name ?? '',
            phone: data.phone ?? '',
            address: data.address ?? '',
            email: data.email ?? '',
            role: data.role ?? '',
            blocked: !!data.blocked,
            isRootAdmin: !!data.isRootAdmin,
          });
          setImagePreview(data.photoURL ?? '');
          setImageLink(data.photoURL ?? '');
        }
      })
      .finally(() => setLoading(false));
  }, [editingUserId]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value ?? "",
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfileImage(file);
    setImagePreview(URL.createObjectURL(file));
    setImageLink('');
  };

  const handleImageLinkChange = (e) => {
    const url = e.target.value;
    setImageLink(url);
    setProfileImage(null);
    setImagePreview(url);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      let updates = {
        displayName: form.displayName ?? '',
        name: form.name ?? '',
        phone: form.phone ?? '',
        address: form.address ?? '',
      };
      if (isAdmin) {
        updates.role = (form.role ?? '').toLowerCase(); // normalize for DB
        updates.blocked = !!form.blocked;
      }
      if (profileImage) {
        const url = await uploadProfileImage(userData.id, profileImage);
        updates.photoURL = url;
      } else if (imageLink) {
        updates.photoURL = imageLink;
      }
      await updateUserData(userData.id, updates);
      // Refresh user data
      const newData = await fetchUserData(userData.id);
      setUserData(newData);
      setForm({
        displayName: newData.displayName ?? '',
        name: newData.name ?? '',
        phone: newData.phone ?? '',
        address: newData.address ?? '',
        email: newData.email ?? '',
        role: newData.role ?? '',
        blocked: !!newData.blocked,
        isRootAdmin: !!newData.isRootAdmin,
      });
      setImagePreview(newData.photoURL ?? '');
      setImageLink(newData.photoURL ?? '');
      setProfileImage(null);
      setSaving(false);
      return true;
    } catch (err) {
      setError('Failed to update profile. ' + (err.message || ''));
      setSaving(false);
      return false;
    }
  };

  return {
    userData,
    form,
    setForm,
    imagePreview,
    setImagePreview,
    profileImage,
    setProfileImage,
    imageLink, // <-- ADD THIS
    setImageLink, // <-- (optional, if you want to set manually)
    loading,
    saving,
    error,
    setError,
    handleChange,
    handleImageChange,
    handleImageLinkChange, // <-- ADD THIS so your UI can call it
    handleSave,
    isAdmin,
  };
}
