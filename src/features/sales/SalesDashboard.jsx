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
      productInput: "",
      price: 0,
      quantity: 1,
      subtotal: 0,
    }
  ],
};

export default function SalesDashboard({ user, shopContext }) {
  // --- Hooks for main data ---
  const { sales, loading, addSale, updateSale, totals, monthlyLog } = useSales(user);
  const inventory = useInventory(user);
  const [customerQuery, setCustomerQuery] = useState("");
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
      products: [{ product: null, productInput: "", price: 0, quantity: 1, subtotal: 0 }]
    });
    setFormError("");
    setEditMode(false);
    setEditId(null);
    setModalOpen(true);
    setCustomerQuery("");
  };

  const openEditModal = (sale) => {
    // Prepare form data from existing sale
    const saleDate = sale.datetime?.toDate ? sale.datetime.toDate()
      : sale.date?.toDate ? sale.date.toDate()
      : sale.createdAt?.toDate ? sale.createdAt.toDate()
      : new Date();

    setForm({
      customer: { 
        id: sale.customerId, 
        name: sale.customerName,
        phoneNumber: sale.customerPhone || ""
      },
      channel: sale.channel || "",
      datetime: saleDate,
      products: (sale.products && Array.isArray(sale.products))
        ? sale.products.map(row => ({
            product: row.productId && row.productName
              ? { id: row.productId, name: row.productName }
              : null,
            productInput: row.productName || "",
            price: Number(row.price || 0),
            quantity: Number(row.quantity || 1),
            subtotal: Number(row.subtotal || row.price * row.quantity || 0),
        }))
        : [{ product: null, productInput: "", price: 0, quantity: 1, subtotal: 0 }],
    });
    setEditId(sale.id);
    setEditMode(true);
    setFormError("");
    setModalOpen(true);
    setCustomerQuery(sale.customerName || "");
  };

  // --- Submit logic: robust validation and clean-up ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    // Validation
    if (!form.customer || !form.customer.id) {
      setFormError("Please select a customer.");
      return;
    }
    if (!form.channel) {
      setFormError("Please select a channel.");
      return;
    }
    if (!form.datetime) {
      setFormError("Please select date and time.");
      return;
    }

    // Defensive: filter out empty/blank product rows
    const cleanProducts = (form.products || []).filter(row =>
      row.product && row.product.id && row.product.name &&
      Number(row.quantity) > 0 && Number(row.price) >= 0
    );
    
    if (!Array.isArray(cleanProducts) || cleanProducts.length === 0) {
      setFormError("Please add at least one product.");
      return;
    }

    // Validate each product
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
      customerPhone: form.customer.phoneNumber || "",
      channel: form.channel,
      datetime: form.datetime,
      date: form.datetime, // Keep both for compatibility
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
    let success = false;
    
    try {
      if (editMode && editId) {
        success = await updateSale(editId, salePayload);
      } else {
        success = await addSale(salePayload);
      }
      
      if (success) {
        setForm({ ...initialForm, datetime: new Date(), products: [{ product: null, productInput: "", price: 0, quantity: 1, subtotal: 0 }] });
        setModalOpen(false);
        setFormError("");
        setEditMode(false);
        setEditId(null);
      } else {
        setFormError(editMode ? "Failed to update sale. Please try again." : "Failed to add sale. Please try again.");
      }
    } catch (error) {
      console.error("Sale submission error:", error);
      setFormError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="main-content">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#223163]">Sales Dashboard</h1>
            {shopContext && (
              <p className="text-gray-600 text-sm mt-1">
                Sales for: <span className="font-semibold">{shopContext.shopName}</span>
              </p>
            )}
          </div>
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
        
        <RecentSalesSection 
          user={user} 
          sales={sales} 
          shopContext={shopContext}
          onEditSale={openEditModal}
        />
      </div>
      
      <SaleModal
        open={modalOpen}
        user={user}
        onClose={() => {
          setModalOpen(false);
          setEditMode(false);
          setEditId(null);
          setFormError("");
        }}
        onSubmit={handleSubmit}
        form={form}
        setForm={setForm}
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