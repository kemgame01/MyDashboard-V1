import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection, query, orderBy, limit, startAfter, endBefore, limitToLast,
  getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
  collectionGroup
} from 'firebase/firestore';
import { db } from '../../firebase';
import CustomerList from './CustomerList';
import CustomerForm from './CustomerForm';
import TagChangeConfirmModal from './TagChangeConfirmModal';
import { exportCSV } from '../../utils/exportCSV';
import CustomerControlsDisclosure from "./CustomerControlsDisclosure";
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 15;

const CustomerSection = ({ userId, user }) => { 
  const [customers, setCustomers] = useState([]);
  const [trackingCompanies, setTrackingCompanies] = useState([]);
  const [newCustomer, setNewCustomer] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [formError, setFormError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [tagChangeInfo, setTagChangeInfo] = useState(null);
  const [page, setPage] = useState(1);
  const [firstVisible, setFirstVisible] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [isLastPage, setIsLastPage] = useState(false);
  
  const isAdmin = useMemo(() => user?.role === 'admin' || user?.isRootAdmin === true, [user]);

  const customersQuery = useMemo(() => {
    if (isAdmin) {
      return query(collectionGroup(db, 'customers'), orderBy('createdAt', 'desc'));
    }
    if (userId) {
      return query(collection(db, 'users', userId, 'customers'), orderBy('createdAt', 'desc'));
    }
    return null;
  }, [userId, isAdmin]);

  const mapCustomerData = (doc) => ({
    id: doc.id,
    ...doc.data(),
    // For admins, we MUST know the parent user's ID to perform updates/deletes
    ownerId: doc.ref.parent.parent.id,
  });

  const loadInitialPage = useCallback(() => {
    if (!customersQuery) return;
    setLoading(true);
    const firstPageQuery = query(customersQuery, limit(PAGE_SIZE));
    
    getDocs(firstPageQuery).then(snapshot => {
      if (!snapshot.empty) {
        setCustomers(snapshot.docs.map(mapCustomerData));
        setFirstVisible(snapshot.docs[0]);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setIsLastPage(snapshot.docs.length < PAGE_SIZE);
        setPage(1);
      } else {
        setCustomers([]);
        setIsLastPage(true);
      }
    }).catch(err => {
      console.error("Error fetching initial page (Admins: Have you created the Firestore index?): ", err);
      setFormError("Failed to load customers. Admins may need to create a Firestore index.");
    }).finally(() => setLoading(false));
  }, [customersQuery]);

  useEffect(() => {
    if (customersQuery) {
        loadInitialPage();
    }
    const fetchTrackingCompanies = async () => {
      const companiesSnapshot = await getDocs(collection(db, 'trackingCompanies'));
      setTrackingCompanies(companiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchTrackingCompanies();
  }, [customersQuery, loadInitialPage]);

  const handleNextPage = async () => {
    if (!lastVisible || !customersQuery) return;
    setLoading(true);
    const nextPageQuery = query(customersQuery, startAfter(lastVisible), limit(PAGE_SIZE));
    try {
        const snapshot = await getDocs(nextPageQuery);
        if(!snapshot.empty) {
            setCustomers(snapshot.docs.map(mapCustomerData));
            setFirstVisible(snapshot.docs[0]);
            setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
            setIsLastPage(snapshot.docs.length < PAGE_SIZE);
            setPage(p => p + 1);
        } else { setIsLastPage(true); }
    } catch (err) { console.error("Error fetching next page: ", err); } 
    finally { setLoading(false); }
  };

  const handlePrevPage = async () => {
    if (!firstVisible || !customersQuery) return;
    setLoading(true);
    const prevPageQuery = query(customersQuery, endBefore(firstVisible), limitToLast(PAGE_SIZE));
    try {
        const snapshot = await getDocs(prevPageQuery);
        if(!snapshot.empty) {
            setCustomers(snapshot.docs.map(mapCustomerData));
            setFirstVisible(snapshot.docs[0]);
            setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
            setIsLastPage(false);
            setPage(p => p - 1);
        }
    } catch(err) { console.error("Error fetching previous page: ", err); }
    finally { setLoading(false); }
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
    if (!newCustomer.firstName || !newCustomer.email) { setFormError('Name and email required.'); return; }
    try {
      await addDoc(collection(db, 'users', userId, 'customers'), { ...newCustomer, createdAt: serverTimestamp(), tags: ['New'] });
      setIsAdding(false); setNewCustomer({}); loadInitialPage();
    } catch (e) { setFormError('Error adding customer.') }
  };

  const handleQuickAdd = async (data) => {
    try {
      await addDoc(collection(db, 'users', userId, 'customers'), { ...data, createdAt: serverTimestamp(), tags: ['New'] });
      loadInitialPage();
    } catch (e) { setFormError('Error adding customer.') }
  };

  const handleDeleteClick = async (ids) => {
    const idsToDelete = Array.isArray(ids) ? ids : [ids];
    if (!window.confirm(`Delete ${idsToDelete.length} item(s)?`)) return;
    try {
      const deletePromises = idsToDelete.map(id => {
        const customerToDelete = customers.find(c => c.id === id);
        const owner = isAdmin && customerToDelete.ownerId ? customerToDelete.ownerId : userId;
        if (!owner) throw new Error(`Cannot find owner for customer ID ${id}`);
        return deleteDoc(doc(db, 'users', owner, 'customers', id));
      });
      await Promise.all(deletePromises);
      loadInitialPage();
      setSelectedIds([]);
    } catch (e) {
      setFormError('Error deleting customer(s).');
      console.error(e);
    }
  };
  
  const handleSaveClick = async (cust) => {
    const { id, ownerId, ...dataToSave } = cust;
    const owner = isAdmin && ownerId ? ownerId : userId;
    try {
      await updateDoc(doc(db, 'users', owner, 'customers', id), { ...dataToSave, updatedAt: serverTimestamp() });
      setCustomers(p => p.map(c => c.id === id ? cust : c));
    } catch (e) { setFormError('Error saving.'); }
  };

  const handleBulkTag = async(ids, tag) => {
    try {
      const tagPromises = ids.map(id => {
        const customerToTag = customers.find(c => c.id === id);
        const owner = isAdmin && customerToTag.ownerId ? customerToTag.ownerId : userId;
        if (!owner) throw new Error(`Cannot find owner for customer ID ${id}`);
        return updateDoc(doc(db, 'users', owner, 'customers', id), { tags: [tag] });
      });
      await Promise.all(tagPromises);
      setCustomers(p => p.map(c => ids.includes(c.id) ? {...c, tags: [tag]} : c));
      setSelectedIds([]);
    } catch(e) {
      setFormError("Error tagging.");
      console.error(e);
    }
  };

  const handleBulkExport = (ids) => {
    const rows = customers.filter(c => ids.includes(c.id));
    exportCSV("customers.csv", rows);
  };

  const filteredCustomers = searchTerm ? customers.filter(c => Object.values(c).some(f => typeof f === 'string' && f.toLowerCase().includes(searchTerm.toLowerCase()))) : customers;

  return (
    <div className="p-4 sm:p-6">
      <TagChangeConfirmModal tagChangeInfo={tagChangeInfo} onConfirm={handleConfirmTagChange} onCancel={handleCancelTagChange} />
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Customers</h2>
      <div className="mb-4">
        <CustomerControlsDisclosure>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <input id="customer-search" type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search current page..." className="px-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex justify-start md:justify-end">
              <button onClick={() => setIsAdding(!isAdding)} type="button" className="bg-blue-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-blue-700 transition shadow-sm">{isAdding ? 'Close Form' : 'Add New Customer'}</button>
            </div>
          </div>
        </CustomerControlsDisclosure>
      </div>

      {isAdding && (<CustomerForm newCustomer={newCustomer} trackingCompanies={trackingCompanies} handleNewCustomerChange={e => setNewCustomer(prev => ({ ...prev, [e.target.name]: e.target.value }))} handleAddCustomerSubmit={handleAddCustomerSubmit} formError={formError}/>)}

      {loading && customers.length === 0 ? <div className="text-center py-10">Loading customers...</div> : (
        <>
          <CustomerList
            customers={filteredCustomers}
            trackingCompanies={trackingCompanies}
            handleSaveClick={handleSaveClick}
            handleDeleteClick={handleDeleteClick}
            handleAddQuick={handleQuickAdd}
            handleBulkDelete={handleDeleteClick}
            handleBulkExport={handleBulkExport}
            handleBulkTag={handleBulkTag}
            handleInitiateTagChange={handleInitiateTagChange} 
          />
          <div className="flex justify-end items-center mt-4 gap-4">
            <button onClick={handlePrevPage} disabled={page <= 1 || loading} className="flex items-center gap-2 bg-white text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-100 transition border border-gray-300 disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" /> {loading && page > 1 ? 'Loading...' : 'Previous'}
            </button>
            <span className="text-sm text-gray-700 font-medium">Page {page}</span>
            <button onClick={handleNextPage} disabled={isLastPage || loading} className="flex items-center gap-2 bg-white text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-100 transition border border-gray-300 disabled:opacity-50">
              {loading && page === 1 ? 'Loading...' : 'Next'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerSection;