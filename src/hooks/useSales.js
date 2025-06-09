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

const ROLE_ADMIN = 'admin';
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

  // --- Add sale: now supports multi-product array ---
  const addSale = useCallback(
    async (saleData) => {
      if (!user?.uid) return false;
      try {
        let payload = {
          userId: user.uid,
          ...saleData,
        };

        // Sync createdAt and date
        if (saleData.date || saleData.datetime) {
          let theDate = saleData.date || saleData.datetime;
          if (theDate instanceof Timestamp) {
            // do nothing
          } else if (theDate instanceof Date) {
            theDate = Timestamp.fromDate(theDate);
          } else if (typeof theDate === 'string') {
            theDate = Timestamp.fromDate(new Date(theDate));
          } else if (theDate?.toDate) {
            // already Firestore Timestamp
          } else {
            theDate = serverTimestamp();
          }
          payload.date = theDate;
          payload.createdAt = theDate;
        } else {
          payload.date = serverTimestamp();
          payload.createdAt = serverTimestamp();
        }

        // Ensure products[] and totalAmount are stored (multi-product safe)
        if (Array.isArray(saleData.products)) {
          payload.products = saleData.products.map(p => ({
            productId: p.product?.id || p.productId,
            productName: p.product?.name || p.productName,
            price: Number(p.price || 0),
            quantity: Number(p.quantity || 1),
            subtotal: Number(p.subtotal || (p.price * p.quantity) || 0),
          }));
          payload.totalAmount = payload.products.reduce((sum, p) => sum + Number(p.subtotal), 0);
        }

        // For legacy: allow single product/amount if no products array
        if (!payload.products && payload.product && payload.amount) {
          payload.products = [{
            productId: payload.product.id,
            productName: payload.product.name,
            price: Number(payload.amount),
            quantity: 1,
            subtotal: Number(payload.amount)
          }];
          payload.totalAmount = Number(payload.amount);
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

  // --- Totals (sum all product subtotals, robust for multi-product) ---
  const now = new Date();
  const startDay = startOfDay(now);
  const startWeek = startOfWeek(now, { weekStartsOn: 1 });
  const startMonth = startOfMonth(now);
  const startYear = startOfYear(now);

  const totals = sales.reduce(
    (acc, s) => {
      const d = s.date?.toDate ? s.date.toDate() : new Date(s.date);
      // For multi-product, sum all subtotals
      let sum = 0;
      if (Array.isArray(s.products)) {
        sum = s.products.reduce((total, p) => total + Number(p.subtotal || 0), 0);
      } else if (typeof s.totalAmount === "number") {
        sum = s.totalAmount;
      } else if (s.amount) {
        sum = Number(s.amount);
      }
      if (d >= startDay) acc.daily += sum;
      if (d >= startWeek) acc.weekly += sum;
      if (d >= startMonth) acc.monthly += sum;
      if (d >= startYear) acc.yearly += sum;
      return acc;
    },
    { daily: 0, weekly: 0, monthly: 0, yearly: 0 }
  );

  // --- 12 months log (by product subtotals) ---
  const monthlyLog = Array.from({ length: 12 }).map((_, i) => {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    const monthTotal = sales.reduce((sum, s) => {
      const d = s.date?.toDate ? s.date.toDate() : new Date(s.date);
      let amount = 0;
      if (Array.isArray(s.products)) {
        amount = s.products.reduce((total, p) => total + Number(p.subtotal || 0), 0);
      } else if (typeof s.totalAmount === "number") {
        amount = s.totalAmount;
      } else if (s.amount) {
        amount = Number(s.amount);
      }
      return (d.getFullYear() === dt.getFullYear() && d.getMonth() === dt.getMonth())
        ? sum + amount
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
