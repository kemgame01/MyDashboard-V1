import React from "react";
import SalesCombobox from "../../components/SalesCombobox";
import InputField from "../../components/InputField";
import useProducts from "../../hooks/useProducts"; // default export

const defaultProduct = { product: null, amount: "" };

export default function ProductItemFields({
  idx,
  product,
  onProductChange,
  onAmountChange,
  onRemove,
  productQuery,
  setProductQuery,
  canRemove,
}) {
  const safeProduct = product || defaultProduct;

  // Only query when user typed at least 2 characters
  const [products, loadingProducts] = useProducts(
    safeProduct.product,
    productQuery && productQuery.length >= 2 ? productQuery : ""
  );

  const comboboxInput =
    safeProduct.product && !productQuery
      ? safeProduct.product.name
      : productQuery;

  return (
    <div className="mb-4 flex flex-col gap-2">
      <SalesCombobox
        label={idx === 0 ? "Product" : ""}
        value={safeProduct.product}
        onChange={prod => {
          onProductChange(prod);
          setProductQuery(""); // reset input after select
        }}
        inputValue={comboboxInput}
        onInputChange={val => {
          setProductQuery(val);
          if (val) onProductChange(null);
        }}
        options={Array.isArray(products) ? products : []}
        loading={loadingProducts}
        placeholder="Type to search products"
        displayKey="name"
        required
      />
      <InputField
        label="Amount (฿)"
        name="amount"
        type="number"
        min="1"
        value={safeProduct.amount || ""}
        onChange={e => onAmountChange(e.target.value)}
        required
        className="w-full"
      />
      {canRemove && (
        <div className="flex justify-end">
          <button
            type="button"
            className="text-red-500 px-3 py-1 rounded hover:bg-red-50"
            onClick={onRemove}
            title="Remove"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
