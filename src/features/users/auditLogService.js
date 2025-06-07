import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
export async function logAudit({ action, performedBy, target, details }) {
  await addDoc(collection(db, "auditLogs"), {
    action, performedBy, target, details, timestamp: serverTimestamp()
  });
}
