import React, { useState } from "react";
import InventorySummary from "./InventorySummary";
import InventoryTable from "./InventoryTable";
import InventoryForm from "./InventoryForm";
import Spinner from "../../components/Spinner";
import InventoryHistory from "./InventoryHistory";
import ProductLog from "./ProductLog";
import { useInventory } from "../../hooks/useInventory";
import { canManageShopInventory } from "../../utils/shopPermissions";

const InventoryDashboard = ({ user, shopContext }) => {
  const inv = useInventory(user, shopContext);
  const [activeTab, setActiveTab] = useState("table");
  const [showProductLog, setShowProductLog] = useState(null);

  // Shop-aware permission check
  const canDoInventory = canManageShopInventory(user, shopContext?.shopId);
  
  // Fallback to legacy role-based permissions for backward compatibility
  const role = user?.role?.toLowerCase?.();
  const isRoot = user?.isRootAdmin === true;
  const legacyCanDoInventory = isRoot || role === "admin" || role === "manager";
  
  // Use shop permissions if available, otherwise fall back to legacy
  const hasInventoryAccess = shopContext ? canDoInventory : legacyCanDoInventory;

  // Handler to open product log modal
  const handleViewProductLog = (productName) => setShowProductLog(productName);

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Shop Context Header */}
      {shopContext && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-medium">🏪 Managing inventory for:</span>
            <span className="font-semibold text-blue-800">{shopContext.shopName}</span>
            {shopContext.isOwner && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Owner</span>
            )}
          </div>
          <p className="text-sm text-blue-600 mt-1">
            Role: {shopContext.role || 'Staff'} • 
            Access Level: {hasInventoryAccess ? 'Full Access' : 'View Only'}
          </p>
        </div>
      )}

      {/* Access Control Message */}
      {!hasInventoryAccess && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">⚠️</span>
            <span className="font-medium text-yellow-800">Limited Access</span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            You have read-only access to inventory. Contact your shop manager for editing permissions.
          </p>
        </div>
      )}

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
          <InventorySummary 
            inventory={inv.inventory} 
            shopContext={shopContext}
          />
          <div className="flex flex-wrap gap-2 mb-4">
            <input
              className="flex-1 p-2 border rounded-xl"
              type="text"
              placeholder={`Search inventory${shopContext ? ` in ${shopContext.shopName}` : ''}...`}
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
            
            {/* Always show export - everyone can export */}
            <button
              className="bg-gray-600 text-white px-4 py-2 rounded-xl font-bold"
              onClick={inv.handleExport}
            >
              Export CSV
            </button>
            
            {/* Only show these buttons if the user has inventory permissions */}
            {hasInventoryAccess && (
              <>
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
            <Spinner text={`Loading ${shopContext ? shopContext.shopName + ' ' : ''}inventory...`} />
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
              hasEditAccess={hasInventoryAccess}
              shopContext={shopContext}
            />
          )}
          
          {inv.showForm && hasInventoryAccess && (
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
              shopContext={shopContext}
            />
          )}
        </>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <InventoryHistory 
          userId={user.uid} 
          shopContext={shopContext}
        />
      )}

      {/* Product Log Modal */}
      {showProductLog && (
        <ProductLog
          userId={user.uid}
          productName={showProductLog}
          onClose={() => setShowProductLog(null)}
          shopContext={shopContext}
        />
      )}

      {/* Low Stock Alert for Shop Owners/Managers */}
      {hasInventoryAccess && inv.inventory && (
        <LowStockAlert 
          inventory={inv.inventory} 
          shopContext={shopContext}
        />
      )}
    </div>
  );
};

// Low Stock Alert Component
const LowStockAlert = ({ inventory, shopContext }) => {
  const lowStockItems = inventory.filter(item => 
    item.quantity <= item.minStock && item.quantity > 0
  );
  
  const outOfStockItems = inventory.filter(item => 
    item.quantity === 0
  );

  if (lowStockItems.length === 0 && outOfStockItems.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 p-4 border border-orange-200 rounded-lg bg-orange-50">
      <h3 className="font-semibold text-orange-800 mb-2">
        📦 Stock Alerts {shopContext && `- ${shopContext.shopName}`}
      </h3>
      
      {outOfStockItems.length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium text-red-700 mb-1">
            🚨 Out of Stock ({outOfStockItems.length} items):
          </p>
          <div className="text-sm text-red-600">
            {outOfStockItems.slice(0, 5).map(item => item.name).join(', ')}
            {outOfStockItems.length > 5 && ` +${outOfStockItems.length - 5} more`}
          </div>
        </div>
      )}
      
      {lowStockItems.length > 0 && (
        <div>
          <p className="text-sm font-medium text-orange-700 mb-1">
            ⚠️ Low Stock ({lowStockItems.length} items):
          </p>
          <div className="text-sm text-orange-600">
            {lowStockItems.slice(0, 5).map(item => 
              `${item.name} (${item.quantity}/${item.minStock})`
            ).join(', ')}
            {lowStockItems.length > 5 && ` +${lowStockItems.length - 5} more`}
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryDashboard;