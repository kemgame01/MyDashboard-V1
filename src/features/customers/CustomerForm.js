import React from 'react';

const CustomerForm = ({
  newCustomer,
  trackingCompanies,
  handleNewCustomerChange,
  handleAddCustomerSubmit,
  formError,
}) => {
  return (
    <form onSubmit={handleAddCustomerSubmit} className="mb-6 bg-white p-6 rounded shadow">
      <h3 className="text-xl font-semibold mb-4">Add New Customer</h3>
      {formError && <p className="text-red-500 mb-4">{formError}</p>}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          value={newCustomer.firstName}
          onChange={handleNewCustomerChange}
          className="border px-2 py-1 rounded w-full"
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={newCustomer.lastName}
          onChange={handleNewCustomerChange}
          className="border px-2 py-1 rounded w-full"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={newCustomer.email}
          onChange={handleNewCustomerChange}
          className="border px-2 py-1 rounded w-full"
        />
        <input
          type="text"
          name="address"
          placeholder="Address"
          value={newCustomer.address}
          onChange={handleNewCustomerChange}
          className="border px-2 py-1 rounded w-full"
        />
        <input
          type="text"
          name="phoneNumber"
          placeholder="Phone Number"
          value={newCustomer.phoneNumber}
          onChange={handleNewCustomerChange}
          className="border px-2 py-1 rounded w-full"
        />
        <input
          type="text"
          name="trackingCode"
          placeholder="Tracking Code"
          value={newCustomer.trackingCode}
          onChange={handleNewCustomerChange}
          className="border px-2 py-1 rounded w-full"
        />
        <select
          name="trackingCompany"
          value={newCustomer.trackingCompany}
          onChange={handleNewCustomerChange}
          className="border px-2 py-1 rounded w-full"
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
      </div>
      <button
        type="submit"
        className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition"
      >
        Add Customer
      </button>
    </form>
  );
};

export default CustomerForm;