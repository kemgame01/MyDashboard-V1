import React, { useState, useMemo } from "react";
import useSales from "../../hooks/useSales";
import { useInventory } from "../../hooks/useInventory";
import useCustomers from "../../hooks/useCustomers";
import SalesLineGraph from "./SalesLineGraph";
import SummaryCard from "./SummaryCard";
import SaleModal from "./SaleModal";
import RecentSalesSection from "./RecentSalesSection";
import {
  getDailyData,
  getWeeklyData,
  getMonthlyData,
} from "./salesChartHelpers";

// Multi-product form structure
const initialForm = {
  customer: null,
  channel: "",
  datetime: new Date(),
  products: [
    {
      product: null,
      price: 0,
      quantity: 1,
      subtotal: 0,
    }
  ],
};

export default function SalesDashboard({ user }) {
  // --- Hooks for main data ---
  const { sales, loading, addSale, updateSale, totals, monthlyLog } = useSales(user);
  const [customerQuery, setCustomerQuery] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [customers, customersLoading] = useCustomers(user?.uid, customerQuery);

  // --- Modal state ---
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  // --- Chart data ---
  const dailyData = useMemo(() => getDailyData(sales), [sales]);
  const weeklyData = useMemo(() => getWeeklyData(sales), [sales]);
  const monthlyData = useMemo(() => getMonthlyData(monthlyLog), [monthlyLog]);
  const [chartView, setChartView] = useState("monthly");
  const chartData =
    chartView === "daily"
      ? dailyData
      : chartView === "weekly"
      ? weeklyData
      : monthlyData;

  // --- Modal open/close logic ---
  const openAddModal = () => {
    setForm({
      ...initialForm,
      datetime: new Date(),
      products: [{ product: null, price: 0, quantity: 1, subtotal: 0 }]
    });
    setFormError("");
    setEditMode(false);
    setModalOpen(true);
    setProductQuery("");
  };

  const openEditModal = (sale) => {
    setForm({
      customer: { id: sale.customerId, name: sale.customerName },
      channel: sale.channel,
      datetime: sale.datetime?.toDate ? sale.datetime.toDate()
        : sale.datetime ? new Date(sale.datetime)
        : sale.date?.toDate ? sale.date.toDate()
        : sale.createdAt?.toDate ? sale.createdAt.toDate()
        : new Date(),
      products: (sale.products && Array.isArray(sale.products))
        ? sale.products.map(row => ({
            product: row.productId && row.productName
              ? { id: row.productId, name: row.productName }
              : null,
            price: Number(row.price),
            quantity: Number(row.quantity),
            subtotal: Number(row.subtotal || row.price * row.quantity || 0),
        }))
        : [{ product: null, price: 0, quantity: 1, subtotal: 0 }],
    });
    setEditId(sale.id);
    setEditMode(true);
    setFormError("");
    setModalOpen(true);
    setProductQuery("");
  };

  // --- Submit logic: robust validation and clean-up ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    // Defensive: filter out empty/blank product rows
    const cleanProducts = (form.products || []).filter(row =>
      row.product && row.product.id && row.product.name &&
      Number(row.quantity) > 0 && Number(row.price) >= 0
    );
    if (!form.customer || !form.channel || !form.datetime) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (!Array.isArray(cleanProducts) || cleanProducts.length === 0) {
      setFormError("Please add at least one product.");
      return;
    }
    for (const row of cleanProducts) {
      if (!row.product || !row.product.id || !row.product.name) {
        setFormError("Each row needs a selected product.");
        return;
      }
      if (!row.quantity || row.quantity < 1) {
        setFormError("Quantity must be at least 1 for every product.");
        return;
      }
      if (typeof row.price !== "number" || row.price < 0) {
        setFormError("Price must be at least 0 for every product.");
        return;
      }
    }

    const totalAmount = cleanProducts.reduce(
      (sum, row) => sum + (Number(row.subtotal) || row.price * row.quantity || 0), 0
    );

    const salePayload = {
      customerId: form.customer.id,
      customerName: form.customer.name,
      channel: form.channel,
      datetime: form.datetime,
      products: cleanProducts.map(row => ({
        productId: row.product.id,
        productName: row.product.name,
        price: Number(row.price),
        quantity: Number(row.quantity),
        subtotal: Number(row.subtotal || row.price * row.quantity || 0),
      })),
      totalAmount,
    };

    setSubmitting(true);
    let ok = false;
    if (editMode && editId) {
      ok = await updateSale(editId, salePayload);
    } else {
      ok = await addSale(salePayload);
    }
    setSubmitting(false);

    if (ok) {
      setForm({ ...initialForm, datetime: new Date(), products: [{ product: null, price: 0, quantity: 1, subtotal: 0 }] });
      setModalOpen(false);
      setFormError(""); // clear error after success
    } else {
      setFormError("Failed to save sale. Please try again.");
    }
  };

  return (
    <div className="main-content">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#223163]">Sales Dashboard</h1>
          <button
            className="bg-[#2563eb] text-white font-bold px-5 py-2 rounded-lg shadow hover:bg-[#1a4ecb] transition"
            onClick={openAddModal}
          >
            + Add Sale
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <SummaryCard label="Today" value={totals.daily} icon="💸" color="#2563eb" />
          <SummaryCard label="This Week" value={totals.weekly} icon="📆" color="#38b2ac" />
          <SummaryCard label="This Month" value={totals.monthly} icon="📈" color="#6C63FF" />
          <SummaryCard label="This Year" value={totals.yearly} icon="🎯" color="#FF6F91" />
        </div>
        <SalesLineGraph
          data={chartData}
          chartView={chartView}
          setChartView={setChartView}
        />
        <RecentSalesSection user={user} sales={sales} />
      </div>
      <SaleModal
        open={modalOpen}
        user={user}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        form={form}
        setForm={setForm}
        customers={customers}
        customersLoading={customersLoading}
        customerQuery={customerQuery}
        setCustomerQuery={setCustomerQuery}
        productQuery={productQuery}
        setProductQuery={setProductQuery}
        formError={formError}
        submitting={submitting}
        editMode={editMode}
      />
    </div>
  );
}
