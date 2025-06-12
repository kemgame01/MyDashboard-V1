// src/components/BrandManager.jsx
import React from 'react';
import { Edit, Trash2, Save, X } from 'lucide-react';

const BrandManager = ({
  brands,
  editingBrandId,
  editingBrandName,
  newBrand,
  setEditingBrandId,
  setEditingBrandName,
  setNewBrand,
  addBrandHandler,
  updateBrandHandler,
  deleteBrandHandler,
  exportData,
  importData
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-700">Brands</h2>
      
      {/* Action Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex gap-2">
          <input
            className="flex-grow p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            value={newBrand}
            onChange={(e) => setNewBrand(e.target.value)}
            placeholder="New brand name"
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition" onClick={addBrandHandler}>
            Add
          </button>
        </div>
        <div className="flex gap-2 items-center justify-end flex-wrap">
          <button className="text-sm bg-gray-200 px-3 py-1 rounded-md hover:bg-gray-300" onClick={() => exportData("brand", "csv")}>Export CSV</button>
          <button className="text-sm bg-gray-200 px-3 py-1 rounded-md hover:bg-gray-300" onClick={() => exportData("brand", "json")}>Export JSON</button>
          <input type="file" id="import-brand" className="hidden" accept=".csv,.json" onChange={e => importData(e, "brand", e.target.accept.includes('csv') ? 'csv' : 'json')} />
          <label htmlFor="import-brand" className="text-sm bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 cursor-pointer">Import File</label>
        </div>
      </div>

      {/* Brands Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-t">
          <tbody>
            {brands.map((b) => (
              <tr key={b.id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  {editingBrandId === b.id ? (
                    <input
                      value={editingBrandName}
                      onChange={(e) => setEditingBrandName(e.target.value)}
                      className="p-1 border rounded-md w-full"
                      autoFocus
                    />
                  ) : (
                    b.name
                  )}
                </td>
                <td className="p-3 w-40 text-right">
                  {editingBrandId === b.id ? (
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => updateBrandHandler(b.id, editingBrandName)} className="text-green-600 hover:text-green-700"><Save size={18} /></button>
                      <button onClick={() => setEditingBrandId(null)} className="text-gray-500 hover:text-gray-700"><X size={18} /></button>
                    </div>
                  ) : (
                    <div className="flex gap-4 justify-end">
                      <button onClick={() => { setEditingBrandId(b.id); setEditingBrandName(b.name); }} className="text-blue-600 hover:text-blue-700"><Edit size={18} /></button>
                      <button onClick={() => deleteBrandHandler(b.id)} className="text-red-600 hover:text-red-700"><Trash2 size={18} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!brands.length && (
              <tr><td colSpan={2} className="p-4 text-center text-gray-400">No brands found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BrandManager;