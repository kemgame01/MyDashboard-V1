import Modal from "./Modal";
import React, { useState } from 'react';

const CustomerList = ({
  customers,
  isEditing,
  currentCustomer,
  trackingCompanies,
  handleEditClick,
  handleSaveClick,
  handleDeleteClick,
  handleInputChange
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editCustomer, setEditCustomer] = useState({});
  const itemsPerPage = 20;
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [formError, setFormError] = useState('');

  // Calculate the number of pages
  const totalPages = Math.ceil(customers.length / itemsPerPage);

  // Get the customers to display on the current page
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = customers.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle opening the modal
  const openEditModal = (index) => {
    setEditingIndex(index);
    setEditCustomer({ ...currentCustomers[index] });
    setShowEditModal(true);
  };
  // Handle closing the modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingIndex(null);
    setEditCustomer({});
    setFormError('');
  };

  return (
    <div>
      <table className="min-w-full bg-white shadow-md rounded-lg">
        <thead>
          <tr>
            <th className="border-b-2 border-gray-300 p-4 text-left">First Name</th>
            <th className="border-b-2 border-gray-300 p-4 text-left">Last Name</th>
            <th className="border-b-2 border-gray-300 p-4 text-left">Email</th>
            <th className="border-b-2 border-gray-300 p-4 text-left">Address</th>
            <th className="border-b-2 border-gray-300 p-4 text-left">Phone Number</th>
            <th className="border-b-2 border-gray-300 p-4 text-left">Tracking Code</th>
            <th className="border-b-2 border-gray-300 p-4 text-left">Tracking Company</th>
            <th className="border-b-2 border-gray-300 p-4 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentCustomers.length > 0 ? (
            currentCustomers.map((customer, index) => (
              <tr key={customer.id || index} className="border-b hover:bg-gray-100">
                <td className="p-4">{customer.firstName}</td>
                <td className="p-4">{customer.lastName}</td>
                <td className="p-4">{customer.email}</td>
                <td className="p-4">{customer.address}</td>
                <td className="p-4">{customer.phoneNumber}</td>
                <td className="p-4">{customer.trackingCode}</td>
                <td className="p-4">{customer.trackingCompany}</td>
                <td className="p-4 flex space-x-2">
                  <button
                    onClick={() => openEditModal(index)}
                    className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setDeleteIndex(index);
                      setShowConfirmDelete(true);
                    }}
                    className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="p-4 text-center text-gray-500">
                No customers found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`mx-1 px-3 py-1 rounded ${
                page === currentPage ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      <Modal isOpen={showEditModal} onClose={closeEditModal}>
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
              setFormError('All fields are required.');
              return;
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(editCustomer.email)) {
              setFormError('Please enter a valid email address.');
              return;
            }

            // Phone number validation (10 digits)
            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(editCustomer.phoneNumber)) {
              setFormError('Please enter a valid 10-digit phone number.');
              return;
            }

            // If all good, clear errors and save by customer object!
            setFormError('');
            handleSaveClick(editCustomer);
            closeEditModal();
          }}
        >
          {formError && <div className="text-red-500 mb-2">{formError}</div>}
          <input
            type="text"
            name="firstName"
            value={editCustomer.firstName || ""}
            onChange={(e) =>
              setEditCustomer({ ...editCustomer, firstName: e.target.value })
            }
            className="border px-2 py-1 rounded w-full mb-2"
            placeholder="First Name"
            required
          />
          <input
            type="text"
            name="lastName"
            value={editCustomer.lastName || ""}
            onChange={(e) =>
              setEditCustomer({ ...editCustomer, lastName: e.target.value })
            }
            className="border px-2 py-1 rounded w-full mb-2"
            placeholder="Last Name"
            required
          />
          <input
            type="email"
            name="email"
            value={editCustomer.email || ""}
            onChange={(e) =>
              setEditCustomer({ ...editCustomer, email: e.target.value })
            }
            className="border px-2 py-1 rounded w-full mb-2"
            placeholder="Email"
            required
          />
          <input
            type="text"
            name="address"
            value={editCustomer.address || ""}
            onChange={(e) =>
              setEditCustomer({ ...editCustomer, address: e.target.value })
            }
            className="border px-2 py-1 rounded w-full mb-2"
            placeholder="Address"
            required
          />
          <input
            type="text"
            name="phoneNumber"
            value={editCustomer.phoneNumber || ""}
            onChange={(e) =>
              setEditCustomer({ ...editCustomer, phoneNumber: e.target.value })
            }
            className="border px-2 py-1 rounded w-full mb-2"
            placeholder="Phone Number"
            required
          />
          <input
            type="text"
            name="trackingCode"
            value={editCustomer.trackingCode || ""}
            onChange={(e) =>
              setEditCustomer({ ...editCustomer, trackingCode: e.target.value })
            }
            className="border px-2 py-1 rounded w-full mb-2"
            placeholder="Tracking Code"
            required
          />
          <select
            name="trackingCompany"
            value={editCustomer.trackingCompany || ""}
            onChange={(e) =>
              setEditCustomer({ ...editCustomer, trackingCompany: e.target.value })
            }
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

      {showConfirmDelete && (
        <Modal isOpen={showConfirmDelete} onClose={() => setShowConfirmDelete(false)}>
          <div>
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
            <p>Are you sure you want to delete this customer?</p>
            <div className="flex justify-end gap-4 mt-6">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setShowConfirmDelete(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={() => {
                  handleDeleteClick(deleteIndex);
                  setShowConfirmDelete(false);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CustomerList;
