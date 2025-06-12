// src/lib/salesUtils.js - Production-ready chart utilities

/**
 * Calculate total amount from a sale record
 * Supports both multi-product and legacy single product formats
 */
export function getSaleTotal(sale) {
  if (!sale) return 0;
  
  // Multi-product format (current)
  if (Array.isArray(sale.products) && sale.products.length > 0) {
    return sale.products.reduce((sum, product) => {
      return sum + Number(product.subtotal || 0);
    }, 0);
  }
  
  // Stored total amount
  if (typeof sale.totalAmount === "number") {
    return sale.totalAmount;
  }
  
  // Legacy single product format
  return Number(sale.amount || 0);
}

/**
 * Generate daily sales data for charts
 * @param {Array} sales - Array of sale records
 * @param {number} days - Number of days to include (default: 30)
 * @returns {Array} Chart data with name and income properties
 */
export function getDailyData(sales, days = 30) {
  if (!Array.isArray(sales) || sales.length === 0) {
    return generateEmptyDailyData(days);
  }
  
  const today = new Date();
  const dateRange = Array.from({ length: days }).map((_, idx) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - idx));
    return date;
  });
  
  return dateRange.map(dateObj => {
    const dateKey = dateObj.toISOString().slice(0, 10); // YYYY-MM-DD
    
    const dayIncome = sales
      .filter(sale => {
        const saleDate = sale.date?.toDate ? sale.date.toDate() : new Date(sale.date);
        const saleDateKey = saleDate.toISOString().slice(0, 10);
        return saleDateKey === dateKey;
      })
      .reduce((sum, sale) => sum + getSaleTotal(sale), 0);
      
    return {
      name: dateObj.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit' 
      }),
      income: dayIncome,
    };
  });
}

/**
 * Generate weekly sales data for charts
 * @param {Array} sales - Array of sale records  
 * @param {number} weeks - Number of weeks to include (default: 12)
 * @returns {Array} Chart data with name and income properties
 */
export function getWeeklyData(sales, weeks = 12) {
  if (!Array.isArray(sales) || sales.length === 0) {
    return generateEmptyWeeklyData(weeks);
  }
  
  const weekRanges = Array.from({ length: weeks }).map((_, idx) => {
    const start = new Date();
    start.setDate(start.getDate() - (weeks - 1 - idx) * 7);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  });
  
  return weekRanges.map((range) => {
    const weekIncome = sales
      .filter(sale => {
        const saleDate = sale.date?.toDate ? sale.date.toDate() : new Date(sale.date);
        return saleDate >= range.start && saleDate <= range.end;
      })
      .reduce((sum, sale) => sum + getSaleTotal(sale), 0);
      
    return {
      name: range.start.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit' 
      }),
      income: weekIncome,
    };
  });
}

/**
 * Generate monthly sales data for charts
 * @param {Array} monthlyLog - Pre-calculated monthly totals
 * @returns {Array} Chart data with name and income properties
 */
export function getMonthlyData(monthlyLog = []) {
  if (!Array.isArray(monthlyLog) || monthlyLog.length === 0) {
    return generateEmptyMonthlyData(12);
  }
  
  return monthlyLog.map(monthData => ({
    name: monthData.month.slice(5), // Extract MM from YYYY-MM
    income: monthData.total,
  }));
}

/**
 * Calculate sales totals for different time periods
 * @param {Array} sales - Array of sale records
 * @returns {Object} Object with daily, weekly, monthly, yearly totals
 */
export function calculateSalesTotals(sales) {
  if (!Array.isArray(sales) || sales.length === 0) {
    return { daily: 0, weekly: 0, monthly: 0, yearly: 0 };
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = getStartOfWeek(now);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  return sales.reduce((totals, sale) => {
    const saleDate = sale.date?.toDate ? sale.date.toDate() : new Date(sale.date);
    const saleAmount = getSaleTotal(sale);
    
    if (saleDate >= startOfDay) totals.daily += saleAmount;
    if (saleDate >= startOfWeek) totals.weekly += saleAmount;
    if (saleDate >= startOfMonth) totals.monthly += saleAmount;
    if (saleDate >= startOfYear) totals.yearly += saleAmount;
    
    return totals;
  }, { daily: 0, weekly: 0, monthly: 0, yearly: 0 });
}

/**
 * Generate monthly log for the past 12 months
 * @param {Array} sales - Array of sale records
 * @returns {Array} Monthly totals for the past 12 months
 */
export function generateMonthlyLog(sales) {
  const now = new Date();
  
  return Array.from({ length: 12 }).map((_, i) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    
    const monthTotal = sales.reduce((sum, sale) => {
      const saleDate = sale.date?.toDate ? sale.date.toDate() : new Date(sale.date);
      const amount = getSaleTotal(sale);
      
      return (saleDate.getFullYear() === monthDate.getFullYear() && 
              saleDate.getMonth() === monthDate.getMonth())
        ? sum + amount
        : sum;
    }, 0);
    
    return { month: monthKey, total: monthTotal };
  }).reverse();
}

// Helper functions for empty data generation
function generateEmptyDailyData(days) {
  const today = new Date();
  return Array.from({ length: days }).map((_, idx) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - idx));
    return {
      name: date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
      income: 0,
    };
  });
}

function generateEmptyWeeklyData(weeks) {
  return Array.from({ length: weeks }).map((_, idx) => {
    const start = new Date();
    start.setDate(start.getDate() - (weeks - 1 - idx) * 7);
    return {
      name: start.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
      income: 0,
    };
  });
}

function generateEmptyMonthlyData(months) {
  const now = new Date();
  return Array.from({ length: months }).map((_, i) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    return {
      name: monthKey.slice(5),
      income: 0,
    };
  }).reverse();
}

function getStartOfWeek(date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}