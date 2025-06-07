import React from 'react';

const CustomerInfo = ({ customer }) => {
  if (!customer) {
    return <p className="text-gray-500">No customer selected.</p>;
  }

  return (
    <div className="flex items-start">
      <div className="mr-4">
        <img
          src="https://via.placeholder.com/150" // Placeholder image URL
          alt="Customer"
          className="w-40 h-40 object-cover rounded-lg"
        />
      </div>
      <div>
        <h2 className="text-2xl font-bold">{customer.trackingCode}</h2>
        <p className="text-gray-700 mt-2"><strong>Tracking Company:</strong> {customer.trackingCompany}</p>
      </div>
    </div>
  );
};

export default CustomerInfo;
