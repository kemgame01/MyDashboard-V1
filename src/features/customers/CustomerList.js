// src/features/customers/CustomerList.js
import React, { useState } from "react";
import BulkActionBar from "./BulkActionBar";
import Pagination from "./Pagination";
import CustomerRow from "./CustomerRow";
import QuickAddRow from "./QuickAddRow";
import CustomerFilters from "./CustomerFilters";
import { Filter, Search, Plus } from 'lucide-react';
import '../../styles/CustomerSection.css'; // Import CSS

const itemsPerPage = 20;

export default function CustomerList({
  customers,
  trackingCompanies,
  handleSaveClick,
  handleDeleteClick,
  handleAddQuick,
  handleBulkDelete,
  handleBulkExport,
  handleBulkTag,
  handleInitiateTagChange,
  searchTerm,
  setSearchTerm,
  searching = false,
  showFilters,
  setShowFilters,
  filters,
  setFilters,
  handleApplyFilters,
  handleResetFilters,
  availableTags,
  isAdmin
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const totalPages = Math.ceil(customers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = customers.slice(indexOfFirstItem, indexOfLastItem);

  const allVisibleSelected = currentCustomers.length > 0 && 
    currentCustomers.every((c) => selectedIds.includes(c.id));

  const handleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(prev => 
        prev.filter(id => !currentCustomers.some(c => c.id === id))
      );
    } else {
      setSelectedIds(prev => [
        ...prev,
        ...currentCustomers.map(c => c.id).filter(id => !prev.includes(id))
      ]);
    }
  };

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, customers.length]);

  return (
    <div>
      {/* Controls Section */}
      <div className="customer-controls">
        {/* Search */}
        <div className="customer-search-wrapper">
          <Search className="customer-search-icon" size={20} />
          <input
            type="text"
            className={`customer-search-input ${searching ? 'searching' : ''}`}
            placeholder={searching ? "Searching..." : "Search customers..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searching && (
            <div className="customer-search-loading">
              <div className="customer-search-spinner"></div>
            </div>
          )}
        </div>

        {/* Filter Button */}
        <button
          className="customer-btn customer-btn-filter"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          Filters
        </button>

        {/* Quick Add Button */}
        {isAdmin && (
          <button
            className="customer-btn customer-btn-primary"
            onClick={() => setShowQuickAdd(!showQuickAdd)}
          >
            <Plus size={16} />
            Quick Add Customer
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <CustomerFilters
          filters={filters}
          setFilters={setFilters}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          availableTags={availableTags}
        />
      )}

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.length}
          onBulkDelete={() => handleBulkDelete(selectedIds)}
          onBulkExport={() => handleBulkExport(selectedIds)}
          onBulkTag={(tag) => handleBulkTag(selectedIds, tag)}
        />
      )}

      {/* Customer Table */}
      <div className={`customer-table-wrapper ${searching ? 'searching' : ''}`}>
        <table className="customer-table">
          <thead>
            <tr>
              <th className="text-center">
                <input
                  type="checkbox"
                  className="customer-checkbox"
                  checked={allVisibleSelected}
                  onChange={handleSelectAll}
                  aria-label="Select all customers"
                />
              </th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Email</th>
              <th>Address</th>
              <th>Phone</th>
              <th>Tracking Code</th>
              <th>Tags</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {showQuickAdd && (
              <QuickAddRow 
                onAdd={handleAddQuick} 
                onClose={() => setShowQuickAdd(false)}
              />
            )}
            
            {currentCustomers.length > 0 ? (
              currentCustomers.map((customer) => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  trackingCompanies={trackingCompanies}
                  onSave={handleSaveClick}
                  onDelete={handleDeleteClick}
                  onInitiateTagChange={(id, newTag, oldTag) => handleInitiateTagChange(id, newTag, oldTag)}
                  isSelected={selectedIds.includes(customer.id)}
                  onSelect={handleSelectRow}
                />
              ))
            ) : (
              <tr>
                <td colSpan="9" className="customer-empty">
                  <div className="customer-empty-icon">📋</div>
                  <p>No customers found.</p>
                  {searchTerm && (
                    <p className="customer-subtitle">
                      Try adjusting your search terms
                    </p>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}
    </div>
  );
}