import React, { useState, useEffect } from 'react';
import {
  collection, query, orderBy, limit, startAfter,
  getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import CustomerList from './CustomerList';
import CustomerForm from './CustomerForm';

const PAGE_SIZE = 15;

const CustomerSection = ({ userId }) => {
  // State
  const [customers, setCustomers] = useState([]);
  const [trackingCompanies, setTrackingCompanies] = useState([]);
  const [currentCustomer, setCurrentCustomer] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [formError, setFormError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [pageCursors, setPageCursors] = useState([null]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  // --- Always call hooks! ---
  useEffect(() => {
    // Defensive: only fetch if userId is ready
    if (!userId) return;
    const fetchTrackingCompanies = async () => {
      const companiesCollection = collection(db, 'trackingCompanies');
      const companiesSnapshot = await getDocs(companiesCollection);
      const companiesList = companiesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setTrackingCompanies(companiesList);
    };
    fetchTrackingCompanies();
  }, [userId]); // Now re-runs if userId changes

  useEffect(() => {
    // Defensive: only fetch if userId is ready
    if (!userId) return;
    setPageCursors([null]);
    setCurrentPage(0);
    fetchPage(0, [null]);
    // eslint-disable-next-line
  }, [userId]);

  // --- All hooks declared, now it's safe to do early return ---
  if (!userId) return <div>Loading...</div>;

  // --- Firestore customers collection ---
  const customersCollection = collection(db, 'users', userId, 'customers');

  // --- Fetch page (FireStore cursor pagination) ---
  const fetchPage = async (targetPage = 0, cursors = pageCursors) => {
    setLoading(true);
    let q;
    if (targetPage === 0) {
      q = query(customersCollection, orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
    } else {
      q = query(customersCollection, orderBy('createdAt', 'desc'),
        startAfter(cursors[targetPage]), limit(PAGE_SIZE));
    }
    const snapshot = await getDocs(q);
    setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    // Check for next page (look ahead)
    if (snapshot.docs.length === PAGE_SIZE) {
      const nextPageQuery = query(
        customersCollection,
        orderBy('createdAt', 'desc'),
        startAfter(snapshot.docs[snapshot.docs.length - 1]),
        limit(1)
      );
      const nextPageSnap = await getDocs(nextPageQuery);
      setHasNextPage(!nextPageSnap.empty);
    } else {
      setHasNextPage(false);
    }
    setLoading(false);
  };

  // Pagination controls
  const handleNextPage = async () => {
    if (customers.length === 0) return;
    const newCursors = [...pageCursors];
    if (newCursors.length === currentPage + 1) {
      // Use last doc in current page as cursor for next
      newCursors.push(customers[customers.length - 1].createdAt
        ? customers[customers.length - 1].createdAt
        : customers[customers.length - 1]);
    }
    setPageCursors(newCursors);
    const nextPageNum = currentPage + 1;
    setCurrentPage(nextPageNum);
    await fetchPage(nextPageNum, newCursors);
  };

  const handlePrevPage = async () => {
    if (currentPage === 0) return;
    const prevPageNum = currentPage - 1;
    setCurrentPage(prevPageNum);
    await fetchPage(prevPageNum, pageCursors);
  };

  // Add customer (returns to first page)
  const handleAddCustomerSubmit = async (e) => {
    e.preventDefault();
    const { firstName, lastName, email, address, phoneNumber, trackingCode, trackingCompany } = currentCustomer;
    if (!firstName || !lastName || !email || !address || !phoneNumber || !trackingCode || !trackingCompany) {
      setFormError('All fields are required. Please fill in all fields.');
      return;
    }
    try {
      await addDoc(collection(db, 'users', userId, 'customers'), {
        ...currentCustomer,
        createdAt: serverTimestamp(),
      });
      setIsAdding(false);
      setCurrentCustomer({});
      setPageCursors([null]);
      setCurrentPage(0);
      fetchPage(0, [null]);
    } catch (error) {
      console.error('Error adding customer: ', error);
    }
  };

  // Edit customer
  const handleSaveClick = async (editedCustomer) => {
    try {
      const customerId = editedCustomer.id;
      const customerDoc = doc(db, 'users', userId, 'customers', customerId);
      await updateDoc(customerDoc, { ...editedCustomer, updatedAt: serverTimestamp() });
      fetchPage(currentPage, pageCursors);
      setCurrentCustomer({});
    } catch (error) {
      console.error('Error saving customer: ', error);
    }
  };

  // Delete customer
  const handleDeleteClick = async (index) => {
    try {
      const customerToDelete = customers[index];
      if (!customerToDelete?.id) return;
      const customerDocRef = doc(db, 'users', userId, 'customers', customerToDelete.id);
      await deleteDoc(customerDocRef);
      fetchPage(currentPage, pageCursors);
    } catch (error) {
      console.error('Error deleting customer: ', error);
    }
  };

  // Modal form input handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCustomer(prev => ({ ...prev, [name]: value }));
  };

  // Search (client-side, current page only)
  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const handleAddCustomerClick = () => {
    setIsAdding(true);
    setFormError('');
  };

  const handleHideFormClick = () => {
    setIsAdding(false);
    setFormError('');
  };

  // Filtered (client-only, current page)
  const filteredCustomers = searchTerm
    ? customers.filter(customer =>
        Object.values(customer).some(
          field =>
            typeof field === 'string' &&
            field.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : customers;

  if (loading) return <div>Loading customers...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Customer List</h2>
        <div className="flex space-x-4">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search (current page only)"
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {isAdding ? (
            <button
              onClick={handleHideFormClick}
              className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition"
            >
              Hide Form
            </button>
          ) : (
            <button
              onClick={handleAddCustomerClick}
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
            >
              Add Customer
            </button>
          )}
        </div>
      </div>

      {isAdding && (
        <CustomerForm
          newCustomer={currentCustomer}
          trackingCompanies={trackingCompanies}
          handleNewCustomerChange={handleInputChange}
          handleAddCustomerSubmit={handleAddCustomerSubmit}
          formError={formError}
        />
      )}

      <CustomerList
        customers={filteredCustomers}
        handleSaveClick={handleSaveClick}
        handleDeleteClick={handleDeleteClick}
        trackingCompanies={trackingCompanies}
      />

      {/* Pagination Controls */}
      <div className="flex justify-center mt-4 space-x-2">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 0 || loading}
          className="bg-gray-300 px-4 py-2 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={handleNextPage}
          disabled={!hasNextPage || loading}
          className="bg-gray-300 px-4 py-2 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CustomerSection;
