import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
} from 'date-fns';

// ROLE constants
const ROLE_ADMIN = 'admin';
const ROLE_SALES = 'sales';
const ROLE_ROOT = 'root';

export default function useSales(user) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin =
    user?.isRootAdmin === true ||
    String(user?.role || '').toLowerCase() === ROLE_ADMIN ||
    String(user?.role || '').toLowerCase() === ROLE_ROOT;

  // --- Realtime listener for sales ---
  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    const salesRef = collection(db, 'sales');
    const q = isAdmin
      ? query(salesRef, orderBy('createdAt', 'desc'))
      : query(salesRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSales(items);
        setLoading(false);
      },
      (error) => {
        console.error('[useSales] onSnapshot error:', error);
        setLoading(false);
      }
    );
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, isAdmin]);

  // Add sale
  const addSale = useCallback(
    async (saleData) => {
      if (!user?.uid) return false;
      try {
        let payload = {
          userId: user.uid,
          ...saleData,
        };

        // --- Sync createdAt and date to *exact same* value if date provided ---
        if (saleData.date) {
          // Convert to Firestore Timestamp if needed
          let theDate;
          if (saleData.date instanceof Timestamp) {
            theDate = saleData.date;
          } else if (saleData.date instanceof Date) {
            theDate = Timestamp.fromDate(saleData.date);
          } else if (typeof saleData.date === 'string') {
            theDate = Timestamp.fromDate(new Date(saleData.date));
          } else if (saleData.date?.toDate) {
            // already a Firestore Timestamp
            theDate = saleData.date;
          } else {
            theDate = serverTimestamp();
          }
          payload.date = theDate;
          payload.createdAt = theDate;
        } else {
          payload.date = serverTimestamp();
          payload.createdAt = serverTimestamp();
        }

        await addDoc(collection(db, 'sales'), payload);

        return true;
      } catch (err) {
        console.error('[useSales] addSale error:', err);
        return false;
      }
    },
    [user?.uid]
  );

  // Totals logic (for dashboard cards)
  const now = new Date();
  const startDay = startOfDay(now);
  const startWeek = startOfWeek(now, { weekStartsOn: 1 });
  const startMonth = startOfMonth(now);
  const startYear = startOfYear(now);

  const totals = sales.reduce(
    (acc, s) => {
      const d = s.date?.toDate ? s.date.toDate() : new Date(s.date);
      const amount = Number(s.amount || 0);
      if (d >= startDay) acc.daily += amount;
      if (d >= startWeek) acc.weekly += amount;
      if (d >= startMonth) acc.monthly += amount;
      if (d >= startYear) acc.yearly += amount;
      return acc;
    },
    { daily: 0, weekly: 0, monthly: 0, yearly: 0 }
  );

  // 12-months log (optional analytics use)
  const monthlyLog = Array.from({ length: 12 }).map((_, i) => {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    const monthTotal = sales.reduce((sum, s) => {
      const d = s.date?.toDate ? s.date.toDate() : new Date(s.date);
      return d.getFullYear() === dt.getFullYear() && d.getMonth() === dt.getMonth()
        ? sum + Number(s.amount || 0)
        : sum;
    }, 0);
    return { month: monthKey, total: monthTotal };
  }).reverse();

  return {
    sales,
    loading,
    addSale,
    totals,
    monthlyLog,
  };
}
