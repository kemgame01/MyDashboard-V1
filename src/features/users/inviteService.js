import { sendSignInLinkToEmail } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";

export const actionCodeSettings = {
  url: "https://your-app.com/finishSignUp", // must be whitelisted in Firebase
  handleCodeInApp: true,
};

export async function inviteUser({ email, role, permissions, displayName }) {
  // Send Firebase Auth invite
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  // Store invite in Firestore for tracking
  await addDoc(collection(db, "invites"), {
    email,
    role,
    permissions,
    displayName,
    sentAt: serverTimestamp(),
    status: "pending"
  });
}
