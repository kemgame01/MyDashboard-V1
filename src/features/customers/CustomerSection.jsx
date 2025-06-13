// src/features/customers/CustomerSection.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection, query, orderBy, limit, startAfter, endBefore, limitToLast,
  getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
  collectionGroup, where, and
} from 'firebase/firestore';
import { db } from '../../firebase';
import CustomerList from './CustomerList';
import CustomerForm from './CustomerForm';
import CustomerFilters from './CustomerFilters';
import TagChangeConfirmModal from './TagChangeConfirmModal';
import { exportCSV } from '../../utils/exportCSV';
import CustomerControlsDisclosure from "./CustomerControlsDisclosure";
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 15;

const CustomerSection = ({ userId, user, shopContext }) => { 
  const [customers, setCustomers] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [trackingCompanies, setTrackingCompanies] = useState([]);
  const [newCustomer, setNewCustomer] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [formError, setFormError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [tagChangeInfo, setTagChangeInfo] = useState(null);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
  // Advanced filters state
  const [filters, setFilters] = useState({
    tag: 'all',
    dateFrom: null,
    dateTo: null,
    hasPhone: 'all',
    hasAddress: 'all',
    searchText: ''
  });
  
  const [activeFilters, setActiveFilters] = useState({});
  
  const isRootAdmin = user?.isRootAdmin === true;
  const isShopOwner = user?.assignedShops?.some(shop => shop.isOwner) || false;
  const currentShopId = shopContext?.shopId;

  // Get unique tags from customers
  const availableTags = useMemo(() => {
    const tags = new Set(['New', 'Active', 'Inactive', 'VIP']);
    allCustomers.forEach(customer => {
      if (customer.tags && customer.tags.length > 0) {
        customer.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags);
  }, [allCustomers]);

  const mapCustomerData = (doc) => ({
    id: doc.id,
    ...doc.data(),
    shopId: doc.ref.parent.parent.id, // Shop ID from the path
  });
  
  // Client-side filtering function
  const applyClientSideFilters = useCallback((customers) => {
    return customers.filter(customer => {
      // Tag filter
      if (activeFilters.tag && activeFilters.tag !== 'all') {
        if (!customer.tags || !customer.tags.includes(activeFilters.tag)) {
          return false;
        }
      }
      
      // Date filters
      if (activeFilters.dateFrom) {
        const customerDate = customer.createdAt?.toDate ? customer.createdAt.toDate() : new Date(customer.createdAt);
        if (customerDate < new Date(activeFilters.dateFrom)) return false;
      }
      if (activeFilters.dateTo) {
        const customerDate = customer.createdAt?.toDate ? customer.createdAt.toDate() : new Date(customer.createdAt);
        const endDate = new Date(activeFilters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        if (customerDate > endDate) return false;
      }
      
      // Has phone filter
      if (activeFilters.hasPhone === 'yes' && !customer.phoneNumber) return false;
      if (activeFilters.hasPhone === 'no' && customer.phoneNumber) return false;
      
      // Has address filter
      if (activeFilters.hasAddress === 'yes' && !customer.address) return false;
      if (activeFilters.hasAddress === 'no' && customer.address) return false;
      
      // Text search
      if (activeFilters.searchText) {
        const searchLower = activeFilters.searchText.toLowerCase();
        const searchableFields = [
          customer.firstName,
          customer.lastName,
          customer.email,
          customer.phoneNumber,
          customer.company,
          customer.address
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableFields.includes(searchLower)) return false;
      }
      
      // Quick search
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const searchableFields = [
          customer.firstName,
          customer.lastName,
          customer.email,
          customer.phoneNumber,
          customer.company,
          customer.address,
          customer.trackingCode,
          customer.trackingCompany
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableFields.includes(searchLower)) return false;
      }
      
      return true;
    });
  }, [activeFilters, searchTerm]);

  // Load all customers initially
  const loadAllCustomers = useCallback(async () => {
    setLoading(true);
    setFormError('');
    
    try {
      let allData = [];

      if (isRootAdmin) {
        // Root admin can see all customers from all shops
        const shopsSnapshot = await getDocs(collection(db, 'shops'));
        
        for (const shopDoc of shopsSnapshot.docs) {
          const customersRef = collection(db, 'shops', shopDoc.id, 'customers');
          const customersSnapshot = await getDocs(query(customersRef, orderBy('createdAt', 'desc')));
          const shopCustomers = customersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            shopId: shopDoc.id,
            shopName: shopDoc.data().shopName
          }));
          allData = [...allData, ...shopCustomers];
        }
      } else if (currentShopId) {
        // Regular users see customers from their current shop
        const customersRef = collection(db, 'shops', currentShopId, 'customers');
        const q = query(customersRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        allData = snapshot.docs.map(mapCustomerData);
      } else if (user?.assignedShops?.length > 0) {
        // If no shop selected but user has shops, load from all assigned shops
        for (const shop of user.assignedShops) {
          const customersRef = collection(db, 'shops', shop.shopId, 'customers');
          const q = query(customersRef, orderBy('createdAt', 'desc'));
          const snapshot = await getDocs(q);
          const shopCustomers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            shopId: shop.shopId,
            shopName: shop.shopName
          }));
          allData = [...allData, ...shopCustomers];
        }
      }

      setAllCustomers(allData);
      updateDisplayedCustomers(allData);
    } catch (err) {
      console.error("Error fetching customers: ", err);
      setFormError("Failed to load customers. Please check your permissions.");
    } finally {
      setLoading(false);
    }
  }, [currentShopId, isRootAdmin, user]);

  // Update displayed customers based on filters and pagination
  const updateDisplayedCustomers = useCallback((customersData) => {
    const filtered = applyClientSideFilters(customersData || allCustomers);
    
    // Calculate pagination
    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const paged = filtered.slice(startIndex, endIndex);
    
    setCustomers(paged);
  }, [allCustomers, applyClientSideFilters, page]);

  // Load initial data
  useEffect(() => {
    loadAllCustomers();
    
    const fetchTrackingCompanies = async () => {
      try {
        const companiesSnapshot = await getDocs(collection(db, 'trackingCompanies'));
        setTrackingCompanies(companiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error('Error fetching tracking companies:', err);
      }
    };
    fetchTrackingCompanies();
  }, [loadAllCustomers]);

  // Update displayed customers when filters, search, or page changes
  useEffect(() => {
    updateDisplayedCustomers();
  }, [updateDisplayedCustomers, searchTerm, page]);

  // Reload when shop context changes
  useEffect(() => {
    if (shopContext) {
      setPage(1); // Reset to first page
      loadAllCustomers();
    }
  }, [shopContext?.shopId]); // Only reload when shopId changes

  // Apply filters - ALWAYS reset to page 1
  const handleApplyFilters = () => {
    setActiveFilters({ ...filters });
    setPage(1);
    updateDisplayedCustomers();
  };
  
  // Reset filters
  const handleResetFilters = () => {
    const resetFilters = {
      tag: 'all',
      dateFrom: null,
      dateTo: null,
      hasPhone: 'all',
      hasAddress: 'all',
      searchText: ''
    };
    setFilters(resetFilters);
    setActiveFilters({});
    setPage(1);
    updateDisplayedCustomers();
  };

  // Search handler - reset to page 1
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  // Pagination handlers
  const totalFilteredCustomers = applyClientSideFilters(allCustomers).length;
  const totalPages = Math.ceil(totalFilteredCustomers / PAGE_SIZE);
  const isLastPage = page >= totalPages;

  const handleNextPage = () => {
    if (!isLastPage) {
      setPage(p => p + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(p => p - 1);
    }
  };

  const handleInitiateTagChange = (customerId, newTag, currentTag) => {
    if (newTag === currentTag) return;
    const customerToUpdate = customers.find(c => c.id === customerId);
    setTagChangeInfo({ 
      customerId, 
      newTag, 
      shopId: customerToUpdate.shopId,
      customerName: `${customerToUpdate.firstName} ${customerToUpdate.lastName}`
    });
  };

  const handleConfirmTagChange = async () => {
    if (!tagChangeInfo) return;
    const { customerId, newTag, shopId } = tagChangeInfo;
    
    try {
      const customerDocRef = doc(db, 'shops', shopId, 'customers', customerId);
      await updateDoc(customerDocRef, { 
        tags: [newTag],
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setAllCustomers(prev => prev.map(c => 
        c.id === customerId ? { ...c, tags: [newTag] } : c
      ));
      setCustomers(prev => prev.map(c => 
        c.id === customerId ? { ...c, tags: [newTag] } : c
      ));
      
      setFormError(''); // Clear any previous errors
    } catch (error) {
      console.error("Error updating tag:", error);
      setFormError("Could not update the tag. Please check your permissions.");
    } finally {
      setTagChangeInfo(null);
    }
  };

  const handleCancelTagChange = () => {
    setTagChangeInfo(null);
  };
  
  const handleAddCustomerSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentShopId) {
      setFormError('Please select a shop first.');
      return;
    }
    
    if (!newCustomer.firstName || !newCustomer.email) { 
      setFormError('Name and email required.'); 
      return; 
    }
    
    try {
      const customerData = { 
        ...newCustomer, 
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        tags: ['New'],
        addedBy: userId,
        addedByName: user.displayName || user.email
      };
      
      const customersRef = collection(db, 'shops', currentShopId, 'customers');
      await addDoc(customersRef, customerData);
      
      setIsAdding(false); 
      setNewCustomer({}); 
      setFormError('');
      loadAllCustomers();
    } catch (e) { 
      console.error('Error adding customer:', e);
      setFormError('Error adding customer. Please check your permissions.');
    }
  };

  const handleQuickAdd = async (data) => {
    if (!currentShopId) {
      setFormError('Please select a shop first.');
      return;
    }
    
    try {
      const customerData = { 
        ...data, 
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        tags: ['New'],
        addedBy: userId,
        addedByName: user.displayName || user.email
      };
      
      const customersRef = collection(db, 'shops', currentShopId, 'customers');
      await addDoc(customersRef, customerData);
      
      setFormError('');
      loadAllCustomers();
    } catch (e) { 
      console.error('Error adding customer:', e);
      setFormError('Error adding customer. Please check your permissions.');
    }
  };

  const handleDeleteClick = async (ids) => {
    const idsToDelete = Array.isArray(ids) ? ids : [ids];
    if (!window.confirm(`Delete ${idsToDelete.length} customer(s)?`)) return;
    
    try {
      const deletePromises = idsToDelete.map(id => {
        const customerToDelete = allCustomers.find(c => c.id === id);
        if (!customerToDelete || !customerToDelete.shopId) {
          throw new Error(`Cannot find shop for customer ID ${id}`);
        }
        return deleteDoc(doc(db, 'shops', customerToDelete.shopId, 'customers', id));
      });
      
      await Promise.all(deletePromises);
      loadAllCustomers();
      setSelectedIds([]);
      setFormError('');
    } catch (e) {
      setFormError('Error deleting customer(s). Please check your permissions.');
      console.error(e);
    }
  };
  
  const handleSaveClick = async (cust) => {
    const { id, shopId, shopName, ...dataToSave } = cust;
    
    if (!shopId) {
      setFormError('Cannot update customer: Shop information missing.');
      return;
    }
    
    try {
      await updateDoc(doc(db, 'shops', shopId, 'customers', id), { 
        ...dataToSave, 
        updatedAt: serverTimestamp() 
      });
      
      // Update local state
      setAllCustomers(p => p.map(c => c.id === id ? { ...cust, updatedAt: new Date() } : c));
      setCustomers(p => p.map(c => c.id === id ? { ...cust, updatedAt: new Date() } : c));
      setFormError('');
    } catch (error) {
      setFormError('Error updating customer. Please check your permissions.');
      console.error('Error updating customer:', error);
    }
  };

  const handleBulkExport = () => {
    if (selectedIds.length === 0) return;
    const dataToExport = allCustomers.filter(c => selectedIds.includes(c.id));
    exportCSV(dataToExport, `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    setSelectedIds([]);
  };

  const handleBulkTag = async (newTag) => {
    if (selectedIds.length === 0) return;
    
    try {
      const updatePromises = selectedIds.map(id => {
        const customer = allCustomers.find(c => c.id === id);
        if (!customer || !customer.shopId) return Promise.resolve();
        
        return updateDoc(
          doc(db, 'shops', customer.shopId, 'customers', id), 
          { 
            tags: [newTag],
            updatedAt: serverTimestamp()
          }
        );
      });
      
      await Promise.all(updatePromises);
      loadAllCustomers();
      setSelectedIds([]);
      setFormError('');
    } catch (error) {
      setFormError('Error updating tags. Please check your permissions.');
      console.error('Error bulk tagging:', error);
    }
  };

  return (
    <div className="p-4">
      {/* Tag Change Confirmation Modal */}
      {tagChangeInfo && (
        <TagChangeConfirmModal
          isOpen={!!tagChangeInfo}
          onClose={handleCancelTagChange}
          onConfirm={handleConfirmTagChange}
          customerName={tagChangeInfo.customerName}
          newTag={tagChangeInfo.newTag}
        />
      )}

      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Customer Management</h2>
        {currentShopId && shopContext && (
          <div className="text-sm text-gray-600">
            Managing customers for: <span className="font-semibold">{shopContext.shopName}</span>
          </div>
        )}
        {!currentShopId && !isRootAdmin && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            Please select a shop to manage customers.
          </div>
        )}
      </div>

      {/* Form Error */}
      {formError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-700">
          {formError}
        </div>
      )}

      {/* Controls */}
      <div className="mb-4">
        <CustomerControlsDisclosure
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          selectedIds={selectedIds}
          onBulkDelete={() => handleDeleteClick(selectedIds)}
          onBulkExport={handleBulkExport}
          onBulkTag={handleBulkTag}
          tags={availableTags}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
            <div className="text-sm text-gray-600">
              Total customers: {allCustomers.length}
              {Object.keys(activeFilters).length > 0 && ' (filtered)'}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowFilters(!showFilters)} 
                type="button" 
                className="bg-gray-200 text-gray-700 font-semibold py-2 px-5 rounded-lg hover:bg-gray-300 transition shadow-sm"
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
              <button 
                onClick={() => setIsAdding(!isAdding)} 
                type="button" 
                className="bg-blue-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-blue-700 transition shadow-sm"
                disabled={!currentShopId && !isRootAdmin}
              >
                {isAdding ? 'Close Form' : 'Add New Customer'}
              </button>
            </div>
          </div>
          
          {showFilters && (
            <CustomerFilters
              filters={filters}
              setFilters={setFilters}
              tags={availableTags}
              onApplyFilters={handleApplyFilters}
              onResetFilters={handleResetFilters}
            />
          )}
        </CustomerControlsDisclosure>
      </div>

      {/* Add Customer Form */}
      {isAdding && (
        <CustomerForm 
          newCustomer={newCustomer} 
          trackingCompanies={trackingCompanies} 
          handleNewCustomerChange={e => setNewCustomer(prev => ({ 
            ...prev, 
            [e.target.name]: e.target.value 
          }))} 
          handleAddCustomerSubmit={handleAddCustomerSubmit} 
          formError={formError}
        />
      )}

      {/* Customer List */}
      {loading && allCustomers.length === 0 ? (
        <div className="text-center py-10">Loading customers...</div>
      ) : (
        <>
          <CustomerList
            customers={customers}
            trackingCompanies={trackingCompanies}
            handleSaveClick={handleSaveClick}
            handleDeleteClick={handleDeleteClick}
            handleAddQuick={handleQuickAdd}
            handleBulkDelete={handleDeleteClick}
            handleBulkExport={handleBulkExport}
            handleBulkTag={handleBulkTag}
            handleInitiateTagChange={handleInitiateTagChange} 
          />
          
          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              {Object.keys(activeFilters).length > 0 && (
                <span className="font-medium">Filters applied • </span>
              )}
              {searchTerm && (
                <span className="font-medium">Searching • </span>
              )}
              Showing {customers.length} of {totalFilteredCustomers} customers
              {shopContext && (
                <span className="text-gray-500"> • {shopContext.shopName}</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={handlePrevPage} 
                disabled={page <= 1 || loading} 
                className="flex items-center gap-2 bg-white text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-100 transition border border-gray-300 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-sm text-gray-700 font-medium">
                Page {page} of {totalPages || 1}
              </span>
              <button 
                onClick={handleNextPage} 
                disabled={isLastPage || loading} 
                className="flex items-center gap-2 bg-white text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-100 transition border border-gray-300 disabled:opacity-50"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerSection;