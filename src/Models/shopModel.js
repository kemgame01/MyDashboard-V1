// src/models/shopModel.js
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

// Shop-specific permissions matrix
export const SHOP_PERMISSIONS = {
  admin: {
    inventory: { read: true, write: true, delete: true },
    sales: { read: true, write: true, delete: true },
    customers: { read: true, write: true, delete: true },
    reports: { read: true, write: true },
    staff: { read: true, write: true, delete: true },
    settings: { read: true, write: true }
  },
  manager: {
    inventory: { read: true, write: true, delete: false },
    sales: { read: true, write: true, delete: false },
    customers: { read: true, write: true, delete: false },
    reports: { read: true, write: false },
    staff: { read: true, write: true, delete: false },
    settings: { read: true, write: false }
  },
  staff: {
    inventory: { read: true, write: true, delete: false },
    sales: { read: true, write: true, delete: false },
    customers: { read: true, write: false, delete: false },
    reports: { read: false, write: false },
    staff: { read: false, write: false, delete: false },
    settings: { read: false, write: false }
  },
  sales: {
    inventory: { read: true, write: false, delete: false },
    sales: { read: true, write: true, delete: false },
    customers: { read: true, write: true, delete: false },
    reports: { read: true, write: false },
    staff: { read: false, write: false, delete: false },
    settings: { read: false, write: false }
  }
};