// src/hooks/useCategoryBrandManager.js
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
import { downloadFile, parseCSV } from "../utils/importExportUtils";

export function useCategoryBrandManager() {
  const [brands, setBrands] = useState([]);
  const [editingBrandId, setEditingBrandId] = useState(null);
  const [editingBrandName, setEditingBrandName] = useState("");
  const [newBrand, setNewBrand] = useState("");

  const [categories, setCategories] = useState([]);
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [newCat, setNewCat] = useState("");
  const [editingSubcat, setEditingSubcat] = useState({ id: null, idx: -1, value: "" });
  const [newSubcat, setNewSubcat] = useState({ catId: null, value: "" });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getAll = useCallback(async () => {
    setLoading(true);
    try {
      const brandSnap = await getDocs(collection(db, "brands"));
      setBrands(brandSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      
      const catSnap = await getDocs(collection(db, "categories"));
      setCategories(catSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      setError("Failed to load data: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getAll();
  }, [getAll]);

  // Brand CRUD
  const addBrandHandler = useCallback(async () => {
    if (!newBrand.trim()) return;
    await addDoc(collection(db, "brands"), { name: newBrand.trim() });
    setNewBrand("");
    getAll();
  }, [newBrand, getAll]);

  const updateBrandHandler = useCallback(async (id, name) => {
    await updateDoc(doc(db, "brands", id), { name });
    setEditingBrandId(null);
    getAll();
  }, [getAll]);

  const deleteBrandHandler = useCallback(async (id) => {
    if (!window.confirm("Delete this brand?")) return;
    await deleteDoc(doc(db, "brands", id));
    getAll();
  }, [getAll]);

  // Category CRUD
  const addCatHandler = useCallback(async () => {
    if (!newCat.trim()) return;
    await addDoc(collection(db, "categories"), { name: newCat.trim(), subcategories: [] });
    setNewCat("");
    getAll();
  }, [newCat, getAll]);

  const updateCatHandler = useCallback(async (id, name) => {
    await updateDoc(doc(db, "categories", id), { name });
    setEditingCatId(null);
    getAll();
  }, [getAll]);

  const deleteCatHandler = useCallback(async (id) => {
    if (!window.confirm("Delete this category?")) return;
    await deleteDoc(doc(db, "categories", id));
    getAll();
  }, [getAll]);

  // Subcategory CRUD
  const addSubcatHandler = useCallback(async (catId) => {
    if (!newSubcat.value.trim() || newSubcat.catId !== catId) return;
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    const updated = [...(cat.subcategories || []), newSubcat.value.trim()];
    await updateDoc(doc(db, "categories", cat.id), { subcategories: updated });
    setNewSubcat({ catId: null, value: "" });
    getAll();
  }, [newSubcat, categories, getAll]);

  const updateSubcatHandler = useCallback(async (cat, idx, value) => {
    const updated = [...cat.subcategories];
    updated[idx] = value;
    await updateDoc(doc(db, "categories", cat.id), { subcategories: updated });
    setEditingSubcat({ id: null, idx: -1, value: "" });
    getAll();
  }, [getAll]);

  const deleteSubcatHandler = useCallback(async (cat, idx) => {
    if (!window.confirm("Delete this subcategory?")) return;
    const updated = [...cat.subcategories];
    updated.splice(idx, 1);
    await updateDoc(doc(db, "categories", cat.id), { subcategories: updated });
    getAll();
  }, [getAll]);
  
  // Import/Export Logic
  const exportData = useCallback((type, format) => {
    let data;
    let fileData;
    let fileName;
    let mimeType = format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json';

    if (type === "brand") {
        data = brands.map(b => ({ name: b.name }));
        fileName = `brands_export.${format}`;
    } else {
        data = categories.map(c => ({ name: c.name, subcategories: c.subcategories || [] }));
        fileName = `categories_export.${format}`;
    }

    if (format === 'json') {
        fileData = JSON.stringify(data, null, 2);
    } else {
        if (type === 'brand') {
            const header = 'brand,name';
            const rows = data.map(item => `brand,${item.name}`);
            fileData = [header, ...rows].join('\n');
        } else {
            const header = 'category,name,subcategories';
            const rows = data.map(item => `category,${item.name},${item.subcategories.join('|')}`);
            fileData = [header, ...rows].join('\n');
        }
    }
    downloadFile(fileName, fileData, mimeType);
  }, [brands, categories]);

  const importData = useCallback(async (e, type, format) => {
    const file = e.target.files[0];
    if (!file) return;
    setError("");
    setLoading(true);

    try {
        const text = await file.text();
        const items = format === 'csv' ? parseCSV(text) : JSON.parse(text);

        const collectionName = type === 'brand' ? 'brands' : 'categories';
        const currentData = type === 'brand' ? brands : categories;

        // For simplicity, this example overwrites data. A real-world app might merge.
        for (let item of currentData) {
            await deleteDoc(doc(db, collectionName, item.id));
        }
        for (let item of items) {
            await addDoc(collection(db, collectionName), item);
        }
        getAll();
    } catch (err) {
        setError("Import failed: " + err.message);
    } finally {
        e.target.value = ''; // Reset file input
    }
  }, [brands, categories, getAll]);

  return {
    brands, editingBrandId, editingBrandName, newBrand,
    setEditingBrandId, setEditingBrandName, setNewBrand,
    addBrandHandler, updateBrandHandler, deleteBrandHandler,
    
    categories, editingCatId, editingCatName, newCat, editingSubcat, newSubcat,
    setEditingCatId, setEditingCatName, setNewCat, setEditingSubcat, setNewSubcat,
    addCatHandler, updateCatHandler, deleteCatHandler,
    addSubcatHandler, updateSubcatHandler, deleteSubcatHandler,

    loading, error,
    exportData, importData
  };
}