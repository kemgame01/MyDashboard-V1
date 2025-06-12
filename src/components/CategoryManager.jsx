// src/components/CategoryManager.jsx
import React from 'react';
import { Edit, Trash2, Save, X, Plus } from 'lucide-react';

const CategoryManager = ({
  categories,
  editingCatId, editingCatName, newCat, editingSubcat, newSubcat,
  setEditingCatId, setEditingCatName, setNewCat, setEditingSubcat, setNewSubcat,
  addCatHandler, updateCatHandler, deleteCatHandler,
  addSubcatHandler, updateSubcatHandler, deleteSubcatHandler,
  exportData, importData
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8">
      <h2 className="text-xl font-bold mb-4 text-gray-700">Categories</h2>
      
      {/* Action Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex gap-2">
          <input
            className="flex-grow p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="New category name"
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition" onClick={addCatHandler}>
            Add
          </button>
        </div>
        <div className="flex gap-2 items-center justify-end flex-wrap">
          <button className="text-sm bg-gray-200 px-3 py-1 rounded-md hover:bg-gray-300" onClick={() => exportData("category", "csv")}>Export CSV</button>
          <button className="text-sm bg-gray-200 px-3 py-1 rounded-md hover:bg-gray-300" onClick={() => exportData("category", "json")}>Export JSON</button>
          <input type="file" id="import-cat" className="hidden" accept=".csv,.json" onChange={e => importData(e, "category", e.target.accept.includes('csv') ? 'csv' : 'json')} />
          <label htmlFor="import-cat" className="text-sm bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 cursor-pointer">Import File</label>
        </div>
      </div>

      {/* Categories Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-t">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-3 text-left font-semibold text-gray-600">Category Name</th>
              <th className="p-3 text-left font-semibold text-gray-600">Subcategories</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b">
                <td className="p-3 align-top">
                  {editingCatId === c.id ? (
                    <input value={editingCatName} onChange={(e) => setEditingCatName(e.target.value)} className="p-1 border rounded-md" autoFocus />
                  ) : ( c.name )}
                </td>
                <td className="p-3 align-top">
                  <div className="flex flex-col gap-2">
                    {(c.subcategories || []).map((sub, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {editingSubcat.id === c.id && editingSubcat.idx === idx ? (
                          <>
                            <input value={editingSubcat.value} onChange={(e) => setEditingSubcat({...editingSubcat, value: e.target.value})} className="p-1 border rounded-md text-sm"/>
                            <button onClick={() => updateSubcatHandler(c, idx, editingSubcat.value)} className="text-green-600"><Save size={16}/></button>
                            <button onClick={() => setEditingSubcat({id: null, idx: -1, value: ''})} className="text-gray-500"><X size={16}/></button>
                          </>
                        ) : (
                          <span className="bg-gray-100 rounded-full px-3 py-1 text-sm flex items-center gap-2">
                            {sub}
                            <button onClick={() => setEditingSubcat({id: c.id, idx, value: sub})} className="text-blue-500"><Edit size={14}/></button>
                            <button onClick={() => deleteSubcatHandler(c, idx)} className="text-red-500"><Trash2 size={14}/></button>
                          </span>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                        <input className="p-1 border rounded-md text-sm w-36" value={newSubcat.catId === c.id ? newSubcat.value : ""} onChange={(e) => setNewSubcat({catId: c.id, value: e.target.value})} placeholder="New subcategory" />
                        <button className="bg-blue-500 text-white p-1 rounded-md hover:bg-blue-600" onClick={() => addSubcatHandler(c.id)}><Plus size={16}/></button>
                    </div>
                  </div>
                </td>
                <td className="p-3 align-top text-right w-40">
                  {editingCatId === c.id ? (
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => updateCatHandler(c.id, editingCatName)} className="text-green-600"><Save size={18}/></button>
                      <button onClick={() => setEditingCatId(null)} className="text-gray-500"><X size={18}/></button>
                    </div>
                  ) : (
                    <div className="flex gap-4 justify-end">
                      <button onClick={() => { setEditingCatId(c.id); setEditingCatName(c.name); }} className="text-blue-600"><Edit size={18}/></button>
                      <button onClick={() => deleteCatHandler(c.id)} className="text-red-600"><Trash2 size={18}/></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!categories.length && (
              <tr><td colSpan={3} className="p-4 text-center text-gray-400">No categories found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryManager;