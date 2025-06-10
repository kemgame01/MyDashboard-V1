import React from 'react';
import Modal from '../../components/Modal';

export default function TagChangeConfirmModal({ tagChangeInfo, onConfirm, onCancel }) {
  if (!tagChangeInfo) {
    return null;
  }

  return (
    <Modal isOpen={true} onClose={onCancel}>
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Confirm Tag Change</h3>
        <p className="text-gray-600">
          Are you sure you want to change the tag for this customer to
          <strong className="mx-1.5">{tagChangeInfo.newTag}</strong>?
        </p>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
}