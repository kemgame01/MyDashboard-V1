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
import { filterByShopAccess, addShopFilter } from '../../utils/shopPermissions';

const PAGE_SIZE = 15;

const CustomerSection = ({ userId, user, shopContext }) => { 
  const [customers, setCustomers] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]); // Store all customers for filtering
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
  
  const isAdmin = useMemo(() => user?.role === 'admin' || user?.isRootAdmin === true, [user]);
  
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
    ownerId: doc.ref.parent.parent.id,
  });
  
  // Client-side filtering function
  const applyClientSideFilters = useCallback((customers) => {
    let filtered = customers;
    
    // Apply shop-based filtering for non-admins
    if (!isAdmin) {
      filtered = filterByShopAccess(filtered, user, 'shopId');
    }
    
    return filtered.filter(customer => {
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
  }, [activeFilters, isAdmin, user, searchTerm]);

  // Load all customers initially
  const loadAllCustomers = useCallback(async () => {
    if (!userId && !isAdmin) return;
    
    setLoading(true);
    try {
      let baseQuery;
      if (isAdmin) {
        baseQuery = query(collectionGroup(db, 'customers'), orderBy('createdAt', 'desc'));
      } else {
        baseQuery = query(collection(db, 'users', userId, 'customers'), orderBy('createdAt', 'desc'));
      }
      
      // Apply shop filter if needed
      if (!isAdmin && shopContext?.shopId) {
        baseQuery = addShopFilter(baseQuery, user, 'shopId') || baseQuery;
      }
      
      const snapshot = await getDocs(baseQuery);
      const allData = snapshot.docs.map(mapCustomerData);
      setAllCustomers(allData);
      
      // Apply filters and pagination
      updateDisplayedCustomers(allData);
    } catch (err) {
      console.error("Error fetching customers: ", err);
      setFormError("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  }, [userId, isAdmin, shopContext, user]);

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
      const companiesSnapshot = await getDocs(collection(db, 'trackingCompanies'));
      setTrackingCompanies(companiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
      loadAllCustomers();
    }
  }, [shopContext, loadAllCustomers]);

  // Apply filters - ALWAYS reset to page 1
  const handleApplyFilters = () => {
    setActiveFilters({ ...filters });
    setPage(1); // Reset to page 1
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
    setPage(1); // Reset to page 1
    updateDisplayedCustomers();
  };

  // Search handler - reset to page 1
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPage(1); // Reset to page 1 when searching
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
    setTagChangeInfo({ customerId, newTag, ownerId: customerToUpdate.ownerId });
  };

  const handleConfirmTagChange = async () => {
    if (!tagChangeInfo) return;
    const { customerId, newTag, ownerId } = tagChangeInfo;
    const owner = isAdmin && ownerId ? ownerId : userId;
    try {
      const customerDocRef = doc(db, 'users', owner, 'customers', customerId);
      await updateDoc(customerDocRef, { tags: [newTag] });
      
      // Update local state
      setAllCustomers(prev => prev.map(c => c.id === customerId ? { ...c, tags: [newTag] } : c));
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, tags: [newTag] } : c));
    } catch (error) {
      console.error("Error updating tag:", error);
      setFormError("Could not update the tag. Please try again.");
    } finally {
      setTagChangeInfo(null);
    }
  };

  const handleCancelTagChange = () => {
    setTagChangeInfo(null);
  };
  
  const handleAddCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!newCustomer.firstName || !newCustomer.email) { 
      setFormError('Name and email required.'); 
      return; 
    }
    
    try {
      const customerData = { 
        ...newCustomer, 
        createdAt: serverTimestamp(), 
        tags: ['New'],
        shopId: shopContext?.shopId || null
      };
      
      await addDoc(collection(db, 'users', userId, 'customers'), customerData);
      setIsAdding(false); 
      setNewCustomer({}); 
      loadAllCustomers();
    } catch (e) { 
      setFormError('Error adding customer.') 
    }
  };

  const handleQuickAdd = async (data) => {
    try {
      const customerData = { 
        ...data, 
        createdAt: serverTimestamp(), 
        tags: ['New'],
        shopId: shopContext?.shopId || null
      };
      
      await addDoc(collection(db, 'users', userId, 'customers'), customerData);
      loadAllCustomers();
    } catch (e) { 
      setFormError('Error adding customer.') 
    }
  };

  const handleDeleteClick = async (ids) => {
    const idsToDelete = Array.isArray(ids) ? ids : [ids];
    if (!window.confirm(`Delete ${idsToDelete.length} item(s)?`)) return;
    try {
      const deletePromises = idsToDelete.map(id => {
        const customerToDelete = allCustomers.find(c => c.id === id);
        const owner = isAdmin && customerToDelete.ownerId ? customerToDelete.ownerId : userId;
        if (!owner) throw new Error(`Cannot find owner for customer ID ${id}`);
        return deleteDoc(doc(db, 'users', owner, 'customers', id));
      });
      await Promise.all(deletePromises);
      loadAllCustomers();
      setSelectedIds([]);
    } catch (e) {
      setFormError('Error deleting customer(s).');
      console.error(e);
    }
  };
  
  const handleSaveClick = async (cust) => {
    const { id, ownerId, ...dataToSave } = cust;
    const owner = isAdmin && ownerId ? ownerId : userId;
    
    if (shopContext?.shopId && !dataToSave.shopId) {
      dataToSave.shopId = shopContext.shopId;
    }
    
    try {
      await updateDoc(doc(db, 'users', owner, 'customers', id), { 
        ...dataToSave, 
        updatedAt: serverTimestamp() 
      });
      
      // Update local state
      setAllCustomers(p => p.map(c => c.id === id ? cust : c));
      setCustomers(p => p.map(c => c.id === id ? cust : c));
    } catch (e) { 
      setFormError('Error saving.'); 
    }
  };

  const handleBulkTag = async(ids, tag) => {
    try {
      const tagPromises = ids.map(id => {
        const customerToTag = allCustomers.find(c => c.id === id);
        const owner = isAdmin && customerToTag.ownerId ? customerToTag.ownerId : userId;
        if (!owner) throw new Error(`Cannot find owner for customer ID ${id}`);
        return updateDoc(doc(db, 'users', owner, 'customers', id), { tags: [tag] });
      });
      await Promise.all(tagPromises);
      
      // Update local state
      setAllCustomers(p => p.map(c => ids.includes(c.id) ? {...c, tags: [tag]} : c));
      setCustomers(p => p.map(c => ids.includes(c.id) ? {...c, tags: [tag]} : c));
      setSelectedIds([]);
    } catch(e) {
      setFormError("Error tagging.");
      console.error(e);
    }
  };

  const handleBulkExport = (ids) => {
    const rows = allCustomers.filter(c => ids.includes(c.id));
    exportCSV("customers.csv", rows);
  };

  return (
    <div className="p-4 sm:p-6">
      <TagChangeConfirmModal tagChangeInfo={tagChangeInfo} onConfirm={handleConfirmTagChange} onCancel={handleCancelTagChange} />
      
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Customers</h2>
        {shopContext && (
          <p className="text-gray-600 text-sm">
            Managing customers for: <span className="font-semibold">{shopContext.shopName}</span>
          </p>
        )}
      </div>
      
      <div className="mb-4">
        <CustomerControlsDisclosure>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center mb-4">
            <input 
              id="customer-search" 
              type="text" 
              value={searchTerm} 
              onChange={e => handleSearchChange(e.target.value)} 
              placeholder="Quick search all customers..." 
              className="px-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <div className="flex justify-start md:justify-end gap-2">
              <button 
                onClick={() => setShowFilters(!showFilters)} 
                type="button" 
                className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition shadow-sm"
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
              <button 
                onClick={() => setIsAdding(!isAdding)} 
                type="button" 
                className="bg-blue-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-blue-700 transition shadow-sm"
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