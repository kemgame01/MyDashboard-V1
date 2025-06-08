import { useState, useEffect } from "react";
import { collection, query, orderBy, startAt, endAt, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// Utility: deduplicate array by id
function dedupeById(arr) {
  const seen = new Set();
  return arr.filter(x => {
    if (seen.has(x.id)) return false;
    seen.add(x.id);
    return true;
  });
}

export default function useCustomers(userId, searchTerm = "") {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !searchTerm || searchTerm.length < 2) {
      setCustomers([]);
      return;
    }
    setLoading(true);

    const fetchCustomers = async () => {
      try {
        const colRef = collection(db, "users", userId, "customers");
        // Query by firstName
        const qName = query(
          colRef,
          orderBy("firstName"),
          startAt(searchTerm),
          endAt(searchTerm + "\uf8ff"),
          limit(10)
        );
        // Query by phoneNumber
        const qPhone = query(
          colRef,
          orderBy("phoneNumber"),
          startAt(searchTerm),
          endAt(searchTerm + "\uf8ff"),
          limit(10)
        );

        const [snapName, snapPhone] = await Promise.all([
          getDocs(qName),
          getDocs(qPhone)
        ]);

        // Merge, dedupe, and format
        const allDocs = [
          ...snapName.docs,
          ...snapPhone.docs
        ];
        const deduped = dedupeById(
          allDocs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            name:
              doc.data().firstName && doc.data().lastName
                ? `${doc.data().firstName} ${doc.data().lastName}`
                : doc.data().firstName || doc.data().lastName || "",
          }))
        );
        setCustomers(deduped);
      } catch (err) {
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [userId, searchTerm]);

  return [customers, loading];
}
