// src/features/customers/CustomerRow.jsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react';
import CustomerEditModal from './CustomerEditModal';

import '../../styles/CustomerSection.css'; // Import CSS from styles folder

const CustomerRow = ({
  customer,
  trackingCompanies,
  onSave,
  onDelete,
  onInitiateTagChange,
  isSelected,
  onSelect
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
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

  const getTagClass = (tag) => {
    switch (tag) {
      case 'New': return 'customer-tag customer-tag-new';
      case 'VIP': return 'customer-tag customer-tag-vip';
      case 'Blocked': return 'customer-tag customer-tag-blocked';
      case 'Active': return 'customer-tag customer-tag-active';
      case 'Inactive': return 'customer-tag customer-tag-inactive';
      default: return 'customer-tag';
    }
  };

  return (
    <>
      <tr className={isExpanded ? 'bg-blue-50' : ''}>
        {/* Checkbox */}
        <td className="text-center">
          <input
            type="checkbox"
            className="customer-checkbox"
            checked={isSelected}
            onChange={() => onSelect(customer.id)}
            aria-label={`Select ${customer.firstName} ${customer.lastName}`}
          />
        </td>

        {/* Customer Data */}
        <td className="font-medium">{customer.firstName}</td>
        <td>{customer.lastName}</td>
        <td>{customer.email}</td>
        <td className="customer-text-truncate" style={{ maxWidth: '200px' }}>
          {customer.address || '-'}
        </td>
        <td>{customer.phoneNumber || '-'}</td>
        <td>{customer.trackingCode || '-'}</td>
        
        {/* Tags */}
        <td>
          <select
            value={customer.tags?.[0] || ''}
            onChange={(e) => {
              const newTag = e.target.value;
              const oldTag = customer.tags?.[0] || '';
              if (newTag !== oldTag) {
                // If empty string selected, remove tag
                if (newTag === '') {
                  onInitiateTagChange(customer.id, '', oldTag);
                } else {
                  onInitiateTagChange(customer.id, newTag, oldTag);
                }
              }
            }}
            className={`customer-tag-select ${getTagClass(customer.tags?.[0])}`}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="">No Tag</option>
            <option value="New">New</option>
            <option value="VIP">VIP</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Blocked">Blocked</option>
          </select>
        </td>

        {/* Actions */}
        <td className="text-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="customer-disclosure-button"
            aria-label={isExpanded ? "Collapse details" : "Expand details"}
          >
            {isExpanded ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </button>
        </td>
      </tr>

      {/* Expanded Details Row */}
      {isExpanded && (
        <tr>
          <td colSpan="9" className="customer-disclosure-panel">
            <div>
              <h4 className="text-lg font-semibold mb-4">
                Customer Details: {customer.firstName} {customer.lastName}
              </h4>

              <div className="customer-detail-grid">
                <div className="customer-detail-card">
                  <div className="customer-detail-label">First Name</div>
                  <div className="customer-detail-value">{customer.firstName}</div>
                </div>

                <div className="customer-detail-card">
                  <div className="customer-detail-label">Last Name</div>
                  <div className="customer-detail-value">{customer.lastName}</div>
                </div>

                <div className="customer-detail-card">
                  <div className="customer-detail-label">Email</div>
                  <div className="customer-detail-value">{customer.email}</div>
                </div>

                <div className="customer-detail-card">
                  <div className="customer-detail-label">Address</div>
                  <div className="customer-detail-value">{customer.address || 'Not provided'}</div>
                </div>

                <div className="customer-detail-card">
                  <div className="customer-detail-label">Phone</div>
                  <div className="customer-detail-value">{customer.phoneNumber || 'Not provided'}</div>
                </div>

                <div className="customer-detail-card">
                  <div className="customer-detail-label">Tracking Code</div>
                  <div className="customer-detail-value">{customer.trackingCode || 'Not provided'}</div>
                </div>

                {customer.trackingCompany && (
                  <div className="customer-detail-card">
                    <div className="customer-detail-label">Tracking Company</div>
                    <div className="customer-detail-value">{customer.trackingCompany}</div>
                  </div>
                )}

                {customer.createdAt && (
                  <div className="customer-detail-card">
                    <div className="customer-detail-label">Created Date</div>
                    <div className="customer-detail-value">
                      {(() => {
                        const date = customer.createdAt.toDate ? customer.createdAt.toDate() :
                                    customer.createdAt.seconds ? new Date(customer.createdAt.seconds * 1000) :
                                    new Date(customer.createdAt);
                        return date.toLocaleDateString();
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleEditClick}
                  className="customer-btn customer-btn-primary"
                >
                  <Edit size={16} />
                  Edit Details
                </button>

                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this customer?')) {
                      onDelete(customer.id);
                    }
                  }}
                  className="customer-btn"
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
                >
                  <Trash2 size={16} />
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

export default CustomerRow;