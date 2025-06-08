// src/features/sales/salesChartHelpers.js

export function getDailyData(sales, days = 30) {
  const today = new Date();
  const arr = Array.from({ length: days }).map((_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - idx));
    return d;
  });
  return arr.map(dateObj => {
    const key = dateObj.toISOString().slice(0, 10);
    const income = sales
      .filter(sale => {
        const sd = sale.date?.toDate ? sale.date.toDate() : new Date(sale.date);
        return sd.toISOString().slice(0, 10) === key;
      })
      .reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
    return {
      name: dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
      income,
    };
  });
}

export function getWeeklyData(sales, weeks = 12) {
  const arr = Array.from({ length: weeks }).map((_, idx) => {
    const start = new Date();
    start.setDate(start.getDate() - (weeks - 1 - idx) * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start, end };
  });
  return arr.map((range) => {
    const income = sales
      .filter(sale => {
        const sd = sale.date?.toDate ? sale.date.toDate() : new Date(sale.date);
        return sd >= range.start && sd <= range.end;
      })
      .reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
    return {
      name: `${range.start.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}`,
      income,
    };
  });
}

export function getMonthlyData(monthlyLog = []) {
  return monthlyLog.map(m => ({
    name: m.month.slice(5), // "06", "07"
    income: m.total,
  }));
}
