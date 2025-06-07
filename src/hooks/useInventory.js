import { useState, useEffect } from "react";
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
import { logInventoryHistory } from "../services/logInventoryHistory";

// Helper: fetch from a collection (for brands, categories)
const fetchCollection = async (col) => {
  const snap = await getDocs(collection(db, col));
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export function useInventory(user) {
  // --- State ---
  const [inventory, setInventory] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [selectedRows, setSelectedRows] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    subcategory: "",
    brand: "",
    quantity: "",
    minStock: "",
    unitPrice: "",
    supplier: "",
    location: "",
    description: "",
  });
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [newBrand, setNewBrand] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Permission checker ---
  function canEditInventory(user) {
    const role = user?.role?.toLowerCase?.();
    return user?.isRootAdmin === true || role === "admin" || role === "manager";
  }

  // --- Data loading ---
  useEffect(() => {
    if (user?.uid) loadData();
    // eslint-disable-next-line
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, `users/${user.uid}/inventory`));
      const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setInventory(items);
      setFiltered(items);
      setBrands(await fetchCollection("brands"));
      setCategories(await fetchCollection("categories"));
      setSelectedRows([]);
    } catch (err) {
      setFormError("Failed to load data: " + err.message);
    }
    setLoading(false);
  };

  // --- Filtering/search ---
  useEffect(() => {
    let data = inventory;
    if (search.trim()) {
      const val = search.toLowerCase();
      data = data.filter(
        (item) =>
          (item.name || "").toLowerCase().includes(val) ||
          (item.sku || "").toLowerCase().includes(val) ||
          (item.brand || "").toLowerCase().includes(val) ||
          (item.category || "").toLowerCase().includes(val)
      );
    }
    setFiltered(
      selectedBrand === "ALL"
        ? data
        : data.filter((item) => (item.brand || "No Brand") === selectedBrand)
    );
  }, [search, inventory, selectedBrand]);

  // --- Brand grouping ---
  const groupedByBrand = filtered.reduce((acc, item) => {
    const brand = item.brand || "No Brand";
    if (!acc[brand]) acc[brand] = [];
    acc[brand].push(item);
    return acc;
  }, {});

  // --- Handlers for selection ---
  const handleSelectRow = (id) => {
    setSelectedRows((rows) =>
      rows.includes(id) ? rows.filter((row) => row !== id) : [...rows, id]
    );
  };
  const handleSelectAll = () => {
    const allDisplayed = Object.values(groupedByBrand).flat().map((item) => item.id);
    if (selectedRows.length === allDisplayed.length) setSelectedRows([]);
    else setSelectedRows(allDisplayed);
  };

  // --- Form/modal handlers ---
  const openForm = (item = null) => {
    setEditId(item ? item.id : null);
    setShowForm(true);
    setFormError("");
    if (item) {
      setForm({ ...item });
      updateSubcategories(item.category);
    } else {
      setForm({
        name: "",
        sku: "",
        category: "",
        subcategory: "",
        brand: "",
        quantity: "",
        minStock: "",
        unitPrice: "",
        supplier: "",
        location: "",
        description: "",
      });
      setSubcategories([]);
    }
  };
  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setFormError("");
    setForm({
      name: "",
      sku: "",
      category: "",
      subcategory: "",
      brand: "",
      quantity: "",
      minStock: "",
      unitPrice: "",
      supplier: "",
      location: "",
      description: "",
    });
    setSubcategories([]);
  };

  const updateSubcategories = (categoryName) => {
    const cat = categories.find((c) => c.name === categoryName);
    setSubcategories(cat ? cat.subcategories : []);
    setForm((f) => ({ ...f, category: categoryName, subcategory: "" }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (name === "category") updateSubcategories(value);
    setFormError("");
  };

  // --- Validators and Save/Delete ---
  const validateForm = () => {
    if (!form.name || !form.brand || !form.category)
      return "Name, brand, and category are required.";
    if (
      !form.quantity ||
      isNaN(Number(form.quantity)) ||
      Number(form.quantity) < 0
    )
      return "Quantity must be a number ≥ 0.";
    if (
      !form.minStock ||
      isNaN(Number(form.minStock)) ||
      Number(form.minStock) < 0
    )
      return "Min Stock must be a number ≥ 0.";
    if (
      !form.unitPrice ||
      isNaN(Number(form.unitPrice)) ||
      Number(form.unitPrice) < 0
    )
      return "Unit Price must be a number ≥ 0.";
    return "";
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    // Permission check!
    if (!canEditInventory(user)) {
      setFormError("You do not have permission to add or edit inventory.");
      setIsSubmitting(false);
      return;
    }

    const err = validateForm();
    if (err) {
      setFormError(err);
      setIsSubmitting(false);
      return;
    }

    const fallbackName =
      user.displayName || (user.email ? user.email.split("@")[0] : "Unknown");
    const colRef = collection(db, `users/${user.uid}/inventory`);

    try {
      if (editId) {
        const oldItem = inventory.find((item) => item.id === editId);
        await updateDoc(doc(colRef, editId), {
          ...form,
          quantity: Number(form.quantity),
          minStock: Number(form.minStock),
          unitPrice: Number(form.unitPrice),
          updatedBy: {
            userId: user.uid,
            name: fallbackName,
            avatar: user.photoURL || "",
          },
          updatedAt: serverTimestamp(),
        });
        if (oldItem && Number(form.quantity) !== Number(oldItem.quantity)) {
          await logInventoryHistory(user.uid, {
            productId: editId,
            productName: form.name,
            changeType: "edit",
            quantityBefore: Number(oldItem.quantity),
            quantityAfter: Number(form.quantity),
            changeAmount: Number(form.quantity) - Number(oldItem.quantity),
            changedBy: { userId: user.uid, name: fallbackName },
            note: "Manual adjustment",
          });
        }
      } else {
        const docRef = await addDoc(colRef, {
          ...form,
          quantity: Number(form.quantity),
          minStock: Number(form.minStock),
          unitPrice: Number(form.unitPrice),
          createdBy: {
            userId: user.uid,
            name: fallbackName,
            avatar: user.photoURL || "",
          },
          updatedBy: {
            userId: user.uid,
            name: fallbackName,
            avatar: user.photoURL || "",
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await logInventoryHistory(user.uid, {
          productId: docRef.id,
          productName: form.name,
          changeType: "add",
          quantityBefore: 0,
          quantityAfter: Number(form.quantity),
          changeAmount: Number(form.quantity),
          changedBy: { userId: user.uid, name: fallbackName },
          note: "Initial stock",
        });
      }
      await loadData();
      closeForm();
    } catch (err) {
      setFormError("Failed to save: " + err.message);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    // Permission check!
    if (!canEditInventory(user)) {
      alert("You do not have permission to delete inventory.");
      return;
    }
    if (!window.confirm("Delete this item?")) return;
    try {
      const oldItem = inventory.find((item) => item.id === id);
      const fallbackName =
        user.displayName || (user.email ? user.email.split("@")[0] : "Unknown");
      const colRef = collection(db, `users/${user.uid}/inventory`);
      await deleteDoc(doc(colRef, id));
      if (oldItem) {
        await logInventoryHistory(user.uid, {
          productId: id,
          productName: oldItem.name,
          changeType: "delete",
          quantityBefore: Number(oldItem.quantity),
          quantityAfter: 0,
          changeAmount: -Number(oldItem.quantity),
          changedBy: { userId: user.uid, name: fallbackName },
          note: "Deleted product",
        });
      }
      await loadData();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (!canEditInventory(user)) {
      alert("You do not have permission to bulk delete inventory.");
      return;
    }
    if (!selectedRows.length) return;
    if (
      !window.confirm(
        `Delete ${selectedRows.length} selected item(s)? This cannot be undone.`
      )
    )
      return;
    try {
      for (let id of selectedRows) {
        await handleDelete(id);
      }
      await loadData();
    } catch (err) {
      alert("Bulk delete failed: " + err.message);
    }
  };

  const handleExport = () => {
    const fields = [
      "name",
      "sku",
      "category",
      "subcategory",
      "brand",
      "quantity",
      "minStock",
      "unitPrice",
      "supplier",
      "location",
      "description",
    ];
    const csvRows = [
      fields.join(","),
      ...inventory.map((item) =>
        fields
          .map((f) =>
            `"${(item[f] ?? "").toString().replace(/"/g, '""')}"`
          )
          .join(",")
      ),
    ];
    const csvData = csvRows.join("\n");
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Add brand/category/subcategory ---
  const addBrand = async () => {
    if (!newBrand) return;
    await addDoc(collection(db, "brands"), { name: newBrand });
    setBrands(await fetchCollection("brands"));
    setNewBrand("");
  };

  const addCategory = async () => {
    if (!newCategory) return;
    await addDoc(collection(db, "categories"), {
      name: newCategory,
      subcategories: [],
    });
    setCategories(await fetchCollection("categories"));
    setNewCategory("");
  };

  const addSubcategory = async () => {
    if (!newSubcategory || !form.category) return;
    const catDoc = categories.find((c) => c.name === form.category);
    if (!catDoc) return;
    const updated = [...(catDoc.subcategories || []), newSubcategory];
    await updateDoc(doc(db, "categories", catDoc.id), {
      subcategories: updated,
    });
    setCategories(await fetchCollection("categories"));
    setSubcategories(updated);
    setNewSubcategory("");
  };

  // --- Brand options for filter dropdown ---
  const brandOptions = Array.from(
    new Set(inventory.map((item) => item.brand || "No Brand"))
  ).filter(Boolean);

  return {
    inventory,
    filtered,
    loading,
    brands,
    categories,
    subcategories,
    brandOptions,
    search,
    setSearch,
    selectedBrand,
    setSelectedBrand,
    selectedRows,
    handleSelectRow,
    handleSelectAll,
    form,
    showForm,
    openForm,
    closeForm,
    handleFormChange,
    handleSave,
    isSubmitting,
    formError,
    handleDelete,
    handleBulkDelete,
    handleExport,
    newBrand,
    setNewBrand,
    addBrand,
    newCategory,
    setNewCategory,
    addCategory,
    newSubcategory,
    setNewSubcategory,
    addSubcategory,
    updateSubcategories,
    groupedByBrand,
  };
}
