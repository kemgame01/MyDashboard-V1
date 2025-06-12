// src/features/sales/salesChartHelpers.js - Fixed for your actual data structure

function getSaleTotal(sale) {
  // Comprehensive: multi-product OR single product
  if (Array.isArray(sale.products) && sale.products.length > 0) {
    // Sum all product subtotals
    return sale.products.reduce((sum, p) => sum + Number(p.subtotal || 0), 0);
  }
  // If there's a stored totalAmount (your current format), use it
  if (typeof sale.totalAmount === "number") {
    return sale.totalAmount;
  }
  // Fallback: use sale.amount (old format)
  return Number(sale.amount || 0);
}

export function getDailyData(sales, days = 30) {
  console.log('getDailyData called with:', sales?.length, 'sales');
  
  if (!Array.isArray(sales) || sales.length === 0) {
    console.log('No sales data for daily chart');
    return [];
  }
  
  const today = new Date();
  const arr = Array.from({ length: days }).map((_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - idx));
    return d;
  });
  
  const result = arr.map(dateObj => {
    const key = dateObj.toISOString().slice(0, 10); // YYYY-MM-DD
    const income = sales
      .filter(sale => {
        // Your data uses 'date' field, not 'datetime'
        const sd = sale.date?.toDate ? sale.date.toDate() : new Date(sale.date);
        const saleKey = sd.toISOString().slice(0, 10);
        return saleKey === key;
      })
      .reduce((sum, sale) => sum + getSaleTotal(sale), 0);
      
    return {
      name: dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
      income,
    };
  });
  
  console.log('Daily data result:', result);
  return result;
}

export function getWeeklyData(sales, weeks = 12) {
  console.log('getWeeklyData called with:', sales?.length, 'sales');
  
  if (!Array.isArray(sales) || sales.length === 0) {
    console.log('No sales data for weekly chart');
    return [];
  }
  
  const arr = Array.from({ length: weeks }).map((_, idx) => {
    const start = new Date();
    start.setDate(start.getDate() - (weeks - 1 - idx) * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  });
  
  const result = arr.map((range) => {
    const income = sales
      .filter(sale => {
        // Your data uses 'date' field, not 'datetime'
        const sd = sale.date?.toDate ? sale.date.toDate() : new Date(sale.date);
        return sd >= range.start && sd <= range.end;
      })
      .reduce((sum, sale) => sum + getSaleTotal(sale), 0);
      
    return {
      name: `${range.start.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}`,
      income,
    };
  });
  
  console.log('Weekly data result:', result);
  return result;
}

export function getMonthlyData(monthlyLog = []) {
  console.log('getMonthlyData called with:', monthlyLog?.length, 'entries');
  
  if (!Array.isArray(monthlyLog) || monthlyLog.length === 0) {
    console.log('No monthly log data');
    return [];
  }
  
  // If you ever want to calculate directly from sales instead of monthlyLog, you can use getSaleTotal inside here too.
  const result = monthlyLog.map(m => ({
    name: m.month.slice(5), // "06", "07" 
    income: m.total,
  }));
  
  console.log('Monthly data result:', result);
  return result;
}