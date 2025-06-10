import React, { useState, useEffect } from 'react';
import { Disclosure } from '@headlessui/react';
import { ChevronDown, Edit, Trash2, Check, X } from 'lucide-react';

export default function CustomerDisclosureRow({ customer, trackingCompanies, onSave, onDelete, onInitiateTagChange, isSelected, onSelect }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(customer);
  const [formError, setFormError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setIsEditing(false);
    setEditForm(customer);
    setShowDeleteConfirm(false);
    setFormError('');
  }, [customer]);

  const handleFormChange = (e) => setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleCancelEdit = () => { setEditForm(customer); setIsEditing(false); setFormError(''); };
  const handleSaveChanges = (e) => {
    e.preventDefault();
    if (!editForm.firstName || !editForm.email) {
      setFormError('First Name and Email are required.');
      return;
    }
    onSave(editForm);
    setIsEditing(false);
  };
  const handleDelete = (closePanel) => { onDelete(customer.id); closePanel(); };
  const tagColor = (tag) => {
    switch (tag) {
      case "VIP": return "bg-green-100 text-green-800 ring-green-200";
      case "Blocked": return "bg-red-100 text-red-800 ring-red-200";
      case "New": return "bg-blue-100 text-blue-800 ring-blue-200";
      default: return "bg-gray-100 text-gray-800 ring-gray-200";
    }
  };

  return (
    <Disclosure as={React.Fragment} key={customer.id}>
      {({ open, close }) => (
        <>
          <tr className={`border-b transition-colors ${open ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
            <td className="p-4 text-center"><input type="checkbox" checked={isSelected} onChange={() => onSelect(customer.id)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/></td>
            <td className="p-4 font-medium text-gray-900">{customer.firstName}</td>
            <td className="p-4 text-gray-700">{customer.lastName}</td>
            <td className="p-4 text-gray-700">{customer.email}</td>
            <td className="p-4 text-gray-700 truncate max-w-xs">{customer.address}</td>
            <td className="p-4 text-gray-700">{customer.phoneNumber}</td>
            <td className="p-4 text-gray-700">{customer.trackingCode}</td>
            <td className="p-4 text-center">
              <select
                value={customer.tags?.[0] || ""}
                onChange={(e) => onInitiateTagChange(customer.id, e.target.value, customer.tags?.[0])}
                className={`text-xs font-semibold border-none rounded-md py-1.5 px-3 text-center appearance-none focus:ring-2 focus:ring-offset-2 ${tagColor(customer.tags?.[0])}`}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="New">New</option>
                <option value="VIP">VIP</option>
                <option value="Blocked">Blocked</option>
              </select>
            </td>
            <td className="p-4 text-center">
              <Disclosure.Button className="p-2 rounded-full hover:bg-gray-200">
                <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`} />
              </Disclosure.Button>
            </td>
          </tr>
          <Disclosure.Panel as="tr">
            <td colSpan="9" className="p-0">
              <div className="bg-gray-50 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Details: {customer.firstName}</h3>
                {formError && <p className="text-red-600 mb-4">{formError}</p>}
                
                <form onSubmit={handleSaveChanges}>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="text" name="firstName" value={editForm.firstName || ''} onChange={handleFormChange} placeholder="First Name" className="border px-3 py-2 rounded w-full disabled:bg-gray-200 disabled:text-gray-500" disabled={!isEditing} />
                    <input type="text" name="lastName" value={editForm.lastName || ''} onChange={handleFormChange} placeholder="Last Name" className="border px-3 py-2 rounded w-full disabled:bg-gray-200 disabled:text-gray-500" disabled={!isEditing} />
                    <input type="email" name="email" value={editForm.email || ''} onChange={handleFormChange} placeholder="Email" className="border px-3 py-2 rounded w-full disabled:bg-gray-200 disabled:text-gray-500" disabled={!isEditing} />
                    <input type="text" name="address" value={editForm.address || ''} onChange={handleFormChange} placeholder="Address" className="border px-3 py-2 rounded w-full col-span-1 md:col-span-2 disabled:bg-gray-200 disabled:text-gray-500" disabled={!isEditing} />
                    <input type="text" name="phoneNumber" value={editForm.phoneNumber || ''} onChange={handleFormChange} placeholder="Phone Number" className="border px-3 py-2 rounded w-full disabled:bg-gray-200 disabled:text-gray-500" disabled={!isEditing} />
                    <input type="text" name="trackingCode" value={editForm.trackingCode || ''} onChange={handleFormChange} placeholder="Tracking Code" className="border px-3 py-2 rounded w-full disabled:bg-gray-200 disabled:text-gray-500" disabled={!isEditing} />
                    <select name="trackingCompany" value={editForm.trackingCompany || ''} onChange={handleFormChange} className="border px-3 py-2 rounded w-full disabled:bg-gray-200 disabled:text-gray-500" disabled={!isEditing}>
                      <option value="" disabled>Select Company</option>
                      {(trackingCompanies || []).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="mt-6 flex justify-between items-center">
                    {!isEditing ? (
                        <button type="button" onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                          <Edit className="w-5 h-5" /> Edit Details
                        </button>
                    ) : (
                      <div className="flex gap-4">
                        <button type="submit" className="flex items-center gap-2 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition">
                          <Check className="w-5 h-5" /> Save Changes
                        </button>
                        <button type="button" onClick={handleCancelEdit} className="flex items-center gap-2 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition">
                          <X className="w-5 h-5" /> Cancel
                        </button>
                      </div>
                    )}
                    <div className="flex gap-4 items-center">
                      {!showDeleteConfirm ? (
                        <button type="button" onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition">
                          <Trash2 className="w-5 h-5" /> Delete
                        </button>
                      ) : (
                        <>
                          <span className="text-red-700 font-medium">Are you sure?</span>
                          <button type="button" onClick={() => handleDelete(close)} className="bg-red-700 text-white py-2 px-4 rounded-lg hover:bg-red-800 transition">Yes, Delete</button>
                          <button type="button" onClick={() => setShowDeleteConfirm(false)} className="text-gray-600 hover:underline">No</button>
                        </>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </td>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}