import React, { useState } from "react";
import BulkActionBar from "./BulkActionBar";
import Pagination from "./Pagination";
import CustomerDisclosureRow from "./CustomerDisclosureRow";
import QuickAddDisclosureRow from "./QuickAddDisclosureRow";

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
  handleInitiateTagChange, // CORRECT: This now expects the prop for starting the confirmation flow
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  const totalPages = Math.ceil(customers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = customers.slice(indexOfFirstItem, indexOfLastItem);

  const allVisibleSelected = currentCustomers.length > 0 && currentCustomers.every((c) => selectedIds.includes(c.id));
  const handleSelectRow = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]);
  const handleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(selectedIds.filter((id) => !currentCustomers.some((c) => c.id === id)));
    } else {
      const newIds = currentCustomers.map((c) => c.id).filter((id) => !selectedIds.includes(id));
      setSelectedIds([...selectedIds, ...newIds]);
    }
  };

  return (
    <div>
      <BulkActionBar selectedCount={selectedIds.length} onBulkDelete={() => handleBulkDelete(selectedIds)} onBulkExport={() => handleBulkExport(selectedIds)} onBulkTag={(tag) => handleBulkTag(selectedIds, tag)} />
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-center w-12"><input type="checkbox" checked={allVisibleSelected} onChange={handleSelectAll} className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-offset-0 focus:ring-blue-200 focus:ring-opacity-50" /></th>
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
            <QuickAddDisclosureRow onAdd={handleAddQuick} />
            {currentCustomers.length > 0 ? (
              currentCustomers.map((customer) => (
                <CustomerDisclosureRow
                  key={customer.id}
                  customer={customer}
                  trackingCompanies={trackingCompanies}
                  onSave={handleSaveClick}
                  onDelete={handleDeleteClick}
                  onInitiateTagChange={handleInitiateTagChange} // CORRECT: This passes the function down to the row
                  isSelected={selectedIds.includes(customer.id)}
                  onSelect={handleSelectRow}
                />
              ))
            ) : (
              <tr><td colSpan="9" className="p-8 text-center text-gray-500">No customers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} />
    </div>
  );
}