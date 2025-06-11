// src/utils/shopMigration.js
import { db } from '../firebase';
import { collection, getDocs, updateDoc, doc, addDoc, setDoc } from 'firebase/firestore';

export async function migrateUsersToShopSystem() {
  console.log('Starting user migration to shop system...');
  
  try {
    // Step 1: Create default shop if it doesn't exist
    const defaultShop = {
      shopName: 'Whey อร่อยดี',
      address: 'Bangkok, Thailand',
      phone: '+66 xxx xxx xxx',
      email: 'shop@example.com',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        currency: 'THB',
        timezone: 'Asia/Bangkok',
        businessHours: {
          open: '09:00',
          close: '18:00'
        }
      }
    };

    // Create shop with known ID
    await setDoc(doc(db, 'shops', 'default_shop'), {
      ...defaultShop,
      shopId: 'default_shop'
    });
    console.log('Default shop created');

    // Step 2: Migrate existing users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const updatePromises = [];

    usersSnapshot.docs.forEach(userDoc => {
      const userData = userDoc.data();
      
      // Skip if user already has shop assignments
      if (userData.assignedShops && userData.assignedShops.length > 0) {
        console.log(`User ${userData.email} already has shop assignments, skipping...`);
        return;
      }

      const shopAssignment = {
        shopId: 'default_shop',
        shopName: 'Whey อร่อยดี',
        role: userData.role || 'staff',
        isOwner: userData.role === 'admin' || userData.isRootAdmin,
        assignedAt: new Date(),
        assignedBy: 'system_migration'
      };

      const updateData = {
        assignedShops: [shopAssignment],
        currentShop: 'default_shop',
        globalRole: userData.role || 'staff' // Backup of original role
      };

      updatePromises.push(
        updateDoc(userDoc.ref, updateData)
      );
    });

    await Promise.all(updatePromises);
    console.log(`Migrated ${updatePromises.length} users to shop system`);

    // Step 3: Update existing data to include shopId
    await migrateDataCollections();
    
    console.log('Migration completed successfully!');
    return true;

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function migrateDataCollections() {
  const collections = ['customers', 'inventory', 'sales'];
  
  for (const collectionName of collections) {
    console.log(`Migrating ${collectionName}...`);
    
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      for (const userDoc of usersSnapshot.docs) {
        const dataSnapshot = await getDocs(collection(db, 'users', userDoc.id, collectionName));
        
        const updatePromises = dataSnapshot.docs.map(dataDoc => {
          const data = dataDoc.data();
          
          // Skip if already has shopId
          if (data.shopId) return Promise.resolve();
          
          return updateDoc(dataDoc.ref, {
            shopId: 'default_shop',
            shopName: 'Whey อร่อยดี'
          });
        });
        
        await Promise.all(updatePromises);
      }
      
      console.log(`${collectionName} migration completed`);
    } catch (error) {
      console.error(`Error migrating ${collectionName}:`, error);
    }
  }
}

// Helper function to create a new shop
export async function createShop(shopData) {
  try {
    const shopDoc = await addDoc(collection(db, 'shops'), {
      ...shopData,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    });
    
    console.log('Shop created with ID:', shopDoc.id);
    return shopDoc.id;
  } catch (error) {
    console.error('Error creating shop:', error);
    throw error;
  }
}

// Helper function to assign user to shop
export async function assignUserToShop(userId, shopId, shopName, role, isOwner = false) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDocs(collection(db, 'users'));
    const userData = userSnap.docs.find(doc => doc.id === userId)?.data();
    
    if (!userData) {
      throw new Error('User not found');
    }

    const shopAssignment = {
      shopId,
      shopName,
      role: role.toLowerCase(),
      isOwner,
      assignedAt: new Date(),
      assignedBy: 'manual_assignment'
    };

    const existingAssignments = userData.assignedShops || [];
    const updatedAssignments = [...existingAssignments, shopAssignment];

    await updateDoc(userRef, {
      assignedShops: updatedAssignments,
      currentShop: userData.currentShop || shopId // Set as default if no current shop
    });

    console.log(`User ${userId} assigned to shop ${shopName} as ${role}`);
    return true;
  } catch (error) {
    console.error('Error assigning user to shop:', error);
    throw error;
  }
}

// Usage examples:
/*
// Run migration once
await migrateUsersToShopSystem();

// Create a new shop
await createShop({
  shopName: "Bangkok Branch",
  address: "Bangkok, Thailand",
  phone: "+66 xxx xxx xxx"
});

// Assign user to shop
await assignUserToShop(
  "user_id_here", 
  "shop_id_here", 
  "Shop Name", 
  "manager", 
  false
);
*/