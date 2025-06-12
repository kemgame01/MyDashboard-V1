// src/lib/validationUtils.js

/**
 * Validates the sale form data.
 * @param {Object} form - The form state from SaleModal.
 * @returns {{isValid: boolean, errors: Array<string>}}
 */
export function validateSaleForm(form) {
  const errors = [];
  if (!form.customer) {
    errors.push("Customer is required.");
  }
  if (!form.channel) {
    errors.push("Sales channel is required.");
  }
  if (!form.datetime) {
    errors.push("Date and time are required.");
  }
  if (!Array.isArray(form.products) || form.products.length === 0) {
    errors.push("At least one product is required.");
  } else {
    form.products.forEach((p, idx) => {
      if (!p.product) {
        errors.push(`Product #${idx + 1} is missing.`);
      }
      if (!p.quantity || Number(p.quantity) <= 0) {
        errors.push(`Quantity for Product #${idx + 1} must be greater than 0.`);
      }
      if (p.price === null || Number(p.price) < 0) {
        errors.push(`Price for Product #${idx + 1} is required.`);
      }
    });
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Prepares the form data for submission to Firestore.
 * @param {Object} form - The validated form state.
 * @param {{user: Object, shopContext: Object}} context - User and shop info.
 * @returns {Object} The formatted data object for Firestore.
 */
export function prepareSaleData(form, context) {
  const { user, shopContext } = context;
  const totalAmount = form.products.reduce((sum, p) => sum + (p.subtotal || 0), 0);

  return {
    // Customer Info
    customerId: form.customer.id,
    customerName: form.customer.name,
    
    // Sale Info
    channel: form.channel,
    date: form.datetime, // Use 'date' to be consistent with other parts of the app
    totalAmount: totalAmount,
    
    // Products Array
    products: form.products.map(p => ({
      productId: p.product.id,
      productName: p.product.name,
      quantity: Number(p.quantity),
      price: Number(p.price),
      subtotal: Number(p.subtotal),
    })),

    // Context Info
    userId: user.uid,
    userEmail: user.email,
    shopId: shopContext?.shopId || null,
    shopName: shopContext?.shopName || null,
  };
}

/**
 * Formats an array of validation errors into a single string.
 * @param {Array<string>} errors - The array of error messages.
 * @returns {string} A formatted string.
 */
export function formatValidationErrors(errors) {
  return errors.join(" ");
}