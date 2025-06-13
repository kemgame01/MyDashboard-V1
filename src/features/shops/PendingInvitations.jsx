// src/features/shops/PendingInvitations.jsx
import React, { useState, useEffect } from 'react';
import { 
  getPendingInvitations, 
  acceptInvitation, 
  rejectInvitation 
} from '../../services/shopInvitationService';
import { Mail, Calendar, Shield, Check, X } from 'lucide-react';

const PendingInvitations = ({ user, onUpdate }) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.email) {
      loadInvitations();
    }
  }, [user]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const pending = await getPendingInvitations(user.email);
      setInvitations(pending);
    } catch (err) {
      setError('Failed to load invitations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitation) => {
    setProcessingId(invitation.id);
    setError('');
    
    try {
      await acceptInvitation(invitation.id, user.uid);
      // Remove from list
      setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
      // Notify parent to refresh user data
      onUpdate && onUpdate();
    } catch (err) {
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (invitation) => {
    if (!window.confirm('Are you sure you want to reject this invitation?')) {
      return;
    }
    
    setProcessingId(invitation.id);
    setError('');
    
    try {
      await rejectInvitation(invitation.id, user.uid);
      // Remove from list
      setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
    } catch (err) {
      setError(err.message || 'Failed to reject invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-600" />
          Pending Shop Invitations ({invitations.length})
        </h3>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {invitations.map(invitation => (
          <div key={invitation.id} className="p-6 hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">
                  {invitation.shopName}
                </h4>
                
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>Role: <strong>{invitation.role}</strong></span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>Invited by: {invitation.invitedByName || invitation.invitedByEmail}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Sent: {formatDate(invitation.createdAt)}</span>
                  </div>
                </div>

                {invitation.message && (
                  <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
                    "{invitation.message}"
                  </div>
                )}
              </div>

              <div className="ml-4 flex gap-2">
                <button
                  onClick={() => handleAccept(invitation)}
                  disabled={processingId === invitation.id}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                >
                  <Check className="w-4 h-4" />
                  Accept
                </button>
                
                <button
                  onClick={() => handleReject(invitation)}
                  disabled={processingId === invitation.id}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>

            {invitation.expiresAt && (
              <div className="mt-3 text-xs text-gray-500">
                Expires: {formatDate(invitation.expiresAt)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingInvitations;