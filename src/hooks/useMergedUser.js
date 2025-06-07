import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

// Always fetches user by UID, never allows overlapping profiles
export function useMergedUser() {
  const [user, setUser] = useState(undefined); // undefined = loading, null = not logged in or no profile

  useEffect(() => {
    let unsubscribe;
    let cancelled = false;
    unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (!authUser) {
        setUser(null);
        return;
      }
      try {
        const userDocRef = doc(db, "users", authUser.uid);
        const userSnap = await getDoc(userDocRef);
        if (!cancelled) {
          if (userSnap.exists()) {
            // Only ever return ONE merged profile
            setUser({ ...authUser, ...userSnap.data() });
          } else {
            // Profile missing: optionally redirect or ask for setup, but no overlap!
            setUser(null);
          }
        }
      } catch (err) {
        if (!cancelled) setUser(null);
        console.error("[useMergedUser] Error fetching Firestore user:", err);
      }
    });
    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return user;
}
