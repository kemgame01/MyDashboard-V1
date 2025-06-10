// src/features/sales/SaleProductTable.jsx

import React from "react";
import SalesCombobox from "../../components/SalesCombobox";

export default function SaleProductTable({
  products,
  productsList,
  productsLoading,
  onProductChange,
  onProductInputChange,
  onQuantityChange,
  onPriceChange,
  onAddRow,
  onRemoveRow,
}) {
  const grandTotal = (products || []).reduce((sum, p) => sum + (p.subtotal || 0), 0);

  return (
    <div className="border rounded-lg p-2 bg-[#f7fafd]">
      <div className="grid grid-cols-6 gap-2 text-xs font-semibold text-[#223163] mb-1">
        <span className="col-span-2">Product</span>
        <span>Qty</span>
        <span>Price (฿)</span>
        <span>Subtotal</span>
        <span></span>
      </div>
      {(products || []).map((row, idx) => (
        <div key={idx} className="grid grid-cols-6 gap-2 items-center mb-1">
          <div className="col-span-2">
            <SalesCombobox
              value={row.product}
              onChange={prod => onProductChange(idx, prod)}
              inputValue={row.productInput || ""}
              onInputChange={val => onProductInputChange(idx, val)}
              options={productsList}
              loading={productsLoading}
              placeholder="Search product"
              displayKey="name"
              required
            />
          </div>
          <input
            type="number"
            className="px-2 py-1 border rounded text-right w-14"
            min={1}
            value={row.quantity || 1}
            onChange={e => onQuantityChange(idx, e.target.value)}
            required
          />
          <input
            type="number"
            className="px-2 py-1 border rounded text-right w-20"
            min={0}
            value={row.price || ""}
            onChange={e => onPriceChange(idx, e.target.value)}
            required
          />
          <div className="text-right font-semibold w-20">{(row.subtotal || 0).toLocaleString()}</div>
          <button
            type="button"
            className="text-red-500 px-2 py-1 rounded hover:bg-red-50"
            onClick={() => onRemoveRow(idx)}
            disabled={products.length === 1}
            tabIndex={-1}
            title="Remove"
          >✕</button>
        </div>
      ))}
      <button
        type="button"
        className="mt-2 text-[#2563eb] bg-blue-100 hover:bg-blue-200 font-bold py-1 px-3 rounded"
        onClick={onAddRow}
        tabIndex={-1}
      >+ Add Product</button>
      <div className="flex justify-end font-bold mt-2">
        <span className="mr-3">Grand Total:</span>
        <span className="text-[#2563eb]">{grandTotal.toLocaleString()} ฿</span>
      </div>
    </div>
  );
}
