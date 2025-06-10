// src/features/customers/QuickAddDisclosureRow.jsx
import React, { useState } from "react";
import { Disclosure } from '@headlessui/react';
import { PlusCircleIcon, ChevronUpIcon } from 'lucide-react';

export default function QuickAddDisclosureRow({ onAdd }) {
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

  const handleInput = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddClick = (close) => {
    if (!form.firstName || !form.lastName || !form.email) {
      setFormError("First Name, Last Name, and Email are required.");
      return;
    }
    setFormError("");
    onAdd(form);
    // Reset form and close the disclosure
    setForm({ firstName: "", lastName: "", email: "", address: "", phoneNumber: "", trackingCode: "", trackingCompany: "", tags: [] });
    close();
  }

  return (
    <Disclosure as={React.Fragment}>
      {({ open, close }) => (
        <>
          <tr className="bg-gray-50 border-b">
            <td colSpan="9" className="p-2">
              <Disclosure.Button className="w-full flex justify-between items-center p-2 text-blue-600 font-medium hover:bg-blue-100 rounded-md">
                <span className="flex items-center gap-2">
                    <PlusCircleIcon size={18} />
                    Quick Add New Customer
                </span>
                <ChevronUpIcon className={`w-5 h-5 transition-transform ${open ? '' : 'rotate-180'}`} />
              </Disclosure.Button>
            </td>
          </tr>
          <Disclosure.Panel as="tr">
            <td colSpan="9" className="p-4 bg-blue-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                <input className="border rounded px-2 py-1" name="firstName" value={form.firstName} onChange={handleInput} placeholder="First Name*" />
                <input className="border rounded px-2 py-1" name="lastName" value={form.lastName} onChange={handleInput} placeholder="Last Name*" />
                <input className="border rounded px-2 py-1" name="email" value={form.email} onChange={handleInput} placeholder="Email*" />
                <input className="border rounded px-2 py-1" name="phoneNumber" value={form.phoneNumber} onChange={handleInput} placeholder="Phone" />
                <input className="border rounded px-2 py-1" name="address" value={form.address} onChange={handleInput} placeholder="Address" />
                <input className="border rounded px-2 py-1" name="trackingCode" value={form.trackingCode} onChange={handleInput} placeholder="Tracking Code" />
                <input className="border rounded px-2 py-1" name="trackingCompany" value={form.trackingCompany} onChange={handleInput} placeholder="Tracking Company" />
                <button
                  className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 h-full"
                  onClick={() => handleAddClick(close)}
                >
                  Add
                </button>
              </div>
              {formError && <div className="text-red-600 text-xs mt-2">{formError}</div>}
            </td>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}