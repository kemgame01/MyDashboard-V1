// src/features/customers/QuickAddRow.jsx
import React, { useState } from "react";
import { PlusCircle, X } from 'lucide-react';
import '../../styles/CustomerSection.css'; // Import CSS from styles folder

export default function QuickAddRow({ onAdd, onClose }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    phoneNumber: "",
    trackingCode: "",
    trackingCompany: "",
    tags: ["New"],
  });
  const [formError, setFormError] = useState("");

  const handleInput = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError(""); // Clear error on input
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!form.firstName || !form.lastName || !form.email) {
      setFormError("First Name, Last Name, and Email are required.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    setFormError("");
    onAdd(form);
    
    // Reset form
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      address: "",
      phoneNumber: "",
      trackingCode: "",
      trackingCompany: "",
      tags: ["New"],
    });
    
    onClose();
  };

  const handleCancel = () => {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      address: "",
      phoneNumber: "",
      trackingCode: "",
      trackingCompany: "",
      tags: ["New"],
    });
    setFormError("");
    onClose();
  };

  return (
    <tr className="bg-blue-50">
      <td colSpan="9" className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-3 mb-3">
            <PlusCircle size={20} className="text-blue-600" />
            <h4 className="font-semibold text-blue-900">Quick Add New Customer</h4>
            <button
              type="button"
              onClick={handleCancel}
              className="ml-auto text-gray-500 hover:text-gray-700"
              aria-label="Cancel"
            >
              <X size={20} />
            </button>
          </div>

          {formError && (
            <div className="customer-error mb-3">{formError}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleInput}
                placeholder="First Name *"
                className="customer-form-input"
                autoFocus
              />
            </div>

            <div>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleInput}
                placeholder="Last Name *"
                className="customer-form-input"
              />
            </div>

            <div>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleInput}
                placeholder="Email *"
                className="customer-form-input"
              />
            </div>

            <div>
              <input
                type="tel"
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleInput}
                placeholder="Phone Number"
                className="customer-form-input"
              />
            </div>

            <div className="md:col-span-2">
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleInput}
                placeholder="Address"
                className="customer-form-input"
              />
            </div>

            <div>
              <input
                type="text"
                name="trackingCode"
                value={form.trackingCode}
                onChange={handleInput}
                placeholder="Tracking Code"
                className="customer-form-input"
              />
            </div>

            <div>
              <input
                type="text"
                name="trackingCompany"
                value={form.trackingCompany}
                onChange={handleInput}
                placeholder="Tracking Company"
                className="customer-form-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="customer-btn customer-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="customer-btn customer-btn-primary"
            >
              Add Customer
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}