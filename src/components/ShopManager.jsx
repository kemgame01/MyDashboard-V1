// src/components/ShopManager.jsx
import React, { useState, useEffect } from 'react';
import { useShopManager } from '../hooks/useShopManager';
import { Edit, Trash2, Save, X, PlusCircle } from 'lucide-react';
import Spinner from './Spinner'; 
import Modal from './Modal'; // Assuming a Modal component exists

// Define initial state for the form
const INITIAL_FORM_STATE = {
  shopName: "",
  address: "",
  phone: "",
  email: "",
  status: "active",
  currency: "THB",
  timezone: "Asia/Bangkok",
  openTime: "09:00",
  closeTime: "18:00"
};

const ShopManager = () => {
  const { shops, loading, error, addShop, updateShop, deleteShop } = useShopManager();
  
  // State for the modal form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShopId, setEditingShopId] = useState(null);
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);

  // Open the modal for adding a new shop
  const handleOpenAddModal = () => {
    setEditingShopId(null);
    setFormState(INITIAL_FORM_STATE);
    setIsModalOpen(true);
  };

  // Open the modal for editing an existing shop
  const handleOpenEditModal = (shop) => {
    setEditingShopId(shop.id);
    setFormState({
      shopName: shop.shopName || "",
      address: shop.address || "",
      phone: shop.phone || "",
      email: shop.email || "",
      status: shop.status || "active",
      currency: shop.settings?.currency || "THB",
      timezone: shop.settings?.timezone || "Asia/Bangkok",
      openTime: shop.settings?.businessHours?.open || "09:00",
      closeTime: shop.settings?.businessHours?.close || "18:00",
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const shopData = {
        ...formState,
        // Nest settings object for Firestore
        settings: {
            currency: formState.currency,
            timezone: formState.timezone,
            businessHours: {
                open: formState.openTime,
                close: formState.closeTime
            }
        }
    };

    if (editingShopId) {
      updateShop(editingShopId, shopData);
    } else {
      addShop(shopData);
    }
    setIsModalOpen(false);
  };

  if (loading) {
    return <Spinner text="Loading Shops..." />;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Shop Management
        </h1>
        <button
            onClick={handleOpenAddModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
            <PlusCircle size={18} />
            Add New Shop
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
          {error}
        </div>
      )}

      {/* Shops Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full">
            <thead className="bg-gray-100">
                <tr>
                <th className="p-3 text-left font-semibold text-gray-600">Shop Name</th>
                <th className="p-3 text-left font-semibold text-gray-600">Address</th>
                <th className="p-3 text-left font-semibold text-gray-600">Status</th>
                <th className="p-3 text-right font-semibold text-gray-600">Actions</th>
                </tr>
            </thead>
            <tbody>
                {shops.map((shop) => (
                <tr key={shop.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">{shop.shopName}</td>
                    <td className="p-3 text-gray-600">{shop.address || "-"}</td>
                    <td className="p-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            shop.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                            {shop.status}
                        </span>
                    </td>
                    <td className="p-3 text-right">
                        <div className="flex gap-4 justify-end">
                            <button onClick={() => handleOpenEditModal(shop)} className="text-blue-600 hover:text-blue-700"><Edit size={18} /></button>
                            <button onClick={() => deleteShop(shop.id)} className="text-red-600 hover:text-red-700"><Trash2 size={18} /></button>
                        </div>
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

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSubmit}>
            <h2 className="text-xl font-bold mb-4">{editingShopId ? "Edit Shop" : "Add New Shop"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Info */}
                <input name="shopName" value={formState.shopName} onChange={handleFormChange} placeholder="Shop Name" className="p-2 border rounded-md" required />
                <input name="address" value={formState.address} onChange={handleFormChange} placeholder="Address" className="p-2 border rounded-md" />
                <input name="phone" value={formState.phone} onChange={handleFormChange} placeholder="Phone" className="p-2 border rounded-md" />
                <input name="email" value={formState.email} onChange={handleFormChange} placeholder="Email" type="email" className="p-2 border rounded-md" />
                <select name="status" value={formState.status} onChange={handleFormChange} className="p-2 border rounded-md">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>

                {/* Settings */}
                <h3 className="text-lg font-semibold mt-4 col-span-2">Settings</h3>
                <input name="currency" value={formState.currency} onChange={handleFormChange} placeholder="Currency (e.g., THB)" className="p-2 border rounded-md" />
                <input name="timezone" value={formState.timezone} onChange={handleFormChange} placeholder="Timezone (e.g., Asia/Bangkok)" className="p-2 border rounded-md" />
                <input name="openTime" value={formState.openTime} onChange={handleFormChange} type="time" className="p-2 border rounded-md" />
                <input name="closeTime" value={formState.closeTime} onChange={handleFormChange} type="time" className="p-2 border rounded-md" />
            </div>
            <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 px-4 py-2 rounded-md">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md">Save</button>
            </div>
        </form>
      </Modal>
    </div>
  );
};

export default ShopManager;