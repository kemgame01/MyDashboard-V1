// src/services/authService.js

import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { setDoc, doc, collection, query, where, getDocs, orderBy, limit, deleteDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

// --- Signup ---
export const signupUser = async ({ email, password, name }) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name,
      email,
      role: 'user',
      isRootAdmin: false,
    });
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- Login ---
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- Logout ---
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- Fetch User Profile ---
export const fetchUserProfile = async (uid) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      return { uid, ...userSnap.data() };
    }
    return null;
  } catch (error) {
    return null;
  }
};

// --- Fetch Customers ---
export const fetchCustomers = async (searchField, searchValue) => {
  try {
    const usersCollection = collection(db, 'users');
    const userDocsSnapshot = await getDocs(usersCollection);

    let customers = [];
    for (const userDoc of userDocsSnapshot.docs) {
      const customersCollection = collection(db, 'users', userDoc.id, 'customers');
      const q = query(
        customersCollection,
        where(searchField, '==', searchValue),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        customers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        break;
      }
    }

    if (customers.length > 0) {
      return { success: true, customers };
    } else {
      return { success: false, message: 'No customers found with the provided information.' };
    }
  } catch (error) {
    console.error('Error fetching customers:', error.message);
    return { success: false, error: error.message };
  }
};

// --- Delete Customer ---
export const deleteCustomer = async (userId, customerId) => {
  try {
    const customerDocRef = doc(db, 'users', userId, 'customers', customerId);
    await deleteDoc(customerDocRef);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
