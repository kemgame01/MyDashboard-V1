import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase";

const UserResetPasswordDialog = ({ email, onClose }) => {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const handleReset = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-xl w-full max-w-sm">
        <h3 className="font-bold mb-2">Reset Password</h3>
        {sent ? (
          <div className="text-green-700">Password reset email sent to <b>{email}</b></div>
        ) : (
          <>
            {error && <div className="bg-red-100 text-red-700 rounded p-2 mb-2">{error}</div>}
            <div className="mb-4">Send password reset email to <b>{email}</b>?</div>
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2 rounded bg-gray-200" onClick={onClose}>Cancel</button>
              <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={handleReset}>
                Send Email
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserResetPasswordDialog;
