// src/components/ShopManager.jsx
import React, { useState } from 'react';
import { useShopManager } from '../hooks/useShopManager';
import { Edit, Trash2, Save, X, PlusCircle } from 'lucide-react';
import Spinner from './Spinner'; // Assuming you have a Spinner component

const ShopManager = () => {
  const { shops, loading, error, addShop, updateShop, deleteShop } = useShopManager();
  const [newShopName, setNewShopName] = useState("");
  const [editingShop, setEditingShop] = useState({ id: null, name: "" });

  const handleAdd = () => {
    addShop(newShopName);
    setNewShopName("");
  };

  const handleUpdate = () => {
    updateShop(editingShop.id, editingShop.name);
    setEditingShop({ id: null, name: "" });
  };

  if (loading) {
    return <Spinner text="Loading Shops..." />;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-4">
        Shop Management
      </h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
          {error}
        </div>
      )}

      {/* Add Shop Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-700">Add New Shop</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newShopName}
            onChange={(e) => setNewShopName(e.target.value)}
            placeholder="Enter new shop name..."
            className="flex-grow p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center gap-2"
          >
            <PlusCircle size={18} />
            Add Shop
          </button>
        </div>
      </div>

      {/* Shops Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left font-semibold text-gray-600">Shop Name</th>
              <th className="p-3 text-right font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shops.map((shop) => (
              <tr key={shop.id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  {editingShop.id === shop.id ? (
                    <input
                      type="text"
                      value={editingShop.name}
                      onChange={(e) => setEditingShop({ ...editingShop, name: e.target.value })}
                      className="p-1 border rounded-md w-full"
                      autoFocus
                    />
                  ) : (
                    shop.shopName
                  )}
                </td>
                <td className="p-3 text-right">
                  {editingShop.id === shop.id ? (
                    <div className="flex gap-2 justify-end">
                      <button onClick={handleUpdate} className="text-green-600 hover:text-green-700"><Save size={18} /></button>
                      <button onClick={() => setEditingShop({ id: null, name: "" })} className="text-gray-500 hover:text-gray-700"><X size={18} /></button>
                    </div>
                  ) : (
                    <div className="flex gap-4 justify-end">
                      <button onClick={() => setEditingShop({ id: shop.id, name: shop.shopName })} className="text-blue-600 hover:text-blue-700"><Edit size={18} /></button>
                      <button onClick={() => deleteShop(shop.id)} className="text-red-600 hover:text-red-700"><Trash2 size={18} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shops.length === 0 && (
          <p className="p-4 text-center text-gray-400">No shops found. Add one to get started!</p>
        )}
      </div>
    </div>
  );
};

export default ShopManager;