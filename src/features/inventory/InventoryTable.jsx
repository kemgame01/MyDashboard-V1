import React from "react";

const InventoryTable = ({
  groupedByBrand,
  selectedRows,
  handleSelectAll,
  handleSelectRow,
  openForm,
  handleDelete,
  onViewProductLog,
  userRole,
  isRootAdmin, // <-- Root admin privilege
}) => (
  <div className="overflow-x-auto">
    {/* Section Header/Legend */}
    <div className="flex flex-wrap items-center justify-between px-2 py-3 mb-2 bg-blue-50 rounded-t-xl border-b border-blue-200">
      <div className="flex items-center gap-4 font-semibold text-blue-800 text-lg">
        <span className="hidden sm:inline">Inventory List</span>
        <span className="text-xs text-gray-400 font-normal hidden md:inline">
          (You can filter, edit, delete, or view logs for each item)
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-600">
        <span className="bg-green-200 rounded px-2">Stock OK</span>
        <span className="bg-yellow-200 rounded px-2">Low</span>
        <span className="bg-red-200 rounded px-2">Empty</span>
      </div>
    </div>
    <table className="min-w-full border rounded-b-xl shadow-sm bg-white table-auto text-sm">
      <thead>
        <tr className="bg-blue-100 text-blue-900 border-b">
          <th className="p-2 text-left">
            <input
              type="checkbox"
              checked={
                selectedRows.length === Object.values(groupedByBrand).flat().length &&
                Object.values(groupedByBrand).flat().length > 0
              }
              onChange={handleSelectAll}
            />
          </th>
          <th className="p-2 text-left min-w-[160px]">Product Name</th>
          <th className="p-2 text-left min-w-[90px]">SKU</th>
          <th className="p-2 text-left min-w-[110px]">Brand</th>
          <th className="p-2 text-left min-w-[110px]">Category</th>
          <th className="p-2 text-left min-w-[110px]">Subcategory</th>
          <th className="p-2 text-center min-w-[60px]">Qty</th>
          <th className="p-2 text-center min-w-[50px]">Min</th>
          <th className="p-2 text-center min-w-[80px]">Price</th>
          <th className="p-2 text-left min-w-[100px]">Supplier</th>
          <th className="p-2 text-left min-w-[100px]">Location</th>
          <th className="p-2 text-left min-w-[110px]">Last Update</th>
          <th className="p-2 text-center min-w-[150px]">Actions</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(groupedByBrand).length === 0 && (
          <tr>
            <td colSpan={13} className="text-center p-4 text-gray-500">
              No products found.
            </td>
          </tr>
        )}
        {Object.entries(groupedByBrand).map(([brand, items]) => (
          <React.Fragment key={brand}>
            <tr>
              <td colSpan={13} className="py-3 px-2 bg-blue-50 font-bold text-base text-blue-700 border-t">
                {brand}
              </td>
            </tr>
            {items.map((item) => {
              const lowStock = item.quantity < item.minStock;
              const outOfStock = Number(item.quantity) === 0;
              return (
                <tr
                  key={item.id}
                  className={
                    selectedRows.includes(item.id)
                      ? "bg-blue-50"
                      : outOfStock
                      ? "bg-red-50"
                      : lowStock
                      ? "bg-yellow-50"
                      : ""
                  }
                >
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(item.id)}
                      onChange={() => handleSelectRow(item.id)}
                    />
                  </td>
                  {/* Name */}
                  <td className="p-2 font-bold">{item.name}</td>
                  {/* SKU */}
                  <td className="p-2">{item.sku}</td>
                  {/* Brand */}
                  <td className="p-2">{item.brand}</td>
                  {/* Category */}
                  <td className="p-2">{item.category}</td>
                  {/* Subcategory */}
                  <td className="p-2">{item.subcategory}</td>
                  {/* Qty */}
                  <td
                    className={`p-2 text-center font-semibold ${
                      outOfStock
                        ? "text-red-700"
                        : lowStock
                        ? "text-yellow-700"
                        : "text-green-700"
                    }`}
                  >
                    {item.quantity}
                  </td>
                  {/* Min */}
                  <td className="p-2 text-center">{item.minStock}</td>
                  {/* Price */}
                  <td className="p-2 text-center">
                    {Number(item.unitPrice).toLocaleString(undefined, {
                      style: "currency",
                      currency: "THB",
                      minimumFractionDigits: 0,
                    })}
                  </td>
                  {/* Supplier */}
                  <td className="p-2">{item.supplier}</td>
                  {/* Location */}
                  <td className="p-2">{item.location}</td>
                  {/* Last Update */}
                  <td className="p-2 text-xs text-gray-400">
                    {item.updatedBy?.name || "Unknown"}
                  </td>
                  {/* Actions */}
                  <td className="p-2 flex flex-wrap gap-1 justify-center">
                    {(userRole === "Admin" || userRole === "Manager" || isRootAdmin) && (
                      <>
                        <button
                          className="px-2 py-1 bg-yellow-100 rounded"
                          onClick={() => openForm(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="px-2 py-1 bg-red-100 rounded"
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                    <button
                      className="px-2 py-1 bg-blue-100 rounded text-blue-800 hover:bg-blue-200"
                      onClick={() => onViewProductLog(item.name)}
                    >
                      View History
                    </button>
                  </td>
                </tr>
              );
            })}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  </div>
);

export default InventoryTable;
