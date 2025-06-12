// src/features/sales/components/SaleModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Search } from 'lucide-react';

const SaleModal = ({
  isOpen,
  mode = 'add',
  editingSale = null,
  user,
  shopContext,
  customers = [],
  customersLoading,
  onSubmit,
  onClose
}) => {
  // Form state
  const [formData, setFormData] = useState({
    customer: null,
    channel: '',
    datetime: new Date().toISOString().slice(0, 16),
    products: [{ product: null, price: 0, quantity: 1, subtotal: 0 }]
  });
  
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [activeProductIndex, setActiveProductIndex] = useState(null);

  // Mock products - replace with actual inventory hook
  const products = useMemo(() => [
    { id: '1', name: '5LB Original', price: 1990 },
    { id: '2', name: 'Whey Protein', price: 2500 },
    { id: '3', name: 'BCAA Supplement', price: 1200 },
    { id: '4', name: 'Pre-Workout', price: 1800 },
    { id: '5', name: 'Creatine Monohydrate', price: 800 },
    { id: '6', name: 'Mass Gainer', price: 3200 },
    { id: '7', name: 'Fat Burner', price: 1500 },
    { id: '8', name: 'Amino Acids', price: 1100 }
  ], []);

  // Available channels
  const channels = [
    'Facebook',
    'Instagram', 
    'Line',
    'In-Store',
    'Website',
    'Phone',
    'Email'
  ];

  // Filter customers and products
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers.slice(0, 10);
    return customers.filter(customer =>
      customer.firstName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.lastName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.email?.toLowerCase().includes(customerSearch.toLowerCase())
    ).slice(0, 10);
  }, [customers, customerSearch]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products.slice(0, 10);
    return products.filter(product =>
      product.name?.toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 10);
  }, [products, productSearch]);

  // Initialize form when modal opens or editing sale changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && editingSale) {
        setFormData({
          customer: editingSale.customerId ? {
            id: editingSale.customerId,
            name: editingSale.customerName
          } : null,
          channel: editingSale.channel || '',
          datetime: editingSale.datetime?.toDate ? 
            editingSale.datetime.toDate().toISOString().slice(0, 16) :
            new Date(editingSale.datetime || Date.now()).toISOString().slice(0, 16),
          products: editingSale.products?.length > 0 ? 
            editingSale.products.map(p => ({
              product: { id: p.productId, name: p.productName },
              price: Number(p.price || 0),
              quantity: Number(p.quantity || 1),
              subtotal: Number(p.subtotal || p.price * p.quantity || 0)
            })) : 
            [{ product: null, price: 0, quantity: 1, subtotal: 0 }]
        });
      } else {
        setFormData({
          customer: null,
          channel: '',
          datetime: new Date().toISOString().slice(0, 16),
          products: [{ product: null, price: 0, quantity: 1, subtotal: 0 }]
        });
      }
      setErrors({});
      setCustomerSearch('');
      setProductSearch('');
      setShowCustomerDropdown(false);
      setShowProductDropdown(false);
      setActiveProductIndex(null);
    }
  }, [isOpen, mode, editingSale]);

  // Calculate grand total
  const grandTotal = useMemo(() => {
    return formData.products.reduce((sum, product) => {
      return sum + (Number(product.subtotal) || 0);
    }, 0);
  }, [formData.products]);

  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    setFormData(prev => ({
      ...prev,
      customer: {
        id: customer.id,
        name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email
      }
    }));
    setCustomerSearch('');
    setShowCustomerDropdown(false);
    setErrors(prev => ({ ...prev, customer: null }));
  };

  // Handle product selection
  const handleProductSelect = (index, product) => {
    const newProducts = [...formData.products];
    newProducts[index] = {
      ...newProducts[index],
      product: { id: product.id, name: product.name },
      price: product.price || 0,
      subtotal: (product.price || 0) * newProducts[index].quantity
    };
    setFormData(prev => ({ ...prev, products: newProducts }));
    setProductSearch('');
    setShowProductDropdown(false);
    setActiveProductIndex(null);
    setErrors(prev => ({ ...prev, products: null, [`product_${index}`]: null }));
  };

  // Handle product field changes
  const handleProductChange = (index, field, value) => {
    const newProducts = [...formData.products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    
    // Auto-calculate subtotal for price/quantity changes
    if (field === 'price' || field === 'quantity') {
      const price = field === 'price' ? Number(value) : Number(newProducts[index].price);
      const quantity = field === 'quantity' ? Number(value) : Number(newProducts[index].quantity);
      newProducts[index].subtotal = price * quantity;
    }
    
    setFormData(prev => ({ ...prev, products: newProducts }));
    setErrors(prev => ({ ...prev, [`product_${index}`]: null }));
  };

  // Add product row
  const addProductRow = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { product: null, price: 0, quantity: 1, subtotal: 0 }]
    }));
  };

  // Remove product row
  const removeProductRow = (index) => {
    if (formData.products.length > 1) {
      setFormData(prev => ({
        ...prev,
        products: prev.products.filter((_, i) => i !== index)
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.customer) {
      newErrors.customer = 'Customer is required';
    }

    if (!formData.channel) {
      newErrors.channel = 'Channel is required';
    }

    if (!formData.datetime) {
      newErrors.datetime = 'Date and time is required';
    }

    const validProducts = formData.products.filter(p => 
      p.product && p.quantity > 0 && p.price >= 0
    );

    if (validProducts.length === 0) {
      newErrors.products = 'At least one valid product is required';
    }

    formData.products.forEach((product, index) => {
      if (product.product) {
        if (product.quantity <= 0) {
          newErrors[`product_${index}`] = 'Quantity must be greater than 0';
        }
        if (product.price < 0) {
          newErrors[`product_${index}`] = 'Price cannot be negative';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const validProducts = formData.products.filter(p => 
        p.product && p.quantity > 0 && p.price >= 0
      );

      const saleData = {
        customerId: formData.customer.id,
        customerName: formData.customer.name,
        channel: formData.channel,
        datetime: new Date(formData.datetime),
        products: validProducts.map(p => ({
          productId: p.product.id,
          productName: p.product.name,
          price: Number(p.price),
          quantity: Number(p.quantity),
          subtotal: Number(p.subtotal)
        })),
        totalAmount: grandTotal
      };

      const result = await onSubmit(saleData);
      
      if (result.success) {
        onClose();
      } else {
        setErrors({ submit: result.error || 'Failed to save sale' });
      }
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.customer-dropdown')) {
        setShowCustomerDropdown(false);
      }
      if (!event.target.closest('.product-dropdown')) {
        setShowProductDropdown(false);
        setActiveProductIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'edit' ? 'Edit Sale' : 'Add New Sale'}
            {shopContext && <span className="text-sm text-gray-500 ml-2">- {shopContext.shopName}</span>}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Customer Selection */}
            <div className="customer-dropdown">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer *
              </label>
              {formData.customer ? (
                <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                  <span className="font-medium">{formData.customer.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, customer: null }));
                      setErrors(prev => ({ ...prev, customer: null }));
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {showCustomerDropdown && customerSearch && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                      {customersLoading ? (
                        <div className="p-3 text-center text-gray-500">Loading...</div>
                      ) : filteredCustomers.length > 0 ? (
                        filteredCustomers.map(customer => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => handleCustomerSelect(customer)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium">
                              {customer.firstName} {customer.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{customer.email}</div>
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-center text-gray-500">No customers found</div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {errors.customer && <p className="text-red-500 text-sm mt-1">{errors.customer}</p>}
            </div>

            {/* Channel and DateTime */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Channel *
                </label>
                <select
                  value={formData.channel}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, channel: e.target.value }));
                    setErrors(prev => ({ ...prev, channel: null }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select channel</option>
                  {channels.map(channel => (
                    <option key={channel} value={channel}>{channel}</option>
                  ))}
                </select>
                {errors.channel && <p className="text-red-500 text-sm mt-1">{errors.channel}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.datetime}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, datetime: e.target.value }));
                    setErrors(prev => ({ ...prev, datetime: null }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.datetime && <p className="text-red-500 text-sm mt-1">{errors.datetime}</p>}
              </div>
            </div>

            {/* Products */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Products *
                </label>
                <button
                  type="button"
                  onClick={addProductRow}
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>
              </div>

              <div className="space-y-3">
                {formData.products.map((product, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                      {/* Product Selection */}
                      <div className="md:col-span-2 product-dropdown">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Product
                        </label>
                        {product.product ? (
                          <div className="flex items-center justify-between p-2 border border-gray-300 rounded bg-gray-50">
                            <span className="text-sm font-medium">{product.product.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                handleProductChange(index, 'product', null);
                                handleProductChange(index, 'price', 0);
                                handleProductChange(index, 'subtotal', 0);
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Search products..."
                              value={activeProductIndex === index ? productSearch : ''}
                              onChange={(e) => {
                                setProductSearch(e.target.value);
                                setActiveProductIndex(index);
                                setShowProductDropdown(true);
                              }}
                              onFocus={() => {
                                setActiveProductIndex(index);
                                setShowProductDropdown(true);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                            
                            {showProductDropdown && activeProductIndex === index && productSearch && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-32 overflow-y-auto z-10">
                                {filteredProducts.map(prod => (
                                  <button
                                    key={prod.id}
                                    type="button"
                                    onClick={() => handleProductSelect(index, prod)}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-sm"
                                  >
                                    <div className="font-medium">{prod.name}</div>
                                    <div className="text-xs text-gray-500">{prod.price.toLocaleString()}฿</div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Qty
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={product.quantity}
                          onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>

                      {/* Price */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Price (฿)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={product.price}
                          onChange={(e) => handleProductChange(index, 'price', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>

                      {/* Subtotal */}
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Subtotal
                          </label>
                          <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium">
                            {product.subtotal.toLocaleString()}฿
                          </div>
                        </div>
                        {formData.products.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeProductRow(index)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    {errors[`product_${index}`] && (
                      <p className="text-red-500 text-xs mt-2">{errors[`product_${index}`]}</p>
                    )}
                  </div>
                ))}
              </div>
              {errors.products && <p className="text-red-500 text-sm mt-2">{errors.products}</p>}
            </div>

            {/* Grand Total */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Grand Total:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {grandTotal.toLocaleString()}฿
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || grandTotal === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </div>
                ) : (
                  mode === 'edit' ? 'Update Sale' : 'Add Sale'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaleModal;