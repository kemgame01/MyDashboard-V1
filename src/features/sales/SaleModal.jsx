import React, { useEffect } from "react";
import Modal from "../../components/Modal";
import SalesCombobox from "../../components/SalesCombobox";
import InputField from "../../components/InputField";
import { useInventory } from "../../hooks/useInventory";
import DatePicker from "react-datepicker";
import SaleProductTable from "./SaleProductTable"; // <<-- new import
import "react-datepicker/dist/react-datepicker.css";

const channelOptions = [
  "Facebook", "LINE", "Shopee", "Lazada", "Other"
];

const normalize = str => (str || "").toString().normalize("NFC").toLowerCase();

export default function SaleModal({
  open,
  onClose,
  onSubmit,
  form,
  setForm,
  customers,
  customersLoading,
  customerQuery,
  setCustomerQuery,
  formError,
  submitting,
  editMode,
  user
}) {
  const inventory = useInventory(user);
  const productsList = inventory.inventory || [];
  const productsLoading = inventory.loading;

  // Filter customers for combobox
  const filteredCustomers = React.useMemo(() => {
    if (!Array.isArray(customers) || !customerQuery || customerQuery.length < 2) return [];
    const q = normalize(customerQuery);
    return customers.filter(
      c =>
        (c.name && normalize(c.name).includes(q)) ||
        (c.phoneNumber && normalize(c.phoneNumber).includes(q))
    );
  }, [customers, customerQuery]);

  // Handlers
  const handleField = key => e => setForm(f => ({ ...f, [key]: e.target.value }));
  const handleDateChange = datetime => setForm(f => ({ ...f, datetime }));

  // Product row logic
  const handleProductInputChange = (idx, input) => {
    setForm(f => {
      const newProducts = [...f.products];
      newProducts[idx] = {
        ...newProducts[idx],
        productInput: input,
        product:
          input &&
          newProducts[idx].product &&
          newProducts[idx].product.name === input
            ? newProducts[idx].product
            : null,
      };
      return { ...f, products: newProducts };
    });
  };

  const handleProductChange = (idx, prod) => {
    setForm(f => {
      const newProducts = [...f.products];
      let price = prod && prod.price ? prod.price : 0;
      newProducts[idx] = {
        ...newProducts[idx],
        product: prod,
        productInput: prod ? prod.name : "",
        price,
        subtotal: price * (newProducts[idx].quantity || 1),
      };
      return { ...f, products: newProducts };
    });
  };

  const handleQuantityChange = (idx, quantity) => {
    setForm(f => {
      const newProducts = [...f.products];
      const qty = Number(quantity) || 1;
      const price = newProducts[idx].price || 0;
      newProducts[idx] = {
        ...newProducts[idx],
        quantity: qty,
        subtotal: qty * price,
      };
      return { ...f, products: newProducts };
    });
  };
  const handlePriceChange = (idx, price) => {
    setForm(f => {
      const newProducts = [...f.products];
      const pr = Number(price) || 0;
      const qty = newProducts[idx].quantity || 1;
      newProducts[idx] = {
        ...newProducts[idx],
        price: pr,
        subtotal: pr * qty,
      };
      return { ...f, products: newProducts };
    });
  };
  const addProductRow = () => {
    setForm(f => ({
      ...f,
      products: [
        ...f.products,
        { product: null, productInput: "", price: 0, quantity: 1, subtotal: 0 }
      ]
    }));
  };
  const removeProductRow = idx => {
    setForm(f => ({
      ...f,
      products: f.products.length === 1
        ? f.products // prevent removal if only one
        : f.products.filter((_, i) => i !== idx)
    }));
  };

  // --- FIX: Only ensure a product row exists when modal opens, not every products update
  useEffect(() => {
    if (open) {
      setForm(f => {
        let prods = Array.isArray(f.products) ? f.products : [];
        prods = prods.map(row => ({
          productInput: row.productInput ?? row.product?.name ?? "",
          ...row,
        }));
        if (prods.length === 0) {
          prods = [{ product: null, productInput: "", price: 0, quantity: 1, subtotal: 0 }];
        }
        return { ...f, products: prods };
      });
    }
    // eslint-disable-next-line
  }, [open]);

  return (
    <Modal isOpen={open} onClose={onClose}>
      <div className="w-full sm:min-w-[390px]">
        <h2 className="text-xl font-bold mb-6 text-[#223163]">{editMode ? "Edit Sale" : "Add Sale"}</h2>
        {formError && <div className="mb-2 text-red-500">{formError}</div>}
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4">

          {/* Customer */}
          <SalesCombobox
            label="Customer"
            value={form.customer}
            onChange={c => setForm(f => ({ ...f, customer: c }))}
            inputValue={customerQuery}
            onInputChange={setCustomerQuery}
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

          {/* Channel */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Channel<span className="text-red-500 ml-1">*</span></label>
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
              selected={form.datetime instanceof Date ? form.datetime : new Date(form.datetime)}
              onChange={handleDateChange}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={5}
              dateFormat="dd/MM/yyyy HH:mm"
              placeholderText="Select date and time"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb] bg-white text-[#223163] font-semibold placeholder-gray-400"
              popperClassName="z-50"
              todayButton="Today"
              required
            />
          </div>

          {/* Product Table (modularized!) */}
          <SaleProductTable
            products={form.products || []}
            productsList={productsList}
            productsLoading={productsLoading}
            onProductChange={handleProductChange}
            onProductInputChange={handleProductInputChange}
            onQuantityChange={handleQuantityChange}
            onPriceChange={handlePriceChange}
            onAddRow={addProductRow}
            onRemoveRow={removeProductRow}
          />

          {/* Submit */}
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
