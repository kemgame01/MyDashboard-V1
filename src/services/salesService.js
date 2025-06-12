// src/services/salesService.js
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  where,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Sales Service - Handles all sales-related Firebase operations
 */
export class SalesService {
  constructor(userId, shopContext = null) {
    this.userId = userId;
    this.shopContext = shopContext;
  }

  // Get sales collection reference
  getSalesCollection() {
    return collection(db, 'users', this.userId, 'sales');
  }

  // Build query with shop filtering
  buildSalesQuery(options = {}) {
    const { limitCount = 100, orderField = 'datetime', orderDirection = 'desc' } = options;
    
    let salesQuery = query(
      this.getSalesCollection(),
      orderBy(orderField, orderDirection),
      limit(limitCount)
    );

    // Add shop filter if shopContext is provided
    if (this.shopContext?.shopId) {
      salesQuery = query(
        this.getSalesCollection(),
        where('shopId', '==', this.shopContext.shopId),
        orderBy(orderField, orderDirection),
        limit(limitCount)
      );
    }

    return salesQuery;
  }

  // Fetch all sales
  async fetchSales(options = {}) {
    try {
      const salesQuery = this.buildSalesQuery(options);
      const snapshot = await getDocs(salesQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Ensure datetime is properly handled
        datetime: doc.data().datetime?.toDate?.() || new Date(doc.data().datetime || doc.data().createdAt)
      }));
    } catch (error) {
      console.error('Error fetching sales:', error);
      throw new Error(`Failed to fetch sales: ${error.message}`);
    }
  }

  // Add new sale
  async addSale(saleData) {
    try {
      const docData = {
        ...saleData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ownerId: this.userId,
        // Add shop context if available
        ...(this.shopContext && {
          shopId: this.shopContext.shopId,
          shopName: this.shopContext.shopName
        })
      };

      const docRef = await addDoc(this.getSalesCollection(), docData);
      
      return {
        success: true,
        id: docRef.id,
        data: { ...docData, id: docRef.id }
      };
    } catch (error) {
      console.error('Error adding sale:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update existing sale
  async updateSale(saleId, saleData) {
    try {
      const saleRef = doc(this.getSalesCollection(), saleId);
      
      const updateData = {
        ...saleData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(saleRef, updateData);
      
      return {
        success: true,
        id: saleId,
        data: updateData
      };
    } catch (error) {
      console.error('Error updating sale:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete sale
  async deleteSale(saleId) {
    try {
      const saleRef = doc(this.getSalesCollection(), saleId);
      await deleteDoc(saleRef);
      
      return {
        success: true,
        id: saleId
      };
    } catch (error) {
      console.error('Error deleting sale:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * Sales calculations utility
 */
export class SalesCalculator {
  static calculateTotals(sales = []) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const totals = {
      daily: 0,
      weekly: 0,
      monthly: 0,
      yearly: 0
    };

    sales.forEach(sale => {
      const saleDate = sale.datetime?.toDate?.() || new Date(sale.datetime || sale.createdAt);
      const amount = Number(sale.totalAmount || 0);

      if (saleDate >= today) totals.daily += amount;
      if (saleDate >= weekStart) totals.weekly += amount;
      if (saleDate >= monthStart) totals.monthly += amount;
      if (saleDate >= yearStart) totals.yearly += amount;
    });

    return totals;
  }

  static validateSaleData(saleData) {
    const errors = [];

    if (!saleData.customerId || !saleData.customerName) {
      errors.push('Customer is required');
    }

    if (!saleData.channel) {
      errors.push('Channel is required');
    }

    if (!saleData.datetime) {
      errors.push('Date and time is required');
    }

    if (!Array.isArray(saleData.products) || saleData.products.length === 0) {
      errors.push('At least one product is required');
    }

    saleData.products?.forEach((product, index) => {
      if (!product.productId || !product.productName) {
        errors.push(`Product ${index + 1}: Product selection is required`);
      }
      if (!product.quantity || product.quantity < 1) {
        errors.push(`Product ${index + 1}: Quantity must be at least 1`);
      }
      if (typeof product.price !== 'number' || product.price < 0) {
        errors.push(`Product ${index + 1}: Price must be 0 or greater`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}