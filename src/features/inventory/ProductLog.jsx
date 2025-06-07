import React from "react";
import InventoryHistory from "./InventoryHistory";

// Usage: <ProductLog userId={userId} productName="Whey Protein XXL" onClose={() => setShowLog(false)} />
const ProductLog = ({ userId, productName, onClose }) => (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-4xl w-full relative">
      <button
        className="absolute top-4 right-4 text-gray-400 hover:text-red-400"
        onClick={onClose}
        aria-label="Close product log"
      >
        ✕
      </button>
      <h2 className="text-xl font-bold mb-4">
        History for <span className="text-blue-800">{productName}</span>
      </h2>
      <InventoryHistory userId={userId} productFilter={productName} />
    </div>
  </div>
);

export default ProductLog;
