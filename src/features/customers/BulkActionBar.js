// src/features/customers/BulkActionBar.jsx
import React from 'react';
import { Trash2, Download, Tag } from 'lucide-react';
import '../../styles/CustomerSection.css'; // Import CSS from styles folder

export default function BulkActionBar({
  selectedCount,
  onBulkDelete,
  onBulkExport,
  onBulkTag
}) {
  return (
    <div className="bulk-action-bar">
      <div className="bulk-action-info">
        {selectedCount} customer{selectedCount > 1 ? 's' : ''} selected
      </div>
      
      <div className="bulk-action-buttons">
        <button
          onClick={onBulkExport}
          className="customer-btn customer-btn-secondary"
          title="Export selected customers"
        >
          <Download size={16} />
          Export
        </button>

        <div className="relative inline-block">
          <select
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'remove') {
                // Pass empty string to remove tags
                onBulkTag('');
                e.target.value = '';
              } else if (value) {
                onBulkTag(value);
                e.target.value = '';
              }
            }}
            className="customer-btn customer-btn-secondary"
            style={{ paddingRight: '2rem' }}
          >
            <option value="">
              Tag as...
            </option>
            <option value="New">New</option>
            <option value="VIP">VIP</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Blocked">Blocked</option>
            <option disabled>──────</option>
            <option value="remove">Remove Tags</option>
          </select>
          <Tag 
            size={16} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-600" 
          />
        </div>

        <button
          onClick={onBulkDelete}
          className="customer-btn"
          style={{
            backgroundColor: '#dc2626',
            color: 'white'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
          title="Delete selected customers"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </div>
  );
}