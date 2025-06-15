// src/features/customers/TagChangeConfirmModal.jsx
import React from 'react';
import Modal from '../../components/Modal';
import '../../styles/CustomerSection.css';

export default function TagChangeConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  selectedCount, 
  newTag,
  isLoading = false
}) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="customer-modal">
        <div className="customer-modal-header">
          <h3 className="customer-modal-title">Confirm Tag Change</h3>
        </div>
        
        <div className="customer-modal-body">
          {newTag ? (
            <>
              <p className="text-gray-600 mb-4">
                Are you sure you want to change the tag for {selectedCount} customer{selectedCount > 1 ? 's' : ''} to:
              </p>
              <div className="text-center mb-6">
                <span className={`
                  inline-flex items-center px-4 py-2 rounded-full text-sm font-medium
                  ${newTag === 'New' ? 'bg-blue-100 text-blue-800' :
                    newTag === 'VIP' ? 'bg-purple-100 text-purple-800' :
                    newTag === 'Active' ? 'bg-green-100 text-green-800' :
                    newTag === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                    newTag === 'Blocked' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'}
                `}>
                  {newTag}
                </span>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-4">
                Are you sure you want to remove all tags from {selectedCount} customer{selectedCount > 1 ? 's' : ''}?
              </p>
              <div className="text-center mb-6">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  No Tag
                </span>
              </div>
            </>
          )}
          <p className="text-sm text-gray-500 text-center">
            This will replace any existing tags on the selected customers.
          </p>
        </div>
        
        <div className="customer-modal-footer">
          <button
            onClick={onClose}
            className="customer-btn customer-btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
            }}
            className="customer-btn customer-btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Confirm Change'}
          </button>
        </div>
      </div>
    </Modal>
  );
}