import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase";

const SendPasswordResetButton = ({ email }) => {
  const [status, setStatus] = useState("");

  const handleSendReset = async () => {
    setStatus("sending");
    try {
      await sendPasswordResetEmail(auth, email);
      setStatus("sent");
    } catch (error) {
      setStatus("error");
    }
  };

  return (
    <span>
      <button
        className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
        onClick={handleSendReset}
        disabled={status === "sending"}
      >
        Send Password Reset
      </button>
      {status === "sent" && (
        <span className="text-green-600 ml-2">Sent!</span>
      )}
      {status === "error" && (
        <span className="text-red-600 ml-2">Failed. Try again.</span>
      )}
    </span>
  );
};

export default SendPasswordResetButton;
