// src/utils/firestoreMigration.js
// Helper functions to migrate to denormalized structure and maintain sync

import { db } from '../firebase';
import { doc, setDoc, deleteDoc, writeBatch, collection, getDocs } from 'firebase/firestore';

/**
 * Migrate existing user data to denormalized structure
 * Run this once to migrate existing data
 */
export async function migrateUsersToDenormalizedStructure() {
  const batch = writeBatch(db);
  
  try {
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      // Create userRoles document
      const userRoleRef = doc(db, 'userRoles', userId);
      batch.set(userRoleRef, {
        isRootAdmin: userData.isRootAdmin || false,
        globalRole: userData.role || 'viewer',
        email: userData.email,
        updatedAt: new Date()
      });
      
      // Create shopMembers documents for each shop assignment
      if (userData.assignedShops && userData.assignedShops.length > 0) {
        for (const assignment of userData.assignedShops) {
          const membershipId = `${assignment.shopId}_${userId}`;
          const memberRef = doc(db, 'shopMembers', membershipId);
          
          batch.set(memberRef, {
            userId: userId,
            userEmail: userData.email,
            userName: userData.displayName || userData.email,
            shopId: assignment.shopId,
            shopName: assignment.shopName,
            role: assignment.role,
            isOwner: assignment.isOwner || false,
            assignedAt: assignment.assignedAt || new Date(),
            assignedBy: assignment.assignedBy || 'migration',
            updatedAt: new Date()
          });
        }
      }
    }
    
    await batch.commit();
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Helper function to maintain sync when updating shop assignments
 * Use this instead of directly updating the user document
 */
export async function updateShopAssignment(userId, shopId, assignmentData) {
  const batch = writeBatch(db);
  
  try {
    // Update the denormalized shopMembers document
    const membershipId = `${shopId}_${userId}`;
    const memberRef = doc(db, 'shopMembers', membershipId);
    
    if (assignmentData === null) {
      // Remove assignment
      batch.delete(memberRef);
    } else {
      // Add or update assignment
      batch.set(memberRef, {
        userId: userId,
        shopId: shopId,
        ...assignmentData,
        updatedAt: new Date()
      }, { merge: true });
    }
    
    // Also update the user document to maintain compatibility
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDocs(userRef);
    const userData = userDoc.data();
    
    if (assignmentData === null) {
      // Remove from assignedShops array
      const updatedShops = userData.assignedShops.filter(s => s.shopId !== shopId);
      batch.update(userRef, {
        assignedShops: updatedShops,
        updatedAt: new Date()
      });
    } else {
      // Add or update in assignedShops array
      const existingIndex = userData.assignedShops.findIndex(s => s.shopId === shopId);
      const newAssignment = {
        shopId: shopId,
        shopName: assignmentData.shopName,
        role: assignmentData.role,
        isOwner: assignmentData.isOwner || false,
        assignedAt: assignmentData.assignedAt || new Date(),
        assignedBy: assignmentData.assignedBy
      };
      
      if (existingIndex >= 0) {
        userData.assignedShops[existingIndex] = newAssignment;
      } else {
        userData.assignedShops.push(newAssignment);
      }
      
      batch.update(userRef, {
        assignedShops: userData.assignedShops,
        updatedAt: new Date()
      });
    }
    
    await batch.commit();
  } catch (error) {
    console.error('Failed to update shop assignment:', error);
    throw error;
  }
}

/**
 * Helper to check permissions using denormalized structure
 */
export async function checkShopPermission(userId, shopId, requiredRole = null) {
  try {
    // Check if root admin
    const userRoleDoc = await getDocs(doc(db, 'userRoles', userId));
    if (userRoleDoc.exists() && userRoleDoc.data().isRootAdmin) {
      return true;
    }
    
    // Check shop membership
    const membershipId = `${shopId}_${userId}`;
    const memberDoc = await getDocs(doc(db, 'shopMembers', membershipId));
    
    if (!memberDoc.exists()) {
      return false;
    }
    
    const membership = memberDoc.data();
    
    // If no specific role required, just check membership
    if (!requiredRole) {
      return true;
    }
    
    // Check specific role
    const roleHierarchy = {
      'owner': 5,
      'admin': 4,
      'manager': 3,
      'staff': 2,
      'sales': 2,
      'viewer': 1
    };
    
    const userRoleLevel = roleHierarchy[membership.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
    
    return membership.isOwner || userRoleLevel >= requiredRoleLevel;
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
}

/**
 * Get all shops for a user using denormalized structure
 */
export async function getUserShopsFromDenormalized(userId) {
  try {
    const shops = [];
    
    // Query shopMembers where userId matches
    const membershipsSnapshot = await getDocs(collection(db, 'shopMembers'));
    
    membershipsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.userId === userId) {
        shops.push({
          shopId: data.shopId,
          shopName: data.shopName,
          role: data.role,
          isOwner: data.isOwner
        });
      }
    });
    
    return shops;
  } catch (error) {
    console.error('Failed to get user shops:', error);
    return [];
  }
}

/**
 * Update user role (Root Admin only)
 */
export async function updateUserGlobalRole(userId, newRole, isRootAdmin = false) {
  const batch = writeBatch(db);
  
  try {
    // Update userRoles document
    const userRoleRef = doc(db, 'userRoles', userId);
    batch.set(userRoleRef, {
      globalRole: newRole,
      isRootAdmin: isRootAdmin,
      updatedAt: new Date()
    }, { merge: true });
    
    // Update users document
    const userRef = doc(db, 'users', userId);
    batch.update(userRef, {
      role: newRole,
      isRootAdmin: isRootAdmin,
      updatedAt: new Date()
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Failed to update user role:', error);
    throw error;
  }
}