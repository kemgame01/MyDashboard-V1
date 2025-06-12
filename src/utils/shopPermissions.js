// src/utils/shopPermissions.js
import { where, query as firestoreQuery } from 'firebase/firestore';

// Define shop permissions since the shopModel doesn't exist yet
export const SHOP_PERMISSIONS = {
  owner: {
    inventory: { read: true, write: true, delete: true },
    sales: { read: true, write: true, delete: true },
    staff: { read: true, write: true, delete: true },
    settings: { read: true, write: true, delete: true }
  },
  admin: {
    inventory: { read: true, write: true, delete: true },
    sales: { read: true, write: true, delete: true },
    staff: { read: true, write: true, delete: true },
    settings: { read: true, write: true, delete: true }
  },
  manager: {
    inventory: { read: true, write: true, delete: false },
    sales: { read: true, write: true, delete: false },
    staff: { read: true, write: true, delete: false },
    settings: { read: true, write: false, delete: false }
  },
    sales: {
    inventory: { read: true, write: false, delete: false }, // Can see inventory to check stock
    sales: { read: true, write: true, delete: false },     // Can create and view sales
    staff: { read: false, write: false, delete: false },    // Cannot manage staff
    settings: { read: false, write: false, delete: false } // Cannot change shop settings
  },
  staff: {
    inventory: { read: true, write: true, delete: false },
    sales: { read: true, write: true, delete: false },
    staff: { read: false, write: false, delete: false },
    settings: { read: false, write: false, delete: false }
  },
  viewer: {
    inventory: { read: true, write: false, delete: false },
    sales: { read: true, write: false, delete: false },
    staff: { read: false, write: false, delete: false },
    settings: { read: false, write: false, delete: false }
  }
};

export const SHOP_SCHEMA = {
  shopName: "Whey อร่อยดี",
  shopId: "shop_001", 
  ownerId: "user_admin_id", // Admin who owns this shop
  address: "Bangkok, Thailand",
  phone: "+66 xxx xxx xxx",
  email: "shop@example.com",
  status: "active", // active, inactive, suspended
  createdAt: new Date(),
  updatedAt: new Date(),
  settings: {
    currency: "THB",
    timezone: "Asia/Bangkok",
    businessHours: {
      open: "09:00",
      close: "18:00"
    }
  }
};

// Updated User Schema with shop assignments
export const USER_SHOP_SCHEMA = {
  // Existing user fields...
  uid: "user_id",
  email: "user@example.com",
  displayName: "User Name",
  role: "admin", // admin, manager, staff, sales, viewer
  isRootAdmin: false,
  
  // NEW: Shop-related fields
  assignedShops: [
    {
      shopId: "shop_001",
      shopName: "Whey อร่อยดี", 
      role: "admin", // Role within this specific shop
      permissions: {
        inventory: { read: true, write: true, delete: true },
        sales: { read: true, write: true, delete: true },
        customers: { read: true, write: true, delete: true },
        reports: { read: true },
        staff: { read: true, write: true } // Can manage staff in this shop
      },
      isOwner: true, // Is this user the owner of this shop
      assignedAt: new Date(),
      assignedBy: "root_admin_id"
    }
  ],
  currentShop: "shop_001", // Currently active shop
  
  // Legacy global role (for backward compatibility)
  globalRole: "admin", 
  blocked: false
};

/**
 * Get user's role in a specific shop
 */
export function getUserShopRole(user, shopId) {
  if (!user || !user.assignedShops || !shopId) return null;
  
  const shopAssignment = user.assignedShops.find(shop => shop.shopId === shopId);
  return shopAssignment ? shopAssignment.role : null;
}

/**
 * Get user's current active shop
 */
export function getCurrentShop(user) {
  if (!user || !user.assignedShops) return null;
  
  // Use currentShop if set, otherwise first assigned shop
  const currentShopId = user.currentShop || user.assignedShops[0]?.shopId;
  return user.assignedShops.find(shop => shop.shopId === currentShopId);
}

/**
 * Check if user has permission for specific action in current shop
 */
export function hasShopPermission(user, action, resource, shopId = null) {
  // Root admin has all permissions
  if (user?.isRootAdmin) return true;
  
  const targetShopId = shopId || user?.currentShop || user?.assignedShops?.[0]?.shopId;
  if (!targetShopId) return false;
  
  const userRole = getUserShopRole(user, targetShopId);
  if (!userRole) return false;
  
  const permissions = SHOP_PERMISSIONS[userRole];
  return permissions?.[resource]?.[action] === true;
}

/**
 * Check if user can manage inventory in current shop
 */
export function canManageShopInventory(user, shopId = null) {
  return hasShopPermission(user, 'write', 'inventory', shopId);
}

/**
 * Check if user can view sales in current shop
 */
export function canViewShopSales(user, shopId = null) {
  return hasShopPermission(user, 'read', 'sales', shopId);
}

/**
 * Check if user can manage staff in current shop
 */
export function canManageShopStaff(user, shopId = null) {
  return hasShopPermission(user, 'write', 'staff', shopId);
}

/**
 * Check if user is owner of a specific shop
 */
export function isShopOwner(user, shopId = null) {
  if (!user || !user.assignedShops) return false;
  
  const targetShopId = shopId || user?.currentShop || user?.assignedShops?.[0]?.shopId;
  const shopAssignment = user.assignedShops.find(shop => shop.shopId === targetShopId);
  
  return shopAssignment?.isOwner === true;
}

/**
 * Get all shops user has access to
 */
export function getUserShops(user) {
  if (!user || !user.assignedShops) return [];
  return user.assignedShops.map(shop => ({
    shopId: shop.shopId,
    shopName: shop.shopName,
    role: shop.role,
    isOwner: shop.isOwner
  }));
}

/**
 * Filter data based on user's shop access
 */
export function filterByShopAccess(data, user, shopIdField = 'shopId') {
  if (user?.isRootAdmin) return data;
  
  const userShopIds = getUserShops(user).map(shop => shop.shopId);
  return data.filter(item => userShopIds.includes(item[shopIdField]));
}

/**
 * Build Firestore query with shop filter
 */
export function addShopFilter(baseQuery, user, shopIdField = 'shopId') {
  if (user?.isRootAdmin) return baseQuery;
  
  const userShopIds = getUserShops(user).map(shop => shop.shopId);
  if (userShopIds.length === 0) return null;
  if (userShopIds.length === 1) {
    return firestoreQuery(baseQuery, where(shopIdField, '==', userShopIds[0]));
  }
  
  return firestoreQuery(
    baseQuery,
    where(shopIdField, 'in', userShopIds.slice(0, 10))
  );
}
/**
 * Validate shop assignment
 */
export function validateShopAssignment(assignment) {
  const required = ['shopId', 'shopName', 'role'];
  const missing = required.filter(field => !assignment[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  if (!SHOP_PERMISSIONS[assignment.role]) {
    throw new Error(`Invalid role: ${assignment.role}`);
  }
  
  return true;
}

/**
 * Create shop assignment object
 */
export function createShopAssignment(shopId, shopName, role, isOwner = false, assignedBy = null) {
  const assignment = {
    shopId,
    shopName,
    role: role.toLowerCase(),
    isOwner,
    assignedAt: new Date(),
    assignedBy
  };
  
  validateShopAssignment(assignment);
  return assignment;
}