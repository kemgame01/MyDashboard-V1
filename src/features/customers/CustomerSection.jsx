// src/features/customers/CustomerSection.jsx
// Fixed version that keeps your existing modal logic

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection, query, orderBy, limit, getDocs, addDoc, 
  updateDoc, deleteDoc, doc, serverTimestamp, collectionGroup
} from 'firebase/firestore';
import { db } from '../../firebase';
import CustomerList from './CustomerList';
import CustomerEditModal from './CustomerEditModal'; // Your existing modal
import CustomerForm from './CustomerForm';
import CustomerFilters from './CustomerFilters';
import TagChangeConfirmModal from './TagChangeConfirmModal';
import { exportCSV } from '../../utils/exportCSV';
import { ChevronLeft, ChevronRight, Store, AlertCircle } from 'lucide-react';
import '../../styles/CustomerSection.css'; // ONLY CHANGE - Added CSS import

const PAGE_SIZE = 20; // Match your CustomerList itemsPerPage

const CustomerSection = ({ userId, user, shopContext }) => {
  const [customers, setCustomers] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [trackingCompanies, setTrackingCompanies] = useState([]);
  const [newCustomer, setNewCustomer] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [formError, setFormError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Debounce search term for smooth searching
  useEffect(() => {
    if (searchTerm) {
      setSearching(true);
    }
    
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setSearching(false);
    }, 200); // 200ms delay for more responsive feel

    return () => clearTimeout(timer);
  }, [searchTerm]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [tagChangeInfo, setTagChangeInfo] = useState(null);
  const [isChangingTags, setIsChangingTags] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal state for editing
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  
  // Filters state
  const [filters, setFilters] = useState({
    tag: 'all',
    dateFrom: null,
    dateTo: null,
    hasPhone: 'all',
    hasAddress: 'all',
    searchText: ''
  });
  
  const [activeFilters, setActiveFilters] = useState({});
  
  // Permission checks
  const isRootAdmin = user?.isRootAdmin === true;
  const isAdmin = user?.role === 'admin' || user?.globalRole === 'admin' || isRootAdmin;
  const isManager = user?.role === 'manager' || user?.globalRole === 'manager';
  const isSales = user?.role === 'sales' || user?.globalRole === 'sales';
  
  const canEdit = isRootAdmin || isAdmin || isManager || isSales;
  const canDelete = isRootAdmin || isAdmin;
  
  // Get unique tags - ensure consistent tag list
  const availableTags = useMemo(() => {
    return ['New', 'Active', 'Inactive', 'VIP', 'Blocked'];
  }, []);

  const mapCustomerData = (doc) => ({
    id: doc.id,
    ...doc.data(),
    ownerId: doc.ref.parent.parent?.id || userId,
  });
  
  // Apply filters
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
      
      // Text search in filters
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
      
      // Quick search - optimized for performance
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        
        // Check each field individually for better performance
        const matchesSearch = 
          (customer.firstName && customer.firstName.toLowerCase().includes(searchLower)) ||
          (customer.lastName && customer.lastName.toLowerCase().includes(searchLower)) ||
          (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
          (customer.phoneNumber && customer.phoneNumber.includes(searchLower)) ||
          (customer.company && customer.company.toLowerCase().includes(searchLower)) ||
          (customer.address && customer.address.toLowerCase().includes(searchLower)) ||
          (customer.trackingCode && customer.trackingCode.toLowerCase().includes(searchLower)) ||
          (customer.trackingCompany && customer.trackingCompany.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }
      
      return true;
    });
  }, [activeFilters, debouncedSearchTerm]);

  // Load all customers
  const loadAllCustomers = useCallback(async () => {
    if (!userId && !isAdmin) {
      setFormError("No user context available");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setFormError('');
    
    try {
      let allData = [];
      
      if (isAdmin) {
        // Admin sees all customers from all users
        const snapshot = await getDocs(
          query(collectionGroup(db, 'customers'), orderBy('createdAt', 'desc'))
        );
        allData = snapshot.docs.map(mapCustomerData);
      } else {
        // Regular user sees only their customers
        const snapshot = await getDocs(
          query(collection(db, 'users', userId, 'customers'), orderBy('createdAt', 'desc'))
        );
        allData = snapshot.docs.map(mapCustomerData);
      }
      
      setAllCustomers(allData);
      
      // Apply filters and set displayed customers
      const filtered = applyClientSideFilters(allData);
      setCustomers(filtered);
      
    } catch (err) {
      console.error("Error fetching customers: ", err);
      setFormError("Failed to load customers. Please check your permissions.");
    } finally {
      setLoading(false);
    }
  }, [userId, isAdmin, applyClientSideFilters]);

  // Load data on mount
  useEffect(() => {
    loadAllCustomers();
    fetchTrackingCompanies();
  }, [loadAllCustomers]);

  // Update displayed customers when filters change
  useEffect(() => {
    // Use requestAnimationFrame for smoother updates
    const frameId = requestAnimationFrame(() => {
      const filtered = applyClientSideFilters(allCustomers);
      setCustomers(filtered);
    });
    
    return () => cancelAnimationFrame(frameId);
  }, [allCustomers, activeFilters, debouncedSearchTerm, applyClientSideFilters]);

  // Fetch tracking companies
  const fetchTrackingCompanies = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'trackingCompanies'));
      const companies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTrackingCompanies(companies);
    } catch (err) {
      console.error("Error fetching tracking companies: ", err);
    }
  };

  // Handle edit click - open modal
  const handleEditClick = (customer) => {
    setEditingCustomer(customer);
    setEditModalOpen(true);
  };

  // Handle save from modal
  const handleSaveClick = async (updatedCustomer) => {
    if (!canEdit) {
      alert("You don't have permission to edit customers");
      return;
    }
    
    try {
      const { id, ownerId, ...dataToSave } = updatedCustomer;
      const owner = isAdmin && ownerId ? ownerId : userId;
      const docRef = doc(db, 'users', owner, 'customers', id);
      
      await updateDoc(docRef, {
        ...dataToSave,
        updatedAt: serverTimestamp()
      });
      
      await loadAllCustomers();
      setEditModalOpen(false);
      setEditingCustomer(null);
    } catch (err) {
      console.error('Error updating customer:', err);
      alert('Failed to update customer: ' + err.message);
    }
  };

  // Handle delete
  const handleDeleteClick = async (ids) => {
    if (!canDelete) {
      alert("You don't have permission to delete customers");
      return;
    }
    
    const idsArray = Array.isArray(ids) ? ids : [ids];
    if (!window.confirm(`Delete ${idsArray.length} customer(s)?`)) return;
    
    try {
      for (const id of idsArray) {
        const customer = allCustomers.find(c => c.id === id);
        if (customer) {
          const owner = isAdmin && customer.ownerId ? customer.ownerId : userId;
          const docRef = doc(db, 'users', owner, 'customers', id);
          await deleteDoc(docRef);
        }
      }
      setSelectedIds([]);
      await loadAllCustomers();
    } catch (err) {
      console.error('Error deleting customers:', err);
      alert('Failed to delete customers');
    }
  };

  // Handle quick add
  const handleAddQuick = async (customerData) => {
    try {
      const data = {
        ...customerData,
        createdAt: serverTimestamp(),
        tags: ['New']
      };
      
      await addDoc(collection(db, 'users', userId, 'customers'), data);
      await loadAllCustomers();
    } catch (err) {
      console.error('Error adding customer:', err);
      setFormError('Error adding customer: ' + err.message);
    }
  };

  // Bulk operations
  const handleBulkExport = () => {
    const selectedCustomers = allCustomers.filter(c => selectedIds.includes(c.id));
    exportCSV(selectedCustomers, 'customers_export');
  };

  const handleBulkDelete = (ids) => {
    handleDeleteClick(ids);
  };

  const handleBulkTag = (selectedIds, tag) => {
    if (!tag) return;
    setTagChangeInfo({ ids: selectedIds, newTag: tag });
  };

  const handleInitiateTagChange = (customerId, newTag, oldTag) => {
    // Don't trigger if selecting the same tag
    if (newTag === oldTag) return;
    
    // Allow empty string to remove tags
    setTagChangeInfo({ ids: [customerId], newTag });
  };

  const handleConfirmTagChange = async () => {
    if (!tagChangeInfo || !canEdit || isChangingTags) return;
    
    setIsChangingTags(true);
    
    try {
      for (const id of tagChangeInfo.ids) {
        const customer = allCustomers.find(c => c.id === id);
        if (customer) {
          const owner = isAdmin && customer.ownerId ? customer.ownerId : userId;
          const docRef = doc(db, 'users', owner, 'customers', id);
          
          // FIXED: Replace tag instead of adding to array
          // If newTag is empty, set empty array to remove all tags
          const updatedTags = tagChangeInfo.newTag ? [tagChangeInfo.newTag] : [];
          
          await updateDoc(docRef, { 
            tags: updatedTags,
            updatedAt: serverTimestamp()
          });
        }
      }
      
      setTagChangeInfo(null);
      setSelectedIds([]);
      await loadAllCustomers();
    } catch (err) {
      console.error('Error updating tags:', err);
      alert('Failed to update tags');
    } finally {
      setIsChangingTags(false);
    }
  };

  // Filters
  const handleApplyFilters = () => {
    setActiveFilters(filters);
  };

  const handleResetFilters = () => {
    setFilters({
      tag: 'all',
      dateFrom: null,
      dateTo: null,
      hasPhone: 'all',
      hasAddress: 'all',
      searchText: ''
    });
    setActiveFilters({});
  };

  return (
    <div className="customer-container">
      <div className="customer-header">
        <h1 className="customer-title">Customer Controls</h1>
        <p className="customer-subtitle">
          {shopContext ? `Managing customers for ${shopContext.shopName}` : 'Managing all customers'}
        </p>
      </div>

      {/* Shop Context Info */}
      {!isAdmin && shopContext && (
        <div className="customer-info-box">
          <Store className="w-4 h-4" />
          <p className="customer-info-text">
            Managing customers for: <strong>{shopContext.shopName}</strong>
          </p>
        </div>
      )}

      {/* Error Display */}
      {formError && (
        <div className="customer-error">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{formError}</p>
        </div>
      )}

      {/* Customer List with built-in controls */}
      {loading ? (
        <div className="customer-loading">
          <div className="customer-spinner"></div>
          <p>Loading customers...</p>
        </div>
      ) : (
        <CustomerList
          customers={customers}
          trackingCompanies={trackingCompanies}
          handleSaveClick={handleEditClick} // This will open the modal
          handleDeleteClick={handleDeleteClick}
          handleAddQuick={handleAddQuick}
          handleBulkDelete={handleBulkDelete}
          handleBulkExport={handleBulkExport}
          handleBulkTag={handleBulkTag}
          handleInitiateTagChange={handleInitiateTagChange}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          searching={searching}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          filters={filters}
          setFilters={setFilters}
          handleApplyFilters={handleApplyFilters}
          handleResetFilters={handleResetFilters}
          availableTags={availableTags}
          isAdmin={isAdmin}
        />
      )}

      {/* Edit Modal */}
      <CustomerEditModal
        show={editModalOpen}
        customer={editingCustomer}
        trackingCompanies={trackingCompanies}
        onSave={handleSaveClick}
        onClose={() => {
          setEditModalOpen(false);
          setEditingCustomer(null);
        }}
      />

      {/* Tag Change Modal */}
      {tagChangeInfo && (
        <TagChangeConfirmModal
          isOpen={!!tagChangeInfo}
          onClose={() => !isChangingTags && setTagChangeInfo(null)}
          onConfirm={handleConfirmTagChange}
          selectedCount={tagChangeInfo.ids.length}
          newTag={tagChangeInfo.newTag}
          isLoading={isChangingTags}
        />
      )}
    </div>
  );
};

export default CustomerSection;