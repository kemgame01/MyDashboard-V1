// /features/userprofile/profileService.js

import { db, storage } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Fetch a user profile by their Firestore user ID.
 * @param {string} userId
 * @returns {Promise<Object|null>} User object or null if not found.
 */
export async function fetchUserData(userId) {
  if (!userId) return null;
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
  } catch (err) {
    console.error('[profileService] fetchUserData error:', err);
    return null;
  }
}

/**
 * Update user fields in Firestore.
 * @param {string} userId
 * @param {Object} updates
 * @returns {Promise<boolean>} True on success, false on error.
 */
export async function updateUserData(userId, updates) {
  if (!userId || !updates) return false;
  try {
    await updateDoc(doc(db, 'users', userId), updates);
    return true;
  } catch (err) {
    console.error('[profileService] updateUserData error:', err);
    return false;
  }
}

/**
 * Upload a user profile image to Firebase Storage and return its URL.
 * @param {string} userId
 * @param {File} file
 * @returns {Promise<string|null>} Download URL on success, null on error.
 */
export async function uploadProfileImage(userId, file) {
  if (!userId || !file) return null;
  try {
    const storageRef = ref(storage, `profileImages/${userId}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch (err) {
    console.error('[profileService] uploadProfileImage error:', err);
    return null;
  }
}

/**
 * ProfileService - modular object for future expansion
 */
const ProfileService = {
  fetch: fetchUserData,
  update: updateUserData,
  uploadImage: uploadProfileImage,
  // Add more methods here as needed, eg. delete, batchUpdate, etc.
};

export default ProfileService;
