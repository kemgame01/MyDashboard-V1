// src/features/customers/CustomerFilters.jsx
import React from 'react';
import { X } from 'lucide-react';
import '../../styles/CustomerSection.css';

export default function CustomerFilters({
  filters,
  setFilters,
  onApply,
  onReset,
  availableTags
}) {
  const handleChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 animate-slideDown">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Filter Customers</h3>
        <button
          onClick={onReset}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Reset all
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tag Filter */}
        <div className="customer-form-group">
          <label className="customer-form-label">Tag</label>
          <select
            value={filters.tag}
            onChange={(e) => handleChange('tag', e.target.value)}
            className="customer-form-input"
          >
            <option value="all">All Tags</option>
            {availableTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

        {/* Has Phone Filter */}
        <div className="customer-form-group">
          <label className="customer-form-label">Has Phone</label>
          <select
            value={filters.hasPhone}
            onChange={(e) => handleChange('hasPhone', e.target.value)}
            className="customer-form-input"
          >
            <option value="all">All</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        {/* Has Address Filter */}
        <div className="customer-form-group">
          <label className="customer-form-label">Has Address</label>
          <select
            value={filters.hasAddress}
            onChange={(e) => handleChange('hasAddress', e.target.value)}
            className="customer-form-input"
          >
            <option value="all">All</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        {/* Date From */}
        <div className="customer-form-group">
          <label className="customer-form-label">Date From</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleChange('dateFrom', e.target.value)}
            className="customer-form-input"
          />
        </div>

        {/* Date To */}
        <div className="customer-form-group">
          <label className="customer-form-label">Date To</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleChange('dateTo', e.target.value)}
            className="customer-form-input"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={onReset}
          className="customer-btn customer-btn-secondary"
        >
          Clear Filters
        </button>
        <button
          onClick={onApply}
          className="customer-btn customer-btn-primary"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}