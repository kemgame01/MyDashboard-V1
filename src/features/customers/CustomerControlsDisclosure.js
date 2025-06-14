// src/features/customers/CustomerDisclosureRow.jsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react';
import CustomerEditModal from './CustomerEditModal';

const CustomerDisclosureRow = ({
  customer,
  trackingCompanies,
  onSave,
  onDelete,
  onInitiateTagChange,
  isSelected,
  onSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleSaveEdit = (updatedCustomer) => {
    onSave({
      ...updatedCustomer,
      id: customer.id,
      ownerId: customer.ownerId
    });
    setShowEditModal(false);
  };

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors border-b border-gray-200">
        {/* Checkbox */}
        <td className="px-6 py-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(customer.id)}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
        </td>

        {/* Customer Data */}
        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
          {customer.firstName}
        </td>
        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
          {customer.lastName}
        </td>
        <td className="px-6 py-4 text-gray-600">
          {customer.email}
        </td>
        <td className="px-6 py-4 text-gray-600">
          {customer.address || '-'}
        </td>
        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
          {customer.phoneNumber || '-'}
        </td>
        <td className="px-6 py-4 text-gray-600">
          {customer.trackingCode || '-'}
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-wrap gap-1">
            {customer.tags?.map((tag, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${tag === 'New' ? 'bg-blue-100 text-blue-800' :
                    tag === 'VIP' ? 'bg-purple-100 text-purple-800' :
                    tag === 'Active' ? 'bg-green-100 text-green-800' :
                    tag === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-gray-100 text-gray-800'
                  }`}
              >
                {tag}
              </span>
            )) || '-'}
          </div>
        </td>
        <td className="px-6 py-4 text-right">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Toggle details"
          >
            {isOpen ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        </td>
      </tr>

      {/* Expanded Details Row */}
      {isOpen && (
        <tr className="bg-gray-50 border-b border-gray-200">
          <td colSpan="9" className="px-6 py-4">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">
                Customer Details: {customer.firstName} {customer.lastName}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <label className="text-xs text-gray-500 uppercase tracking-wider">First Name</label>
                  <p className="mt-1 text-gray-900">{customer.firstName}</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Last Name</label>
                  <p className="mt-1 text-gray-900">{customer.lastName}</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Email</label>
                  <p className="mt-1 text-gray-900">{customer.email}</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Address</label>
                  <p className="mt-1 text-gray-900">{customer.address || '-'}</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Phone</label>
                  <p className="mt-1 text-gray-900">{customer.phoneNumber || '-'}</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Tracking Code</label>
                  <p className="mt-1 text-gray-900">{customer.trackingCode || '-'}</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-3">
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Tracking Company</label>
                  <select
                    value={customer.trackingCompany || ''}
                    disabled
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-900"
                  >
                    <option value="">Select Company</option>
                    {trackingCompanies?.map(company => (
                      <option key={company.id} value={company.name}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleEditClick}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  Edit Details
                </button>
                
                <button
                  onClick={() => onDelete(customer.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* Edit Modal */}
      <CustomerEditModal
        show={showEditModal}
        customer={customer}
        trackingCompanies={trackingCompanies}
        onSave={handleSaveEdit}
        onClose={() => setShowEditModal(false)}
      />
    </>
  );
};

export default CustomerDisclosureRow;