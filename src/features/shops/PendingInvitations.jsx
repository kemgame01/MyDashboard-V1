// src/features/shops/PendingInvitations.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Mail, Check, X, Clock } from 'lucide-react';

const PendingInvitations = ({ user }) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadInvitations();
  }, [user]);

  const loadInvitations = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'shopInvitations'),
        where('email', '==', user.email),
        where('status', '==', 'pending')
      );
      
      const snapshot = await getDocs(q);
      const invites = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setInvitations(invites);
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitation) => {
    setProcessingId(invitation.id);
    
    try {
      // Update invitation status
      await updateDoc(doc(db, 'shopInvitations', invitation.id), {
        status: 'accepted',
        respondedAt: new Date()
      });

      // Add user to shop
      const shopAssignment = {
        shopId: invitation.shopId,
        shopName: invitation.shopName,
        role: invitation.role,
        isOwner: false,
        assignedAt: new Date(),
        assignedBy: invitation.invitedBy
      };

      // Update user's shop assignments
      const userRef = doc(db, 'users', user.uid);
      const updatedAssignments = [...(user.assignedShops || []), shopAssignment];
      
      await updateDoc(userRef, {
        assignedShops: updatedAssignments,
        currentShop: user.currentShop || invitation.shopId,
        updatedAt: new Date()
      });

      // Reload invitations
      await loadInvitations();
      
      // Reload page to update user context
      window.location.reload();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert('Failed to accept invitation. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (invitation) => {
    if (!window.confirm('Are you sure you want to reject this invitation?')) return;
    
    setProcessingId(invitation.id);
    
    try {
      await updateDoc(doc(db, 'shopInvitations', invitation.id), {
        status: 'rejected',
        respondedAt: new Date()
      });
      
      await loadInvitations();
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      alert('Failed to reject invitation. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Mail size={20} />
        Pending Shop Invitations ({invitations.length})
      </h3>
      
      <div className="space-y-3">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-900 font-medium">
                  You've been invited to join <span className="font-semibold">{invitation.shopName}</span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Role: <span className="font-medium capitalize">{invitation.role}</span>
                </p>
                {invitation.message && (
                  <p className="text-sm text-gray-600 mt-2 italic">
                    "{invitation.message}"
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Clock size={12} />
                  Invited {new Date(invitation.createdAt.toDate()).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleAccept(invitation)}
                  disabled={processingId === invitation.id}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <Check size={16} />
                  Accept
                </button>
                <button
                  onClick={() => handleReject(invitation)}
                  disabled={processingId === invitation.id}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <X size={16} />
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingInvitations;