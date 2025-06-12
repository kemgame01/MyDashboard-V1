// src/components/ErrorPopup.jsx
import React from 'react';
import { XCircle } from 'lucide-react';

const ErrorPopup = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 text-center">
          <XCircle className="text-red-500 w-16 h-16 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h3>
          <p className="text-gray-600">
            {message}
          </p>
          <button
            onClick={onClose}
            className="mt-6 bg-red-600 text-white font-semibold py-2 px-8 rounded-lg hover:bg-red-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPopup;