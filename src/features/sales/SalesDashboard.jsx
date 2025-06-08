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

const initialForm = {
  customer: null,
  product: null,
  amount: "",
  channel: "",
  date: "",
};

export default function SalesDashboard({ user }) {
  // --- Hooks for main data ---
  const { sales, loading, addSale, updateSale, totals, monthlyLog } = useSales(user);
  const inventory = useInventory(user);
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
    setForm(initialForm);
    setFormError("");
    setEditMode(false);
    setModalOpen(true);
    setProductQuery("");
  };

  const openEditModal = (sale) => {
    setForm({
      customer: { id: sale.customerId, name: sale.customerName },
      product: sale.product ? { id: sale.productId, name: sale.productName }
        : (Array.isArray(sale.products) && sale.products[0])
          ? { id: sale.products[0].productId, name: sale.products[0].productName }
          : null,
      amount: sale.amount || (Array.isArray(sale.products) && sale.products[0]?.amount) || "",
      channel: sale.channel,
      date: sale.date?.toDate ? sale.date.toDate().toISOString().slice(0, 10) : (sale.date || ""),
    });
    setEditId(sale.id);
    setEditMode(true);
    setFormError("");
    setModalOpen(true);
    setProductQuery("");
  };

  // --- Submit logic ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.customer || !form.product || !form.amount || !form.channel || !form.date) {
      setFormError("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    const payload = {
      customerId: form.customer.id,
      customerName: form.customer.name,
      productId: form.product.id,
      productName: form.product.name,
      amount: Number(form.amount),
      channel: form.channel,
      date: new Date(form.date),
    };
    let ok = false;
    if (editMode && editId) {
      ok = await updateSale(editId, payload);
    } else {
      ok = await addSale(payload);
    }
    setSubmitting(false);
    if (ok) {
      setForm(initialForm);
      setModalOpen(false);
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
        {/* --- Use new RecentSalesSection below --- */}
        <RecentSalesSection user={user} sales={sales} />
      </div>
      <SaleModal
        open={modalOpen}
        user={user}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        form={form}
        setForm={setForm}
        productQuery={productQuery}
        setProductQuery={setProductQuery}
        customers={customers}
        customersLoading={customersLoading}
        customerQuery={customerQuery}
        setCustomerQuery={setCustomerQuery}
        formError={formError}
        submitting={submitting}
        editMode={editMode}
      />
    </div>
  );
}
