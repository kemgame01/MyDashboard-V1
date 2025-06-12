// src/hooks/useShopManager.js
import { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";

export function useShopManager() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchShops = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "shops"));
      const shopList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setShops(shopList);
    } catch (err) {
      setError("Failed to load shops: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const addShop = async (shopName) => {
    if (!shopName.trim()) return;
    try {
      await addDoc(collection(db, "shops"), { shopName: shopName.trim() });
      await fetchShops(); // Refresh list
    } catch (err) {
      setError("Failed to add shop: " + err.message);
    }
  };

  const updateShop = async (shopId, newName) => {
    if (!newName.trim()) return;
    try {
      await updateDoc(doc(db, "shops", shopId), { shopName: newName.trim() });
      await fetchShops(); // Refresh list
    } catch (err) {
      setError("Failed to update shop: " + err.message);
    }
  };

  const deleteShop = async (shopId) => {
    if (!window.confirm("Are you sure you want to delete this shop? This could affect user assignments.")) return;
    try {
      await deleteDoc(doc(db, "shops", shopId));
      await fetchShops(); // Refresh list
    } catch (err) {
      setError("Failed to delete shop: " + err.message);
    }
  };

  return {
    shops,
    loading,
    error,
    addShop,
    updateShop,
    deleteShop
  };
}