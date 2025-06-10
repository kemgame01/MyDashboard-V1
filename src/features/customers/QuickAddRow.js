// src/features/customers/QuickAddRow.js
import React, { useState } from "react";

export default function QuickAddRow({ onAdd }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    phoneNumber: "",
    trackingCode: "",
    trackingCompany: "",
    tags: [],
  });

  const [formError, setFormError] = useState("");

  const handleInput = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <tr className="bg-blue-50">
      <td colSpan={1}></td>
      <td className="p-2"><input className="border rounded px-1" name="firstName" value={form.firstName} onChange={handleInput} placeholder="First" /></td>
      <td className="p-2"><input className="border rounded px-1" name="lastName" value={form.lastName} onChange={handleInput} placeholder="Last" /></td>
      <td className="p-2"><input className="border rounded px-1" name="email" value={form.email} onChange={handleInput} placeholder="Email" /></td>
      <td className="p-2"><input className="border rounded px-1" name="address" value={form.address} onChange={handleInput} placeholder="Address" /></td>
      <td className="p-2"><input className="border rounded px-1" name="phoneNumber" value={form.phoneNumber} onChange={handleInput} placeholder="Phone" /></td>
      <td className="p-2"><input className="border rounded px-1" name="trackingCode" value={form.trackingCode} onChange={handleInput} placeholder="Code" /></td>
      <td className="p-2"><input className="border rounded px-1" name="trackingCompany" value={form.trackingCompany} onChange={handleInput} placeholder="Company" /></td>
      <td className="p-2 flex gap-1">
        <button
          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
          onClick={() => {
            if (
              !form.firstName ||
              !form.lastName ||
              !form.email ||
              !form.address ||
              !form.phoneNumber ||
              !form.trackingCode ||
              !form.trackingCompany
            ) {
              setFormError("Fill all fields");
              return;
            }
            setFormError("");
            onAdd(form);
            setForm({
              firstName: "",
              lastName: "",
              email: "",
              address: "",
              phoneNumber: "",
              trackingCode: "",
              trackingCompany: "",
              tags: [],
            });
          }}
        >
          Add
        </button>
        {formError && (
          <div className="text-red-500 text-xs">{formError}</div>
        )}
      </td>
    </tr>
  );
}
