// src/services/permissionService.js
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Central Permission Service
 * Handles all permission checks with Root Admin override
 */
class PermissionService {
  constructor() {
    this.userCache = new Map();
    this.debugMode = true; // Enable for debugging
  }

  /**
   * Log debug information
   */
  debug(message, data = {}) {
    if (this.debugMode) {
      console.log(`[PermissionService] ${message}`, data);
    }
  }

  /**
   * Get user data with caching
   */
  async getUserData(userId) {
    if (!userId) {
      this.debug('No userId provided');
      return null;
    }

    // Check cache first
    if (this.userCache.has(userId)) {
      const cached = this.userCache.get(userId);
      this.debug('Using cached user data', { userId, isRootAdmin: cached.isRootAdmin });
      return cached;
    }

    try {
      // Fetch from Firebase
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...userDoc.data() };
        this.userCache.set(userId, userData);
        this.debug('Fetched user data', { 
          userId, 
          isRootAdmin: userData.isRootAdmin,
          role: userData.role,
          assignedShops: userData.assignedShops?.length || 0
        });
        return userData;
      }
      this.debug('User document not found', { userId });
      return null;
    } catch (error) {
      this.debug('Error fetching user data', { userId, error: error.message });
      return null;
    }
  }

  /**
   * Clear user cache (call after updates)
   */
  clearCache(userId = null) {
    if (userId) {
      this.userCache.delete(userId);
      this.debug('Cleared cache for user', { userId });
    } else {
      this.userCache.clear();
      this.debug('Cleared entire cache');
    }
  }

  /**
   * Check if user is Root Admin
   */
  async isRootAdmin(user) {
    if (!user) {
      this.debug('No user provided for isRootAdmin check');
      return false;
    }

    // Direct check first
    if (user.isRootAdmin === true) {
      this.debug('User is Root Admin (direct check)', { userId: user.uid || user.id });
      return true;
    }

    // Fetch fresh data if needed
    const userData = await this.getUserData(user.uid || user.id);
    const isRoot = userData?.isRootAdmin === true;
    this.debug('Root Admin check result', { 
      userId: user.uid || user.id, 
      isRootAdmin: isRoot,
      userDataFound: !!userData
    });
    return isRoot;
  }

  /**
   * Check if user owns any shop
   */
  isShopOwner(user) {
    const isOwner = user?.assignedShops?.some(shop => shop.isOwner) || false;
    this.debug('Shop owner check', { 
      userId: user.uid || user.id, 
      isOwner,
      ownedShops: user?.assignedShops?.filter(s => s.isOwner).map(s => s.shopId) || []
    });
    return isOwner;
  }

  /**
   * Check if user owns specific shop
   */
  ownsShop(user, shopId) {
    const owns = user?.assignedShops?.some(shop => shop.shopId === shopId && shop.isOwner) || false;
    this.debug('Owns shop check', { userId: user.uid || user.id, shopId, owns });
    return owns;
  }

  /**
   * Get user's role in specific shop
   */
  getShopRole(user, shopId) {
    const assignment = user?.assignedShops?.find(shop => shop.shopId === shopId);
    const role = assignment?.role || null;
    this.debug('Get shop role', { userId: user.uid || user.id, shopId, role });
    return role;
  }

  /**
   * Main permission check function
   */
  async hasPermission(user, resource, action, shopId = null) {
    this.debug('Permission check started', { 
      userId: user?.uid || user?.id,
      resource, 
      action, 
      shopId 
    });

    // Root Admin has ALL permissions
    if (await this.isRootAdmin(user)) {
      this.debug('Permission granted (Root Admin)');
      return true;
    }

    // Shop-specific permissions
    if (shopId) {
      const shopRole = this.getShopRole(user, shopId);
      if (!shopRole) {
        this.debug('Permission denied (no shop role)');
        return false;
      }

      // Import SHOP_PERMISSIONS from existing file
      const { SHOP_PERMISSIONS } = await import('../utils/shopPermissions');
      const hasPermission = SHOP_PERMISSIONS[shopRole]?.[resource]?.[action] === true;
      this.debug('Shop permission check result', { shopRole, resource, action, hasPermission });
      return hasPermission;
    }

    // Global permissions based on role
    const globalPermissions = {
      admin: { all: true },
      manager: { inventory: true, sales: true, reports: true },
      staff: { inventory: { read: true }, sales: { read: true } },
      sales: { sales: true, customers: true },
      viewer: { read: true }
    };

    const userRole = user?.role || 'viewer';
    const hasGlobalPermission = globalPermissions[userRole]?.all || 
                                globalPermissions[userRole]?.[resource] === true ||
                                globalPermissions[userRole]?.[resource]?.[action] === true;

    this.debug('Global permission check result', { userRole, resource, action, hasGlobalPermission });
    return hasGlobalPermission;
  }

  /**
   * Check section access (for navigation)
   */
  async canAccessSection(user, section) {
    this.debug('Section access check', { userId: user?.uid || user?.id, section });

    // Root Admin can access everything
    if (await this.isRootAdmin(user)) {
      this.debug('Section access granted (Root Admin)');
      return true;
    }

    const sectionPermissions = {
      customers: () => true, // Everyone can see customers
      userProfile: () => true, // Everyone can see their profile
      roleManagement: () => this.isShopOwner(user), // Root Admin or Shop Owner
      shopManagement: () => this.isShopOwner(user), // Root Admin or Shop Owner
      inventory: () => user?.assignedShops?.length > 0,
      sales: () => user?.assignedShops?.length > 0,
      brandCategory: () => false, // Only Root Admin (already handled above)
      taskManagement: () => user?.assignedShops?.length > 0,
      allOrders: () => ['admin', 'manager', 'sales'].includes(user?.role),
      pendingOrders: () => ['admin', 'manager', 'sales'].includes(user?.role)
    };

    const canAccess = sectionPermissions[section]?.() || false;
    this.debug('Section access result', { section, canAccess });
    return canAccess;
  }

  /**
   * Get visible shops for user
   */
  async getVisibleShops(user) {
    this.debug('Getting visible shops', { userId: user?.uid || user?.id });

    // Root Admin sees all shops
    if (await this.isRootAdmin(user)) {
      this.debug('Returning all shops (Root Admin)');
      return { filter: null, shopIds: 'all' };
    }

    // Other users see only assigned shops
    const shopIds = user?.assignedShops?.map(s => s.shopId) || [];
    this.debug('Returning assigned shops', { shopIds });
    return { filter: 'assigned', shopIds };
  }

  /**
   * Debug function to check all permissions
   */
  async debugUserPermissions(user) {
    console.group('🔍 User Permission Debug');
    console.log('User ID:', user?.uid || user?.id);
    console.log('Email:', user?.email);
    console.log('Display Name:', user?.displayName);
    console.log('Global Role:', user?.role);
    console.log('Is Root Admin:', user?.isRootAdmin);
    console.log('Assigned Shops:', user?.assignedShops);
    
    const isRoot = await this.isRootAdmin(user);
    console.log('Async Root Admin Check:', isRoot);
    
    const sections = ['customers', 'roleManagement', 'shopManagement', 'inventory', 'sales', 'brandCategory'];
    console.log('\nSection Access:');
    for (const section of sections) {
      const canAccess = await this.canAccessSection(user, section);
      console.log(`  ${section}: ${canAccess ? '✅' : '❌'}`);
    }
    
    console.groupEnd();
  }
}

// Export singleton instance
export const permissionService = new PermissionService();

// Export convenience functions
export const isRootAdmin = (user) => permissionService.isRootAdmin(user);
export const isShopOwner = (user) => permissionService.isShopOwner(user);
export const hasPermission = (user, resource, action, shopId) => 
  permissionService.hasPermission(user, resource, action, shopId);
export const canAccessSection = (user, section) => 
  permissionService.canAccessSection(user, section);
export const debugUserPermissions = (user) => 
  permissionService.debugUserPermissions(user);
export const clearPermissionCache = (userId) => 
  permissionService.clearCache(userId);