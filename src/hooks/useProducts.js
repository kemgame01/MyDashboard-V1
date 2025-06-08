import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, where, limit } from "firebase/firestore";
import { db } from "../firebase";

export default function useProducts(user, searchTerm = "") {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only trigger if user exists and search term is at least 2 chars
    if (!user?.uid || !searchTerm || searchTerm.length < 2) {
      setProducts([]);
      return;
    }
    setLoading(true);

    async function fetchProducts() {
      try {
        // Convert to lowercase for case-insensitive search
        const term = searchTerm.trim().toLowerCase();
        const colRef = collection(db, "users", user.uid, "inventory");
        const q = query(
          colRef,
          orderBy("name"),
          limit(20)
        );
        const snap = await getDocs(q);
        // Filter client-side for substring match, since Firestore doesn't support "contains" with orderBy
        const results = snap.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(
            prod =>
              (prod.name || "").toLowerCase().includes(term)
          );
        setProducts(results);
      } catch (err) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [user, searchTerm]);

  return [products, loading];
}
