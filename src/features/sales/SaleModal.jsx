import React from "react";
import Modal from "../../components/Modal";
import SalesCombobox from "../../components/SalesCombobox";
import InputField from "../../components/InputField";
import { useInventory } from "../../hooks/useInventory";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const channelOptions = [
  "Facebook", "LINE", "Shopee", "Lazada", "Other"
];

const normalize = str =>
  (str || "")
    .toString()
    .normalize("NFC")
    .toLowerCase();

export default function SaleModal({
  open,
  onClose,
  onSubmit,
  form,
  setForm,
  productQuery,
  setProductQuery,
  customers,
  customersLoading,
  customerQuery,
  setCustomerQuery,
  formError,
  submitting,
  editMode,
  user
}) {
  // --- Products: get all from inventory
  const inventory = useInventory(user);
  const products = inventory.inventory || [];
  const productsLoading = inventory.loading;

  // Product filter logic
  const filteredProducts = React.useMemo(() => {
    if (!productQuery) return products;
    const q = normalize(productQuery);
    return products.filter(
      p => normalize(p.name).includes(q)
    );
  }, [products, productQuery]);

  // Customer filter logic
  const filteredCustomers = React.useMemo(() => {
    if (!Array.isArray(customers) || !customerQuery || customerQuery.length < 2) return [];
    const q = normalize(customerQuery);
    return customers.filter(
      c =>
        (c.name && normalize(c.name).includes(q)) ||
        (c.phoneNumber && normalize(c.phoneNumber).includes(q))
    );
  }, [customers, customerQuery]);

  // Input value logic
  const customerInputValue = customerQuery || (form.customer && form.customer.name) || "";
  const productInputValue = productQuery || (form.product && form.product.name) || "";

  // Field handler
  const handleField = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  // --- Date Picker: store as Date object ---
  const handleDateChange = date => {
    setForm(f => ({ ...f, date }));
  };

  // Convert form.date to Date (if string), for DatePicker
  const dateValue = form.date
    ? (form.date instanceof Date
        ? form.date
        : new Date(form.date))
    : null;

  return (
    <Modal isOpen={open} onClose={onClose}>
      <div className="w-full sm:min-w-[340px]">
        <h2 className="text-xl font-bold mb-6 text-[#223163]">
          {editMode ? "Edit Sale" : "Add Sale"}
        </h2>
        {formError && <div className="mb-2 text-red-500">{formError}</div>}
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4">

          {/* Customer Combobox */}
          <SalesCombobox
            label="Customer"
            value={form.customer}
            onChange={c => setForm(f => ({ ...f, customer: c }))}
            inputValue={customerInputValue}
            onInputChange={val => {
              setCustomerQuery(val);
              if (form.customer && val !== form.customer.name) {
                setForm(f => ({ ...f, customer: null }));
              }
            }}
            options={filteredCustomers}
            loading={customersLoading}
            placeholder="Type name or phone (min 2 letters)"
            displayKey="name"
            required
            renderOption={c => (
              <>
                {c.name} {c.phoneNumber ? `(${c.phoneNumber})` : ""}
              </>
            )}
          />

          {/* Product Combobox */}
          <SalesCombobox
            label="Product"
            value={form.product}
            onChange={prod => setForm(f => ({ ...f, product: prod }))}
            inputValue={productInputValue}
            onInputChange={val => {
              setProductQuery(val);
              if (form.product && val !== form.product.name) {
                setForm(f => ({ ...f, product: null }));
              }
            }}
            options={filteredProducts}
            loading={productsLoading}
            placeholder="Type to search products"
            displayKey="name"
            required
          />

          {/* Amount Field */}
          <div>
            <label className="block font-medium text-[#223163] mb-2">
              Amount (฿) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              min="1"
              value={form.amount || ""}
              onChange={handleField("amount")}
              required
              placeholder="Enter amount"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb] bg-white text-[#223163] font-semibold placeholder-gray-400"
            />
          </div>

          {/* Channel */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">
              Channel<span className="text-red-500 ml-1">*</span>
            </label>
            <select
              name="channel"
              value={form.channel}
              onChange={handleField("channel")}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb] transition"
              required
            >
              <option value="">Select Channel</option>
              {channelOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Date & Time Picker */}
          <div>
            <label className="block font-medium text-[#223163] mb-2">
              Date & Time <span className="text-red-500">*</span>
            </label>
            <DatePicker
              selected={dateValue}
              onChange={handleDateChange}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={5}
              dateFormat="dd/MM/yyyy HH:mm"
              placeholderText="Select date and time"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb] bg-white text-[#223163] font-semibold placeholder-gray-400"
              popperClassName="z-50"
              required
              // Optional: show today/clear buttons
              todayButton="Today"
              isClearable
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#2563eb] hover:bg-[#1a4ecb] text-white font-bold px-4 py-2 rounded-lg shadow mt-2 transition"
          >
            {submitting
              ? (editMode ? "Saving..." : "Adding...")
              : (editMode ? "Save" : "Add Sale")}
          </button>
        </form>
      </div>
    </Modal>
  );
}
