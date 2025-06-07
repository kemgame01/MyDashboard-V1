import React, { useState } from 'react';
import { fetchCustomers } from '../services/authService';

const CustomerSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('email');
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!searchTerm) {
      setError('Please enter a search term.');
      setLoading(false);
      return;
    }

    const result = await fetchCustomers(searchBy, searchTerm);

    if (result.success) {
      setCustomers(result.customers);
    } else {
      setError(result.message || 'Failed to fetch customer information. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Customer Search</h2>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Search by</label>
            <select
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value)}
            >
              <option value="email">Email</option>
              <option value="phoneNumber">Phone Number</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="searchTerm" className="block text-gray-700 mb-2">
              {searchBy === 'email' ? 'Email' : 'Phone Number'}
            </label>
            <input
              type={searchBy === 'email' ? 'email' : 'text'}
              id="searchTerm"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Enter ${searchBy}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {customers.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-center">
              <img
                src="https://via.placeholder.com/150"
                alt="Customer"
                className="rounded-full w-32 h-32"
              />
            </div>
            <div>
              {customers.map((customer) => (
                <div key={customer.id} className="mb-4">
                  <p><strong>First Name:</strong> {customer.firstName}</p>
                  <p><strong>Email:</strong> {customer.email}</p>
                  <p><strong>Phone Number:</strong> {customer.phoneNumber}</p>
                  <p><strong>Tracking Code:</strong> {customer.trackingCode}</p>
                  <p><strong>Tracking Company:</strong> {customer.trackingCompany}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerSearch;
