// src/services/shopInvitationService.js
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { sendSignInLinkToEmail } from 'firebase/auth';
import { auth } from '../firebase';

// Invitation status constants
export const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
};

/**
 * Create a shop invitation
 * @param {Object} invitationData - The invitation details
 * @param {string} invitationData.email - Email of the user to invite
 * @param {string} invitationData.shopId - ID of the shop
 * @param {string} invitationData.shopName - Name of the shop
 * @param {string} invitationData.role - Role to assign in the shop
 * @param {string} invitationData.invitedBy - ID of the user sending invitation
 * @param {string} invitationData.invitedByName - Name of the user sending invitation
 * @param {string} invitationData.invitedByEmail - Email of the user sending invitation
 * @param {string} invitationData.message - Optional message to include
 * @returns {Promise<string>} - The invitation ID
 */
export async function createShopInvitation(invitationData) {
  try {
    // Check if user already has a pending invitation to this shop
    const existingInviteQuery = query(
      collection(db, 'shopInvitations'),
      where('email', '==', invitationData.email),
      where('shopId', '==', invitationData.shopId),
      where('status', '==', INVITATION_STATUS.PENDING)
    );
    
    const existingInvites = await getDocs(existingInviteQuery);
    if (!existingInvites.empty) {
      throw new Error('User already has a pending invitation to this shop');
    }

    // Create the invitation document
    const invitation = {
      ...invitationData,
      status: INVITATION_STATUS.PENDING,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      acceptedAt: null,
      rejectedAt: null
    };

    const docRef = await addDoc(collection(db, 'shopInvitations'), invitation);

    // Send email notification
    if (invitationData.sendEmail !== false) {
      await sendInvitationEmail(invitationData);
    }

    return docRef.id;
  } catch (error) {
    console.error('Error creating shop invitation:', error);
    throw error;
  }
}

/**
 * Send invitation email
 * @param {Object} invitationData - The invitation details
 */
export async function sendInvitationEmail(invitationData) {
  try {
    // For now, we'll use Firebase Auth's email link feature
    // In production, you might want to use a proper email service
    const actionCodeSettings = {
      url: `${window.location.origin}/accept-invitation?email=${invitationData.email}&shopId=${invitationData.shopId}`,
      handleCodeInApp: true,
    };

    await sendSignInLinkToEmail(auth, invitationData.email, actionCodeSettings);
    
    // Store the email in localStorage to complete sign-in later
    window.localStorage.setItem('emailForSignIn', invitationData.email);
  } catch (error) {
    console.error('Error sending invitation email:', error);
    // Don't throw here - invitation was created successfully even if email fails
  }
}

/**
 * Get pending invitations for a user
 * @param {string} email - User's email
 * @returns {Promise<Array>} - Array of pending invitations
 */
export async function getPendingInvitations(email) {
  try {
    const q = query(
      collection(db, 'shopInvitations'),
      where('email', '==', email),
      where('status', '==', INVITATION_STATUS.PENDING)
    );
    
    const snapshot = await getDocs(q);
    const invitations = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      // Check if invitation is expired
      if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
        // Mark as expired
        updateDoc(doc.ref, { status: INVITATION_STATUS.EXPIRED });
      } else {
        invitations.push({ id: doc.id, ...data });
      }
    });
    
    return invitations;
  } catch (error) {
    console.error('Error getting pending invitations:', error);
    throw error;
  }
}

/**
 * Get sent invitations for a shop
 * @param {string} shopId - Shop ID
 * @returns {Promise<Array>} - Array of sent invitations
 */
export async function getSentInvitations(shopId) {
  try {
    const q = query(
      collection(db, 'shopInvitations'),
      where('shopId', '==', shopId)
    );
    
    const snapshot = await getDocs(q);
    const invitations = [];
    
    snapshot.forEach(doc => {
      invitations.push({ id: doc.id, ...doc.data() });
    });
    
    return invitations;
  } catch (error) {
    console.error('Error getting sent invitations:', error);
    throw error;
  }
}

/**
 * Accept a shop invitation
 * @param {string} invitationId - Invitation ID
 * @param {string} userId - User ID accepting the invitation
 * @returns {Promise<void>}
 */
export async function acceptInvitation(invitationId, userId) {
  try {
    const invitationRef = doc(db, 'shopInvitations', invitationId);
    const invitationDoc = await getDoc(invitationRef);
    
    if (!invitationDoc.exists()) {
      throw new Error('Invitation not found');
    }
    
    const invitation = invitationDoc.data();
    
    if (invitation.status !== INVITATION_STATUS.PENDING) {
      throw new Error('Invitation is no longer pending');
    }
    
    if (invitation.expiresAt && invitation.expiresAt.toDate() < new Date()) {
      await updateDoc(invitationRef, { status: INVITATION_STATUS.EXPIRED });
      throw new Error('Invitation has expired');
    }

    // Update invitation status
    await updateDoc(invitationRef, {
      status: INVITATION_STATUS.ACCEPTED,
      acceptedAt: serverTimestamp(),
      acceptedBy: userId
    });

    // Add shop assignment to user
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const newAssignment = {
        shopId: invitation.shopId,
        shopName: invitation.shopName,
        role: invitation.role,
        isOwner: false,
        assignedAt: serverTimestamp(),
        assignedBy: invitation.invitedBy,
        invitationId: invitationId
      };
      
      const updatedAssignments = [...(userData.assignedShops || []), newAssignment];
      
      await updateDoc(userRef, {
        assignedShops: updatedAssignments,
        currentShop: userData.currentShop || invitation.shopId
      });
    }
  } catch (error) {
    console.error('Error accepting invitation:', error);
    throw error;
  }
}

/**
 * Reject a shop invitation
 * @param {string} invitationId - Invitation ID
 * @param {string} userId - User ID rejecting the invitation
 * @returns {Promise<void>}
 */
export async function rejectInvitation(invitationId, userId) {
  try {
    const invitationRef = doc(db, 'shopInvitations', invitationId);
    
    await updateDoc(invitationRef, {
      status: INVITATION_STATUS.REJECTED,
      rejectedAt: serverTimestamp(),
      rejectedBy: userId
    });
  } catch (error) {
    console.error('Error rejecting invitation:', error);
    throw error;
  }
}

/**
 * Cancel a sent invitation
 * @param {string} invitationId - Invitation ID
 * @returns {Promise<void>}
 */
export async function cancelInvitation(invitationId) {
  try {
    await deleteDoc(doc(db, 'shopInvitations', invitationId));
  } catch (error) {
    console.error('Error canceling invitation:', error);
    throw error;
  }
}

/**
 * Check if a user exists by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} - User data if exists, null otherwise
 */
export async function findUserByEmail(email) {
  try {
    const q = query(
      collection(db, 'users'),
      where('email', '==', email)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      return { id: userDoc.id, ...userDoc.data() };
    }
    
    return null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
}