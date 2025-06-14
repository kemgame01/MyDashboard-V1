// src/features/customers/BulkActionBar.js
import React from "react";
import { Download, Trash2, Tag } from 'lucide-react';

export default function BulkActionBar({
  selectedCount,
  onBulkDelete,
  onBulkExport,
  onBulkTag,
  availableTags = ['New', 'Active', 'Inactive', 'VIP', 'Blocked'],
  isAdmin = false
}) {
  if (selectedCount === 0) return null;
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg mb-4 p-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-blue-900">
            {selectedCount} customer{selectedCount > 1 ? 's' : ''} selected
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Export Button */}
          <button
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
            onClick={onBulkExport}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          
          {/* Delete Button - Admin only */}
          {isAdmin && (
            <button
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
              onClick={onBulkDelete}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
          
          {/* Tag Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-sm">
              <Tag className="w-4 h-4" />
              Tag as...
            </button>
            <div className="absolute top-full mt-1 right-0 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[120px]">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => onBulkTag(tag)}
                  className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm first:rounded-t-lg last:rounded-b-lg"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}