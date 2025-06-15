// src/utils/shopPermissions.js
import { where, query as firestoreQuery } from 'firebase/firestore';

// Shop-specific role permissions
export const SHOP_PERMISSIONS = {
  owner: {
    canManageShop: true,
    canManageStaff: true,
    canManageInventory: true,
    canViewSales: true,
    canManageSales: true,
    canViewReports: true,
    canDeleteShop: true,
    canInviteStaff: true,
    canRemoveStaff: true,
    canEditShopDetails: true
  },
  admin: {
    canManageShop: true,
    canManageStaff: true,
    canManageInventory: true,
    canViewSales: true,
    canManageSales: true,
    canViewReports: true,
    canDeleteShop: false,
    canInviteStaff: true,
    canRemoveStaff: true,
    canEditShopDetails: true
  },
  manager: {
    canManageShop: false,
    canManageStaff: false,
    canManageInventory: true,
    canViewSales: true,
    canManageSales: true,
    canViewReports: true,
    canDeleteShop: false,
    canInviteStaff: false,
    canRemoveStaff: false,
    canEditShopDetails: false
  },
  staff: {
    canManageShop: false,
    canManageStaff: false,
    canManageInventory: false,
    canViewSales: true,
    canManageSales: false,
    canViewReports: false,
    canDeleteShop: false,
    canInviteStaff: false,
    canRemoveStaff: false,
    canEditShopDetails: false
  },
  viewer: {
    canManageShop: false,
    canManageStaff: false,
    canManageInventory: false,
    canViewSales: false,
    canManageSales: false,
    canViewReports: false,
    canDeleteShop: false,
    canInviteStaff: false,
    canRemoveStaff: false,
    canEditShopDetails: false
  }
};

// Shop Schema
export const SHOP_SCHEMA = {
  shopId: "", // Auto-generated
  shopName: "",
  ownerId: "", // User who owns this shop
  address: "",
  phone: "",
  email: "",
  status: "active", // active, inactive, suspended
  createdAt: new Date(),
  createdBy: "", // User who created the shop
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

// User Schema with shop assignments
export const USER_SHOP_SCHEMA = {
  uid: "", // Firebase Auth UID
  email: "",
  displayName: "",
  role: "viewer", // Default global role: viewer, staff, manager, admin
  isRootAdmin: false, // Only true for application owner
  
  // Shop-related fields
  assignedShops: [
    {
      shopId: "",
      shopName: "", 
      role: "", // Role within this specific shop
      isOwner: false, // Is this user the owner of this shop
      assignedAt: new Date(),
      assignedBy: "" // UID of user who assigned them
    }
  ],
  currentShop: null, // Currently active shop ID
  
  // User metadata
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLogin: new Date(),
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
export function hasShopPermission(user, action, shopId = null) {
  // Root admin has all permissions
  if (user?.isRootAdmin) return true;
  
  const targetShopId = shopId || user?.currentShop || user?.assignedShops?.[0]?.shopId;
  if (!targetShopId) return false;
  
  const shopAssignment = user.assignedShops?.find(shop => shop.shopId === targetShopId);
  if (!shopAssignment) return false;
  
  const permissions = SHOP_PERMISSIONS[shopAssignment.role];
  return permissions?.[action] === true;
}

/**
 * Check if user can manage inventory in shop
 */
export function canManageShopInventory(user, shopId = null) {
  return hasShopPermission(user, 'canManageInventory', shopId);
}

/**
 * Check if user can view sales in shop
 */
export function canViewShopSales(user, shopId = null) {
  return hasShopPermission(user, 'canViewSales', shopId);
}

/**
 * Check if user can manage staff in shop
 */
export function canManageShopStaff(user, shopId = null) {
  return hasShopPermission(user, 'canManageStaff', shopId);
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
    where(shopIdField, 'in', userShopIds.slice(0, 10)) // Firestore 'in' limit
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

/**
 * Check who can change global user roles
 */
export const canChangeGlobalRole = (editor, targetUser) => {
  if (!editor || !targetUser) return false;
  // Only Root Admin can change global user roles
  return editor.isRootAdmin === true;
};

/**
 * Check who can change shop-specific roles
 */
export const canChangeShopRole = (editor, targetUser, shopId) => {
  if (!editor || !targetUser || !shopId) return false;
  
  // Root Admin can change any shop role
  if (editor.isRootAdmin) return true;
  
  // Shop owner can change roles for users in their shop
  const isOwnerOfShop = editor.assignedShops?.some(shop => 
    shop.shopId === shopId && shop.isOwner
  );
  
  // Shop admins can also manage staff (but not other admins/owners)
  const isAdminOfShop = editor.assignedShops?.some(shop => 
    shop.shopId === shopId && shop.role === 'admin'
  );
  
  if (isOwnerOfShop || isAdminOfShop) {
    // Cannot change role of shop owner unless you're root admin
    const targetIsOwner = targetUser.assignedShops?.some(shop => 
      shop.shopId === shopId && shop.isOwner
    );
    return !targetIsOwner || editor.isRootAdmin;
  }
  
  return false;
};

/**
 * Check who can view Role Management section
 */
export const canViewRoleManagement = (user) => {
  if (!user) return false;
  
  // Root Admin can always view
  if (user.isRootAdmin) return true;
  
  // Shop owners can view
  const hasOwnedShops = user.assignedShops?.some(shop => shop.isOwner);
  return hasOwnedShops;
};

/**
 * Check who can view Shop Management section
 */
export const canViewShopManagement = (user) => {
  if (!user) return false;
  
  // Root Admin can always view
  if (user.isRootAdmin) return true;
  
  // Shop owners can view
  const hasOwnedShops = user.assignedShops?.some(shop => shop.isOwner);
  return hasOwnedShops;
};

/**
 * Get shops user can manage
 */
export const getManagedShops = (user) => {
  if (!user) return [];
  
  // Root Admin can manage all shops (will be filtered in component)
  if (user.isRootAdmin) return 'all';
  
  // Return shops where user is owner or admin
  return user.assignedShops?.filter(shop => 
    shop.isOwner || shop.role === 'admin'
  ) || [];
};

// Add these functions to your src/utils/shopPermissions.js file at the end
// DO NOT add any import statements - they should already be at the top of your file

/**
 * Check if user can view customers
 */
export const canViewCustomers = (user, shopContext) => {
  if (!user) return false;
  
  // Root Admin can view all customers
  if (user.isRootAdmin) return true;
  
  // Must have a shop context to view customers
  if (!shopContext?.shopId) return false;
  
  // Check if user has access to the shop
  const hasShopAccess = user.assignedShops?.some(
    shop => shop.shopId === shopContext.shopId
  );
  
  return hasShopAccess;
};

/**
 * Check if user can edit/add/delete customers
 */
export const canEditCustomer = (user, shopContext) => {
  if (!user) return false;
  
  // Root Admin can edit all customers
  if (user.isRootAdmin) return true;
  
  // Must have a shop context to edit customers
  if (!shopContext?.shopId) return false;
  
  // Check if user has access to the shop
  const shopAssignment = user.assignedShops?.find(
    shop => shop.shopId === shopContext.shopId
  );
  
  if (!shopAssignment) return false;
  
  // Check role permissions
  const role = shopAssignment.role;
  
  // Owners and admins can always edit
  if (shopAssignment.isOwner || role === 'admin') return true;
  
  // Managers and staff can edit customers
  if (role === 'manager' || role === 'staff') return true;
  
  // Sales role would need to manage customers too
  if (role === 'sales') return true;
  
  // Viewers cannot edit
  return false;
};
