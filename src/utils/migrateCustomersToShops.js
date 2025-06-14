// src/utils/customerMigration.js
import { db } from '../firebase';
import { 
  collection, 
  collectionGroup, 
  getDocs, 
  setDoc, 
  doc, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';

/**
 * Migrate customers from user subcollections to global collection
 * From: users/{userId}/customers/{customerId}
 * To: customers/{customerId} with shopId and createdBy fields
 */
export async function migrateCustomersToGlobalCollection() {
  console.log('Starting customer migration...');
  
  try {
    // Get all customers from all user subcollections
    const customersSnapshot = await getDocs(collectionGroup(db, 'customers'));
    console.log(`Found ${customersSnapshot.size} customers to migrate`);
    
    if (customersSnapshot.empty) {
      console.log('No customers found to migrate');
      return { success: true, migrated: 0 };
    }
    
    let batch = writeBatch(db);
    let batchCount = 0;
    let totalMigrated = 0;
    
    for (const customerDoc of customersSnapshot.docs) {
      const customerData = customerDoc.data();
      const customerId = customerDoc.id;
      const userId = customerDoc.ref.parent.parent.id; // Get userId from path
      
      // Prepare new customer document
      const newCustomerData = {
        ...customerData,
        // Add new fields for global structure
        createdBy: userId, // User who created this customer
        assignedTo: userId, // Sales person managing this customer
        shopId: null, // Will be set based on user's current shop
        sharedWithShop: true, // By default, share with shop
        
        // Metadata
        migratedAt: serverTimestamp(),
        originalPath: `users/${userId}/customers/${customerId}`,
        
        // Ensure timestamps exist
        createdAt: customerData.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Get user data to determine shopId
      try {
        const userDoc = await getDocs(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Use user's current shop or first assigned shop
          const shopId = userData.currentShop || userData.assignedShops?.[0]?.shopId;
          if (shopId) {
            newCustomerData.shopId = shopId;
            newCustomerData.shopName = userData.assignedShops?.find(s => s.shopId === shopId)?.shopName;
          }
        }
      } catch (error) {
        console.warn(`Could not get user data for ${userId}:`, error);
      }
      
      // Add to batch
      const newCustomerRef = doc(db, 'customers', customerId);
      batch.set(newCustomerRef, newCustomerData);
      batchCount++;
      
      // Commit batch every 400 documents (Firestore limit is 500)
      if (batchCount >= 400) {
        await batch.commit();
        totalMigrated += batchCount;
        console.log(`Migrated ${totalMigrated} customers...`);
        
        // Start new batch
        batch = writeBatch(db);
        batchCount = 0;
      }
    }
    
    // Commit remaining documents
    if (batchCount > 0) {
      await batch.commit();
      totalMigrated += batchCount;
    }
    
    console.log(`Migration completed! Migrated ${totalMigrated} customers.`);
    return { success: true, migrated: totalMigrated };
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Check migration status
 */
export async function checkCustomerMigrationStatus() {
  try {
    // Check if global customers collection exists
    const globalCustomersSnapshot = await getDocs(collection(db, 'customers'));
    
    // Check if any users still have customers in subcollections
    const userCustomersSnapshot = await getDocs(collectionGroup(db, 'customers'));
    
    return {
      globalCustomersCount: globalCustomersSnapshot.size,
      userSubcollectionCount: userCustomersSnapshot.size,
      migrationNeeded: globalCustomersSnapshot.empty && !userCustomersSnapshot.empty,
      status: globalCustomersSnapshot.empty ? 'not_started' : 
              userCustomersSnapshot.empty ? 'completed' : 
              'partial'
    };
  } catch (error) {
    console.error('Error checking migration status:', error);
    return {
      globalCustomersCount: 0,
      userSubcollectionCount: 0,
      migrationNeeded: true,
      error: error.message
    };
  }
}

/**
 * Delete customer subcollections after successful migration
 * WARNING: Only run this after verifying migration success!
 */
export async function cleanupOldCustomerData() {
  if (!window.confirm('⚠️ WARNING: This will delete all customer subcollections. Make sure migration was successful! Continue?')) {
    return;
  }
  
  try {
    const customersSnapshot = await getDocs(collectionGroup(db, 'customers'));
    let deleted = 0;
    
    for (const doc of customersSnapshot.docs) {
      await doc.ref.delete();
      deleted++;
      
      if (deleted % 100 === 0) {
        console.log(`Deleted ${deleted} old customer documents...`);
      }
    }
    
    console.log(`Cleanup completed! Deleted ${deleted} old customer documents.`);
    return { success: true, deleted };
    
  } catch (error) {
    console.error('Cleanup failed:', error);
    throw error;
  }
}