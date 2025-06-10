// src/features/customers/CustomerDeleteModal.js
import React from "react";
import Modal from "../../components/Modal";

export default function CustomerDeleteModal({ show, onConfirm, onCancel }) {
  return (
    <Modal isOpen={show} onClose={onCancel}>
      <div>
        <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
        <p>Are you sure you want to delete this customer?</p>
        <div className="flex justify-end gap-4 mt-6">
          <button
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
