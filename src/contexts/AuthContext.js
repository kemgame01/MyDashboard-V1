// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { permissionService, debugUserPermissions } from '../services/permissionService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribeFirestore = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      console.log('[AuthContext] Auth state changed:', authUser?.email);
      
      if (authUser) {
        try {
          // Get initial user data
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const mergedUser = {
              ...authUser,
              ...userData,
              uid: authUser.uid,
              id: authUser.uid, // Ensure both uid and id are set
              email: authUser.email,
              displayName: userData.displayName || authUser.displayName,
              isRootAdmin: userData.isRootAdmin === true, // Explicit boolean check
              role: userData.role || 'viewer',
              assignedShops: userData.assignedShops || [],
              currentShop: userData.currentShop || null
            };

            console.log('[AuthContext] User data loaded:', {
              uid: mergedUser.uid,
              email: mergedUser.email,
              isRootAdmin: mergedUser.isRootAdmin,
              role: mergedUser.role,
              assignedShopsCount: mergedUser.assignedShops.length
            });

            setUser(mergedUser);

            // Debug permissions in development
            if (process.env.NODE_ENV === 'development') {
              await debugUserPermissions(mergedUser);
            }

            // Subscribe to real-time updates
            unsubscribeFirestore = onSnapshot(
              doc(db, 'users', authUser.uid),
              (doc) => {
                if (doc.exists()) {
                  const updatedData = doc.data();
                  const updatedUser = {
                    ...authUser,
                    ...updatedData,
                    uid: authUser.uid,
                    id: authUser.uid,
                    email: authUser.email,
                    displayName: updatedData.displayName || authUser.displayName,
                    isRootAdmin: updatedData.isRootAdmin === true,
                    role: updatedData.role || 'viewer',
                    assignedShops: updatedData.assignedShops || [],
                    currentShop: updatedData.currentShop || null
                  };

                  console.log('[AuthContext] User data updated:', {
                    uid: updatedUser.uid,
                    isRootAdmin: updatedUser.isRootAdmin,
                    changedFields: Object.keys(updatedData).filter(
                      key => JSON.stringify(mergedUser[key]) !== JSON.stringify(updatedData[key])
                    )
                  });

                  setUser(updatedUser);
                  // Clear permission cache on user update
                  permissionService.clearCache(authUser.uid);
                }
              },
              (error) => {
                console.error('[AuthContext] Firestore subscription error:', error);
                setError(error.message);
              }
            );
          } else {
            // New user - create with default viewer role
            console.log('[AuthContext] New user detected, creating default profile');
            const defaultUser = {
              ...authUser,
              uid: authUser.uid,
              id: authUser.uid,
              email: authUser.email,
              displayName: authUser.displayName || authUser.email,
              isRootAdmin: false,
              role: 'viewer',
              assignedShops: [],
              currentShop: null,
              createdAt: new Date()
            };
            setUser(defaultUser);
          }
        } catch (error) {
          console.error('[AuthContext] Error loading user data:', error);
          setError(error.message);
          // Set basic user data even if Firestore fails
          setUser({
            ...authUser,
            uid: authUser.uid,
            id: authUser.uid,
            isRootAdmin: false,
            role: 'viewer',
            assignedShops: []
          });
        }
      } else {
        console.log('[AuthContext] User logged out');
        setUser(null);
        permissionService.clearCache();
      }
      
      setLoading(false);
    });

    // Cleanup
    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, []);

  const value = {
    user,
    loading,
    error,
    // Helper functions
    isRootAdmin: user?.isRootAdmin === true,
    isShopOwner: user?.assignedShops?.some(shop => shop.isOwner) || false,
    refreshUser: async () => {
      if (user?.uid) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const refreshedUser = {
            ...user,
            ...userData,
            isRootAdmin: userData.isRootAdmin === true
          };
          setUser(refreshedUser);
          permissionService.clearCache(user.uid);
          console.log('[AuthContext] User manually refreshed');
        }
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};