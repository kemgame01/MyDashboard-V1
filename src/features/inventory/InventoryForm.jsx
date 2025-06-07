import React from "react";

const InventoryForm = ({
  form,
  handleChange,
  handleSave,
  isSubmitting,
  closeForm,
  brands,
  categories,
  subcategories,
  newBrand,
  setNewBrand,
  addBrand,
  newCategory,
  setNewCategory,
  addCategory,
  newSubcategory,
  setNewSubcategory,
  addSubcategory,
}) => (
  <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center">
    <form
      className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-lg relative z-50"
      onSubmit={handleSave}
    >
      <button
        className="absolute right-4 top-4 text-gray-400"
        type="button"
        onClick={closeForm}
        disabled={isSubmitting}
      >
        ✕
      </button>
      <h2 className="text-xl font-bold mb-4">
        {form.id ? "Edit" : "Add"} Inventory Item
      </h2>
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        required
        className="w-full mb-2 p-2 border rounded-xl"
        placeholder="Product Name"
        disabled={isSubmitting}
      />
      <input
        name="sku"
        value={form.sku}
        onChange={handleChange}
        className="w-full mb-2 p-2 border rounded-xl"
        placeholder="SKU/Barcode"
        disabled={isSubmitting}
      />
      <div className="flex gap-2 mb-2">
        <select
          name="brand"
          value={form.brand}
          onChange={handleChange}
          className="flex-1 p-2 border rounded-xl"
          required
          disabled={isSubmitting}
        >
          <option value="">Select Brand</option>
          {brands.map((b) => (
            <option key={b.id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="New brand"
          value={newBrand}
          onChange={(e) => setNewBrand(e.target.value)}
          className="p-2 border rounded-xl w-28"
          disabled={isSubmitting}
        />
        <button
          type="button"
          onClick={addBrand}
          className="bg-blue-200 px-2 rounded"
          disabled={isSubmitting}
        >
          Add
        </button>
      </div>
      <div className="flex gap-2 mb-2">
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="flex-1 p-2 border rounded-xl"
          required
          disabled={isSubmitting}
        >
          <option value="">Select Category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="New category"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="p-2 border rounded-xl w-28"
          disabled={isSubmitting}
        />
        <button
          type="button"
          onClick={addCategory}
          className="bg-green-200 px-2 rounded"
          disabled={isSubmitting}
        >
          Add
        </button>
      </div>
      <div className="flex gap-2 mb-2">
        <select
          name="subcategory"
          value={form.subcategory}
          onChange={handleChange}
          className="flex-1 p-2 border rounded-xl"
          disabled={isSubmitting}
        >
          <option value="">Select Subcategory</option>
          {subcategories.map((sub, i) => (
            <option key={i} value={sub}>
              {sub}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="New subcat."
          value={newSubcategory}
          onChange={(e) => setNewSubcategory(e.target.value)}
          className="p-2 border rounded-xl w-28"
          disabled={isSubmitting}
        />
        <button
          type="button"
          onClick={addSubcategory}
          className="bg-yellow-200 px-2 rounded"
          disabled={isSubmitting}
        >
          Add
        </button>
      </div>
      <input
        name="quantity"
        value={form.quantity}
        onChange={handleChange}
        required
        type="number"
        min="0"
        className="w-full mb-2 p-2 border rounded-xl"
        placeholder="Quantity"
        disabled={isSubmitting}
      />
      <input
        name="minStock"
        value={form.minStock}
        onChange={handleChange}
        required
        type="number"
        min="0"
        className="w-full mb-2 p-2 border rounded-xl"
        placeholder="Min Stock"
        disabled={isSubmitting}
      />
      <input
        name="unitPrice"
        value={form.unitPrice}
        onChange={handleChange}
        required
        type="number"
        min="0"
        className="w-full mb-2 p-2 border rounded-xl"
        placeholder="Unit Price"
        disabled={isSubmitting}
      />
      <input
        name="supplier"
        value={form.supplier}
        onChange={handleChange}
        className="w-full mb-2 p-2 border rounded-xl"
        placeholder="Supplier"
        disabled={isSubmitting}
      />
      <input
        name="location"
        value={form.location}
        onChange={handleChange}
        className="w-full mb-2 p-2 border rounded-xl"
        placeholder="Location (e.g. shelf)"
        disabled={isSubmitting}
      />
      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        className="w-full mb-2 p-2 border rounded-xl"
        placeholder="Description"
        disabled={isSubmitting}
      />
      <button
        type="submit"
        className={`w-full py-2 rounded-xl font-bold mt-2 ${
          isSubmitting
            ? "bg-gray-400 text-white"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
        disabled={isSubmitting}
      >
        {isSubmitting
          ? "Saving..."
          : form.id
          ? "Update Item"
          : "Add Item"}
      </button>
    </form>
  </div>
);

export default InventoryForm;
