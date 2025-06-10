// src/features/customers/CustomerTableRow.js
import React from "react";

export default function CustomerTableRow({
  customer,
  onEdit,
  onDelete,
  isSelected,
  onSelect,
  onTagChange,
}) {
  // Show tags as colored badges (use classNames for color by tag/status)
  const tagColor = (tag) => {
    switch (tag) {
      case "VIP": return "bg-green-200 text-green-700";
      case "Blocked": return "bg-red-200 text-red-700";
      case "New": return "bg-blue-200 text-blue-700";
      default: return "bg-gray-200 text-gray-700";
    }
  };

  return (
    <tr className="border-b hover:bg-gray-100">
      <td className="p-4 text-center">
        <input
          type="checkbox"
          checked={!!isSelected}
          onChange={onSelect}
          aria-label="Select customer"
        />
      </td>
      <td className="p-4">{customer.firstName}</td>
      <td className="p-4">{customer.lastName}</td>
      <td className="p-4">{customer.email}</td>
      <td className="p-4">{customer.address}</td>
      <td className="p-4">{customer.phoneNumber}</td>
      <td className="p-4">{customer.trackingCode}</td>
      <td className="p-4">{customer.trackingCompany}</td>
      <td className="p-4">
        {customer.tags?.map((tag) => (
          <span
            key={tag}
            className={`inline-block rounded-full px-2 py-0.5 mr-1 text-xs font-semibold ${tagColor(tag)}`}
          >
            {tag}
          </span>
        ))}
        {/* Editable tag dropdown (for demo; you can customize more) */}
        <select
          value={customer.tags?.[0] || ""}
          onChange={(e) => onTagChange(e.target.value)}
          className="ml-1 border px-1 rounded"
        >
          <option value="">- Tag -</option>
          <option value="VIP">VIP</option>
          <option value="Blocked">Blocked</option>
          <option value="New">New</option>
        </select>
      </td>
      <td className="p-4 flex space-x-2">
        <button
          onClick={onEdit}
          className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
