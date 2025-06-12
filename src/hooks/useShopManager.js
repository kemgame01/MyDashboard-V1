import { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
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

  /**
   * REVISED: Now accepts a full data object to create a new shop.
   * @param {object} shopData - The form data for the new shop.
   */
  const addShop = async (shopData) => {
    if (!shopData || !shopData.shopName || !shopData.shopName.trim()) {
        setError("Shop name is required.");
        return;
    }
    try {
      const newShopPayload = {
        shopName: shopData.shopName,
        shopId: "", // Will be updated after creation
        address: shopData.address || "",
        phone: shopData.phone || "",
        email: shopData.email || "",
        status: shopData.status || "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        settings: {
            currency: shopData.currency || "THB",
            timezone: shopData.timezone || "Asia/Bangkok",
            businessHours: {
                open: shopData.openTime || "09:00",
                close: shopData.closeTime || "18:00",
            },
        },
      };

      const docRef = await addDoc(collection(db, "shops"), newShopPayload);
      // Update the document with its own ID for the shopId field
      await updateDoc(docRef, { shopId: docRef.id });

      await fetchShops(); // Refresh list
    } catch (err) {
      setError("Failed to add shop: " + err.message);
    }
  };

  /**
   * REVISED: Now accepts a full data object to update an existing shop.
   * @param {string} shopId - The ID of the shop to update.
   * @param {object} shopData - The form data with the fields to update.
   */
  const updateShop = async (shopId, shopData) => {
    if (!shopId || !shopData) return;
    try {
        const updatePayload = {
            ...shopData, // Contains fields like shopName, address, status, etc.
            updatedAt: serverTimestamp()
        };
      await updateDoc(doc(db, "shops", shopId), updatePayload);
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