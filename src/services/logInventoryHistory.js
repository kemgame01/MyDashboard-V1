import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";


// Call this after every stock change in InventoryDashboard
export async function logInventoryHistory(userId, entry) {
  await addDoc(collection(db, `users/${userId}/inventoryHistory`), {
    ...entry,
    timestamp: serverTimestamp(),
  });
}

