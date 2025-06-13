// src/features/shops/ShopInvitationModal.jsx
import React, { useState } from 'react';
import { createShopInvitation, findUserByEmail } from '../../services/shopInvitationService';
import { SHOP_PERMISSIONS } from '../../utils/shopPermissions';
import { Mail, User, Shield, MessageSquare } from 'lucide-react';

const ShopInvitationModal = ({ shop, currentUser, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchingUser, setSearchingUser] = useState(false);
  const [foundUser, setFoundUser] = useState(null);

  const isRootAdmin = currentUser?.isRootAdmin === true;

  // Search for existing user by email
  const handleEmailChange = async (value) => {
    setEmail(value);
    setFoundUser(null);
    setError('');
    
    if (value && value.includes('@')) {
      setSearchingUser(true);
      try {
        const user = await findUserByEmail(value);
        setFoundUser(user);
      } catch (err) {
        console.error('Error searching user:', err);
      } finally {
        setSearchingUser(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!role) {
      setError('Please select a role');
      return;
    }

    // Check permissions
    if (!isRootAdmin && role === 'admin') {
      setError('Only Root Admin can invite users with admin role');
      return;
    }

    setLoading(true);

    try {
      await createShopInvitation({
        email,
        shopId: shop.id,
        shopName: shop.shopName,
        role,
        invitedBy: currentUser.uid,
        invitedByName: currentUser.displayName || currentUser.email,
        invitedByEmail: currentUser.email,
        message,
        sendEmail: true
      });

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  // Available roles based on permissions
  const availableRoles = Object.keys(SHOP_PERMISSIONS).filter(r => {
    if (!isRootAdmin && r === 'admin') return false;
    if (!isRootAdmin && r === 'owner') return false;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
        <h3 className="text-lg font-bold mb-4 text-gray-800">
          Invite User to {shop.shopName}
        </h3>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium mb-1">
              <Mail className="inline w-4 h-4 mr-1" />
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="user@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
            {searchingUser && (
              <p className="text-xs text-gray-500 mt-1">Searching for user...</p>
            )}
            {foundUser && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                <User className="inline w-4 h-4 mr-1" />
                Found: {foundUser.displayName || foundUser.name || 'Existing User'}
              </div>
            )}
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium mb-1">
              <Shield className="inline w-4 h-4 mr-1" />
              Role in Shop
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            >
              {availableRoles.map(r => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              This determines what the user can do in your shop
            </p>
          </div>

          {/* Optional Message */}
          <div>
            <label className="block text-sm font-medium mb-1">
              <MessageSquare className="inline w-4 h-4 mr-1" />
              Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to the invitation..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 font-semibold"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-xs text-gray-500 text-center">
          The user will receive an email invitation to join your shop
        </div>
      </div>
    </div>
  );
};

export default ShopInvitationModal;