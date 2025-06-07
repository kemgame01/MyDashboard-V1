import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";

// Simple CSV/JSON parsing utilities
function downloadFile(filename, data, type = "text/csv") {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text) {
  // Simple CSV parser: expects header,name[,subcategories]
  const lines = text.trim().split("\n");
  const [header, ...rows] = lines;
  const [type] = header.split(",");
  return rows.map((row) => {
    const parts = row.split(",");
    if (type === "brand") return { name: parts[1] };
    if (type === "category")
      return {
        name: parts[1],
        subcategories: parts[2] ? parts[2].split("|") : [],
      };
    return null;
  });
}

export default function CategoryBrandManager() {
  // Brands state
  const [brands, setBrands] = useState([]);
  const [editingBrandId, setEditingBrandId] = useState(null);
  const [editingBrandName, setEditingBrandName] = useState("");
  const [newBrand, setNewBrand] = useState("");

  // Categories state
  const [categories, setCategories] = useState([]);
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [newCat, setNewCat] = useState("");
  const [editingSubcat, setEditingSubcat] = useState({ id: null, value: "" });
  const [newSubcat, setNewSubcat] = useState("");
  const [importError, setImportError] = useState("");

  // Fetch brands/categories on mount
  useEffect(() => {
    getAll();
  }, []);

  async function getAll() {
    const brandSnap = await getDocs(collection(db, "brands"));
    setBrands(brandSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    const catSnap = await getDocs(collection(db, "categories"));
    setCategories(catSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  }

  // --- Brand CRUD ---
  async function addBrand() {
    if (!newBrand.trim()) return;
    await addDoc(collection(db, "brands"), { name: newBrand.trim() });
    setNewBrand("");
    getAll();
  }
  async function updateBrand(id, name) {
    await updateDoc(doc(db, "brands", id), { name });
    setEditingBrandId(null);
    getAll();
  }
  async function deleteBrand(id) {
    if (!window.confirm("Delete this brand?")) return;
    await deleteDoc(doc(db, "brands", id));
    getAll();
  }

  // --- Category CRUD ---
  async function addCat() {
    if (!newCat.trim()) return;
    await addDoc(collection(db, "categories"), {
      name: newCat.trim(),
      subcategories: [],
    });
    setNewCat("");
    getAll();
  }
  async function updateCat(id, name) {
    await updateDoc(doc(db, "categories", id), { name });
    setEditingCatId(null);
    getAll();
  }
  async function deleteCat(id) {
    if (!window.confirm("Delete this category?")) return;
    await deleteDoc(doc(db, "categories", id));
    getAll();
  }

  // --- Subcategory CRUD ---
  async function addSubcat(cat) {
    if (!newSubcat.trim()) return;
    const updated = [...(cat.subcategories || []), newSubcat.trim()];
    await updateDoc(doc(db, "categories", cat.id), { subcategories: updated });
    setNewSubcat("");
    getAll();
  }
  async function updateSubcat(cat, idx, value) {
    const updated = [...cat.subcategories];
    updated[idx] = value;
    await updateDoc(doc(db, "categories", cat.id), { subcategories: updated });
    setEditingSubcat({ id: null, value: "" });
    getAll();
  }
  async function deleteSubcat(cat, idx) {
    if (!window.confirm("Delete this subcategory?")) return;
    const updated = [...cat.subcategories];
    updated.splice(idx, 1);
    await updateDoc(doc(db, "categories", cat.id), { subcategories: updated });
    getAll();
  }

  // --- Import/export ---
  function exportCSV(type) {
    let csv = "";
    if (type === "brand") {
      csv = ["brand,name", ...brands.map((b) => `brand,${b.name}`)].join("\n");
    } else if (type === "category") {
      csv = [
        "category,name,subcategories",
        ...categories.map(
          (c) =>
            `category,${c.name},${(c.subcategories || []).join("|")}`
        ),
      ].join("\n");
    }
    downloadFile(`${type}s_export.csv`, csv);
  }

  async function importCSV(e, type) {
    const file = e.target.files[0];
    if (!file) return;
    setImportError("");
    try {
      const text = await file.text();
      const items = parseCSV(text);
      // Bulk import: overwrite everything (careful!)
      if (type === "brand") {
        // Delete all first for demo (optional)
        for (let b of brands) await deleteDoc(doc(db, "brands", b.id));
        for (let i of items) await addDoc(collection(db, "brands"), i);
      } else if (type === "category") {
        for (let c of categories) await deleteDoc(doc(db, "categories", c.id));
        for (let i of items)
          await addDoc(collection(db, "categories"), {
            name: i.name,
            subcategories: i.subcategories || [],
          });
      }
      getAll();
    } catch (err) {
      setImportError("Import failed: " + err.message);
    }
  }

  function exportJSON(type) {
    let data;
    if (type === "brand") data = JSON.stringify(brands, null, 2);
    else if (type === "category")
      data = JSON.stringify(categories, null, 2);
    downloadFile(`${type}s_export.json`, data, "application/json");
  }

  async function importJSON(e, type) {
    const file = e.target.files[0];
    if (!file) return;
    setImportError("");
    try {
      const text = await file.text();
      const items = JSON.parse(text);
      if (type === "brand") {
        for (let b of brands) await deleteDoc(doc(db, "brands", b.id));
        for (let i of items) await addDoc(collection(db, "brands"), i);
      } else if (type === "category") {
        for (let c of categories) await deleteDoc(doc(db, "categories", c.id));
        for (let i of items)
          await addDoc(collection(db, "categories"), {
            name: i.name,
            subcategories: i.subcategories || [],
          });
      }
      getAll();
    } catch (err) {
      setImportError("Import failed: " + err.message);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Brand & Category Manager</h1>
      {importError && (
        <div className="bg-red-100 text-red-800 rounded px-3 py-2 mb-3">
          {importError}
        </div>
      )}

      {/* Brands */}
      <div className="mb-6">
        <h2 className="font-bold text-lg mb-2">Brands</h2>
        <div className="flex flex-wrap gap-2 mb-2">
          <input
            className="p-2 border rounded"
            value={newBrand}
            onChange={(e) => setNewBrand(e.target.value)}
            placeholder="Add brand"
          />
          <button className="bg-blue-500 text-white px-3 rounded" onClick={addBrand} type="button">
            Add
          </button>
          <button className="bg-green-500 text-white px-3 rounded" onClick={() => exportCSV("brand")} type="button">
            Export CSV
          </button>
          <button className="bg-green-500 text-white px-3 rounded" onClick={() => exportJSON("brand")} type="button">
            Export JSON
          </button>
          <input type="file" accept=".csv" onChange={e => importCSV(e, "brand")} className="border p-1" />
          <input type="file" accept=".json" onChange={e => importJSON(e, "brand")} className="border p-1" />
        </div>
        <table className="min-w-full border rounded mb-2">
          <thead>
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {brands.map((b) => (
              <tr key={b.id}>
                <td className="p-2">
                  {editingBrandId === b.id ? (
                    <input
                      value={editingBrandName}
                      onChange={(e) => setEditingBrandName(e.target.value)}
                      className="p-1 border"
                      autoFocus
                    />
                  ) : (
                    b.name
                  )}
                </td>
                <td className="p-2">
                  {editingBrandId === b.id ? (
                    <>
                      <button
                        onClick={() => updateBrand(b.id, editingBrandName)}
                        className="px-2 text-green-700"
                        type="button"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingBrandId(null)}
                        className="px-2 text-gray-600"
                        type="button"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingBrandId(b.id);
                          setEditingBrandName(b.name);
                        }}
                        className="px-2 text-blue-600"
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteBrand(b.id)}
                        className="px-2 text-red-600"
                        type="button"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!brands.length && (
              <tr>
                <td colSpan={2} className="p-2 text-gray-400">
                  No brands yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h2 className="font-bold text-lg mb-2">Categories</h2>
        <div className="flex flex-wrap gap-2 mb-2">
          <input
            className="p-2 border rounded"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="Add category"
          />
          <button className="bg-blue-500 text-white px-3 rounded" onClick={addCat} type="button">
            Add
          </button>
          <button className="bg-green-500 text-white px-3 rounded" onClick={() => exportCSV("category")} type="button">
            Export CSV
          </button>
          <button className="bg-green-500 text-white px-3 rounded" onClick={() => exportJSON("category")} type="button">
            Export JSON
          </button>
          <input type="file" accept=".csv" onChange={e => importCSV(e, "category")} className="border p-1" />
          <input type="file" accept=".json" onChange={e => importJSON(e, "category")} className="border p-1" />
        </div>
        <table className="min-w-full border rounded mb-2">
          <thead>
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Subcategories</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td className="p-2">
                  {editingCatId === c.id ? (
                    <input
                      value={editingCatName}
                      onChange={(e) => setEditingCatName(e.target.value)}
                      className="p-1 border"
                      autoFocus
                    />
                  ) : (
                    c.name
                  )}
                </td>
                <td className="p-2">
                  <div className="flex flex-wrap gap-1 items-center">
                    {(c.subcategories || []).map((sub, idx) =>
                      editingSubcat.id === c.id && editingSubcat.value.idx === idx ? (
                        <input
                          key={idx}
                          value={editingSubcat.value.value}
                          onChange={(e) =>
                            setEditingSubcat({
                              id: c.id,
                              value: { idx, value: e.target.value },
                            })
                          }
                          className="p-1 border"
                        />
                      ) : (
                        <span key={idx} className="bg-gray-100 rounded px-2">
                          {sub}{" "}
                          <button
                            onClick={() =>
                              setEditingSubcat({
                                id: c.id,
                                value: { idx, value: sub },
                              })
                            }
                            className="text-blue-500 text-xs ml-1"
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteSubcat(c, idx)}
                            className="text-red-500 text-xs ml-1"
                            type="button"
                          >
                            ×
                          </button>
                        </span>
                      )
                    )}
                    <input
                      className="p-1 border w-28"
                      value={newSubcat}
                      onChange={(e) => setNewSubcat(e.target.value)}
                      placeholder="Add subcat"
                    />
                    <button
                      className="bg-yellow-400 px-2 rounded"
                      onClick={() => addSubcat(c)}
                      type="button"
                    >
                      Add
                    </button>
                  </div>
                  {/* Save/cancel for subcat editing */}
                  {editingSubcat.id === c.id && (
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() =>
                          updateSubcat(
                            c,
                            editingSubcat.value.idx,
                            editingSubcat.value.value
                          )
                        }
                        className="text-green-700"
                        type="button"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingSubcat({ id: null, value: "" })}
                        className="text-gray-500"
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </td>
                <td className="p-2">
                  {editingCatId === c.id ? (
                    <>
                      <button
                        onClick={() => updateCat(c.id, editingCatName)}
                        className="px-2 text-green-700"
                        type="button"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingCatId(null)}
                        className="px-2 text-gray-600"
                        type="button"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingCatId(c.id);
                          setEditingCatName(c.name);
                        }}
                        className="px-2 text-blue-600"
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCat(c.id)}
                        className="px-2 text-red-600"
                        type="button"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!categories.length && (
              <tr>
                <td colSpan={3} className="p-2 text-gray-400">
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
