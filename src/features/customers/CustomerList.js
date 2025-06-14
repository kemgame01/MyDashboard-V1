// src/features/customers/CustomerList.js
// Fixed version with search and filter controls integrated

import React, { useState } from "react";
import BulkActionBar from "./BulkActionBar";
import Pagination from "./Pagination";
import CustomerDisclosureRow from "./CustomerDisclosureRow";
import QuickAddDisclosureRow from "./QuickAddDisclosureRow";
import CustomerFilters from "./CustomerFilters";
import { Filter, Search, Plus } from 'lucide-react';

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

  const allVisibleSelected = currentCustomers.length > 0 && currentCustomers.every((c) => selectedIds.includes(c.id));
  const handleSelectRow = (id) => setSelectedIds(prev => prev.includes(id) ? 
    prev.filter((sid) => sid !== id) : [...prev, id]);
  const handleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(selectedIds.filter((id) => !currentCustomers.some((c) => c.id === id)));
    } else {
      const newIds = currentCustomers.map((c) => c.id).filter((id) => !selectedIds.includes(id));
      setSelectedIds([...selectedIds, ...newIds]);
    }
  };

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'tag' && value !== 'all') return true;
    if (key === 'hasPhone' && value !== 'all') return true;
    if (key === 'hasAddress' && value !== 'all') return true;
    if (key === 'dateFrom' && value) return true;
    if (key === 'dateTo' && value) return true;
    if (key === 'searchText' && value) return true;
    return false;
  }).length;

  return (
    <div>
      {/* Customer Controls Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <h2 className="text-lg font-semibold">Customer Controls</h2>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Add Button */}
            <button
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              <Plus className="w-4 h-4" />
              Quick Add Customer
            </button>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[250px]"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t">
            <CustomerFilters
              filters={filters}
              setFilters={setFilters}
              availableTags={availableTags}
              onApply={handleApplyFilters}
              onClear={handleResetFilters}
            />
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar 
        selectedCount={selectedIds.length} 
        onBulkDelete={() => handleBulkDelete(selectedIds)} 
        onBulkExport={() => handleBulkExport(selectedIds)} 
        onBulkTag={(tag) => handleBulkTag(selectedIds, tag)} 
      />

      {/* Customer Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-center w-12">
                <input 
                  type="checkbox" 
                  checked={allVisibleSelected} 
                  onChange={handleSelectAll} 
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-offset-0 focus:ring-blue-200 focus:ring-opacity-50" 
                />
              </th>
              <th className="p-4 text-left font-semibold text-gray-600">First Name</th>
              <th className="p-4 text-left font-semibold text-gray-600">Last Name</th>
              <th className="p-4 text-left font-semibold text-gray-600">Email</th>
              <th className="p-4 text-left font-semibold text-gray-600">Address</th>
              <th className="p-4 text-left font-semibold text-gray-600">Phone</th>
              <th className="p-4 text-left font-semibold text-gray-600">Tracking Code</th>
              <th className="p-4 text-left font-semibold text-gray-600">Tags</th>
              <th className="p-4 text-left font-semibold text-gray-600 w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {showQuickAdd && (
              <QuickAddDisclosureRow onAdd={handleAddQuick} />
            )}
            {currentCustomers.length > 0 ? (
              currentCustomers.map((customer) => (
                <CustomerDisclosureRow
                  key={customer.id}
                  customer={customer}
                  trackingCompanies={trackingCompanies}
                  onSave={handleSaveClick}
                  onDelete={handleDeleteClick}
                  onInitiateTagChange={handleInitiateTagChange}
                  isSelected={selectedIds.includes(customer.id)}
                  onSelect={handleSelectRow}
                />
              ))
            ) : (
              <tr>
                <td colSpan="9" className="p-8 text-center text-gray-500">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={(page) => setCurrentPage(page)} 
      />
    </div>
  );
}