import React, { useState } from "react";
import InventorySummary from "./InventorySummary";
import InventoryTable from "./InventoryTable";
import InventoryForm from "./InventoryForm";
import Spinner from "../../components/Spinner";
import InventoryHistory from "./InventoryHistory";
import ProductLog from "./ProductLog";
import { useInventory } from "../../hooks/useInventory";

const InventoryDashboard = ({ user }) => {
  const inv = useInventory(user);
  const [activeTab, setActiveTab] = useState("table");
  const [showProductLog, setShowProductLog] = useState(null);

  // Normalize role for robust permission check
  const role = user?.role?.toLowerCase?.();
  const isRoot = user?.isRootAdmin === true;
  const canDoInventory = isRoot || role === "admin" || role === "manager";

  // Handler to open product log modal
  const handleViewProductLog = (productName) => setShowProductLog(productName);

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Tab Controls */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          className={`pb-2 px-2 border-b-2 ${
            activeTab === "table"
              ? "border-blue-600 text-blue-700 font-bold"
              : "border-transparent text-gray-500"
          }`}
          onClick={() => setActiveTab("table")}
        >
          Inventory
        </button>
        <button
          className={`pb-2 px-2 border-b-2 ${
            activeTab === "history"
              ? "border-blue-600 text-blue-700 font-bold"
              : "border-transparent text-gray-500"
          }`}
          onClick={() => setActiveTab("history")}
        >
          History
        </button>
      </div>

      {/* Inventory Tab */}
      {activeTab === "table" && (
        <>
          <InventorySummary inventory={inv.inventory} />
          <div className="flex flex-wrap gap-2 mb-4">
            <input
              className="flex-1 p-2 border rounded-xl"
              type="text"
              placeholder="Search inventory..."
              value={inv.search}
              onChange={e => inv.setSearch(e.target.value)}
            />
            <select
              value={inv.selectedBrand}
              onChange={e => inv.setSelectedBrand(e.target.value)}
              className="p-2 border rounded-xl"
            >
              <option value="ALL">All Brands</option>
              {inv.brandOptions.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
            {/* Only show these buttons if the user has inventory permissions */}
            {canDoInventory && (
              <>
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold"
                  onClick={inv.handleExport}
                >
                  Export CSV
                </button>
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold"
                  onClick={inv.handleBulkDelete}
                  disabled={!inv.selectedRows.length}
                >
                  Delete Selected
                </button>
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold"
                  onClick={() => inv.openForm()}
                >
                  + Add Inventory
                </button>
              </>
            )}
          </div>
          {inv.formError && (
            <div className="bg-red-100 text-red-800 rounded px-3 py-2 mb-3">
              {inv.formError}
            </div>
          )}
          {inv.loading ? (
            <Spinner text="Loading your inventory..." />
          ) : (
            <InventoryTable
              groupedByBrand={inv.groupedByBrand}
              selectedRows={inv.selectedRows}
              handleSelectAll={inv.handleSelectAll}
              handleSelectRow={inv.handleSelectRow}
              openForm={inv.openForm}
              handleDelete={inv.handleDelete}
              onViewProductLog={handleViewProductLog}
              userRole={user?.role}
              isRootAdmin={user?.isRootAdmin}
            />
          )}
          {inv.showForm && (
            <InventoryForm
              form={inv.form}
              handleChange={inv.handleFormChange}
              handleSave={inv.handleSave}
              isSubmitting={inv.isSubmitting}
              closeForm={inv.closeForm}
              brands={inv.brands}
              categories={inv.categories}
              subcategories={inv.subcategories}
              newBrand={inv.newBrand}
              setNewBrand={inv.setNewBrand}
              addBrand={inv.addBrand}
              newCategory={inv.newCategory}
              setNewCategory={inv.setNewCategory}
              addCategory={inv.addCategory}
              newSubcategory={inv.newSubcategory}
              setNewSubcategory={inv.setNewSubcategory}
              addSubcategory={inv.addSubcategory}
              updateSubcategories={inv.updateSubcategories}
            />
          )}
        </>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <InventoryHistory userId={user.uid} />
      )}

      {/* Product Log Modal */}
      {showProductLog && (
        <ProductLog
          userId={user.uid}
          productName={showProductLog}
          onClose={() => setShowProductLog(null)}
        />
      )}
    </div>
  );
};

export default InventoryDashboard;
