// src/features/customers/CustomerEditModal.js
import React, { useState, useEffect } from "react";
import Modal from "../../components/Modal"; // Adjust path if Modal is elsewhere
import '../../styles/CustomerSection.css'; // Use the same CSS from styles folder

export default function CustomerEditModal({
  show,
  customer,
  trackingCompanies,
  onSave,
  onClose
}) {
  const [formError, setFormError] = useState("");
  const [editCustomer, setEditCustomer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    phoneNumber: "",
    trackingCode: "",
    trackingCompany: "",
    tags: []
  });

  useEffect(() => {
    if (customer) {
      setEditCustomer({
        ...customer,
        tags: customer.tags || []
      });
    } else {
      setEditCustomer({
        firstName: "",
        lastName: "",
        email: "",
        address: "",
        phoneNumber: "",
        trackingCode: "",
        trackingCompany: "",
        tags: []
      });
    }
    setFormError("");
  }, [customer, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditCustomer(prev => ({
      ...prev,
      [name]: value
    }));
    setFormError(""); // Clear error on change
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!editCustomer.firstName || !editCustomer.lastName || !editCustomer.email) {
      setFormError("First Name, Last Name, and Email are required.");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editCustomer.email)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    
    if (editCustomer.phoneNumber) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(editCustomer.phoneNumber)) {
        setFormError("Please enter a valid 10-digit phone number.");
        return;
      }
    }
    
    onSave(editCustomer);
  };

  if (!show) return null;

  return (
    <Modal isOpen={show} onClose={onClose}>
      <div className="customer-modal">
        <div className="customer-modal-header">
          <h2 className="customer-modal-title">
            {customer?.id ? 'Edit Customer' : 'Add New Customer'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="customer-modal-body">
            {formError && (
              <div className="customer-error">{formError}</div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="customer-form-group">
                <label className="customer-form-label">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={editCustomer.firstName}
                  onChange={handleChange}
                  className="customer-form-input"
                  placeholder="Enter first name"
                />
              </div>
              
              <div className="customer-form-group">
                <label className="customer-form-label">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={editCustomer.lastName}
                  onChange={handleChange}
                  className="customer-form-input"
                  placeholder="Enter last name"
                />
              </div>
              
              <div className="customer-form-group md:col-span-2">
                <label className="customer-form-label">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={editCustomer.email}
                  onChange={handleChange}
                  className="customer-form-input"
                  placeholder="Enter email address"
                />
              </div>
              
              <div className="customer-form-group md:col-span-2">
                <label className="customer-form-label">Address</label>
                <input
                  type="text"
                  name="address"
                  value={editCustomer.address}
                  onChange={handleChange}
                  className="customer-form-input"
                  placeholder="Enter address"
                />
              </div>
              
              <div className="customer-form-group">
                <label className="customer-form-label">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={editCustomer.phoneNumber}
                  onChange={handleChange}
                  className="customer-form-input"
                  placeholder="10-digit phone number"
                />
              </div>
              
              <div className="customer-form-group">
                <label className="customer-form-label">Tracking Code</label>
                <input
                  type="text"
                  name="trackingCode"
                  value={editCustomer.trackingCode}
                  onChange={handleChange}
                  className="customer-form-input"
                  placeholder="Enter tracking code"
                />
              </div>
              
              <div className="customer-form-group md:col-span-2">
                <label className="customer-form-label">Tracking Company</label>
                <select
                  name="trackingCompany"
                  value={editCustomer.trackingCompany}
                  onChange={handleChange}
                  className="customer-form-input"
                >
                  <option value="">Select a company</option>
                  {trackingCompanies?.map((company) => (
                    <option key={company.id} value={company.name}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="customer-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="customer-btn customer-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="customer-btn customer-btn-primary"
            >
              {customer?.id ? 'Save Changes' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}