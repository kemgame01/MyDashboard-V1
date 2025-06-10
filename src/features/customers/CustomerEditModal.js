// src/features/customers/CustomerEditModal.js
import React, { useState, useEffect } from "react";
import Modal from "../../components/Modal";

export default function CustomerEditModal({
  show,
  customer,
  trackingCompanies,
  onSave,
  onClose
}) {
  const [formError, setFormError] = useState("");
  const [editCustomer, setEditCustomer] = useState(customer || {});

  useEffect(() => {
    setEditCustomer(customer || {});
    setFormError("");
  }, [customer, show]);

  return (
    <Modal isOpen={show} onClose={onClose}>
      <h2 className="text-xl font-semibold mb-4">Edit Customer</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          // Validation
          if (
            !editCustomer.firstName ||
            !editCustomer.lastName ||
            !editCustomer.email ||
            !editCustomer.address ||
            !editCustomer.phoneNumber ||
            !editCustomer.trackingCode ||
            !editCustomer.trackingCompany
          ) {
            setFormError("All fields are required.");
            return;
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(editCustomer.email)) {
            setFormError("Please enter a valid email address.");
            return;
          }
          const phoneRegex = /^\d{10}$/;
          if (!phoneRegex.test(editCustomer.phoneNumber)) {
            setFormError("Please enter a valid 10-digit phone number.");
            return;
          }
          setFormError("");
          onSave(editCustomer);
        }}
      >
        {formError && <div className="text-red-500 mb-2">{formError}</div>}
        <input
          type="text"
          name="firstName"
          value={editCustomer.firstName || ""}
          onChange={(e) => setEditCustomer({ ...editCustomer, firstName: e.target.value })}
          className="border px-2 py-1 rounded w-full mb-2"
          placeholder="First Name"
          required
        />
        <input
          type="text"
          name="lastName"
          value={editCustomer.lastName || ""}
          onChange={(e) => setEditCustomer({ ...editCustomer, lastName: e.target.value })}
          className="border px-2 py-1 rounded w-full mb-2"
          placeholder="Last Name"
          required
        />
        <input
          type="email"
          name="email"
          value={editCustomer.email || ""}
          onChange={(e) => setEditCustomer({ ...editCustomer, email: e.target.value })}
          className="border px-2 py-1 rounded w-full mb-2"
          placeholder="Email"
          required
        />
        <input
          type="text"
          name="address"
          value={editCustomer.address || ""}
          onChange={(e) => setEditCustomer({ ...editCustomer, address: e.target.value })}
          className="border px-2 py-1 rounded w-full mb-2"
          placeholder="Address"
          required
        />
        <input
          type="text"
          name="phoneNumber"
          value={editCustomer.phoneNumber || ""}
          onChange={(e) => setEditCustomer({ ...editCustomer, phoneNumber: e.target.value })}
          className="border px-2 py-1 rounded w-full mb-2"
          placeholder="Phone Number"
          required
        />
        <input
          type="text"
          name="trackingCode"
          value={editCustomer.trackingCode || ""}
          onChange={(e) => setEditCustomer({ ...editCustomer, trackingCode: e.target.value })}
          className="border px-2 py-1 rounded w-full mb-2"
          placeholder="Tracking Code"
          required
        />
        <select
          name="trackingCompany"
          value={editCustomer.trackingCompany || ""}
          onChange={(e) => setEditCustomer({ ...editCustomer, trackingCompany: e.target.value })}
          className="border px-2 py-1 rounded w-full mb-4"
          required
        >
          <option value="" disabled>
            Select Tracking Company
          </option>
          {trackingCompanies.map((company) => (
            <option key={company.id} value={company.name}>
              {company.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 mt-4 w-full"
        >
          Save Changes
        </button>
      </form>
    </Modal>
  );
}
