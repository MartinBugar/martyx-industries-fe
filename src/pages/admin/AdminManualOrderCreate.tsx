import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, X, CheckCircle } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminUsers.css';
import './AdminButtonOverrides.css';
import {
  manualOrdersService,
  type ManualOrderCreateRequest,
  type ProductVariantDTO,
  type ManualOrderCreateResponse,
} from '../../services/manualOrdersService';
import { Button } from '../../components/ui';

const AdminManualOrderCreate: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH_IN_STORE');
  const [storeLocation, setStoreLocation] = useState<string>('');
  const [storeEmployeeName, setStoreEmployeeName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Billing address state
  const [billingStreet, setBillingStreet] = useState<string>('');
  const [billingCity, setBillingCity] = useState<string>('');
  const [billingPostalCode, setBillingPostalCode] = useState<string>('');
  const [billingCountry, setBillingCountry] = useState<string>('Slovakia');
  const [companyName, setCompanyName] = useState<string>('');
  const [ico, setIco] = useState<string>('');
  const [dic, setDic] = useState<string>('');
  const [icDph, setIcDph] = useState<string>('');
  const [isCompanyOrder, setIsCompanyOrder] = useState<boolean>(false);

  // Product selection
  const [products, setProducts] = useState<ProductVariantDTO[]>([]);
  const [selectedItems, setSelectedItems] = useState<Array<{ variantId: number; quantity: number; product: ProductVariantDTO }>>([]);

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<ManualOrderCreateResponse | null>(null);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [productLoadError, setProductLoadError] = useState<string | null>(null);

  // Load available products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoadingProducts(true);
    setProductLoadError(null);
    try {
      const data = await manualOrdersService.getAvailableProducts();
      setProducts(data);
    } catch (e) {
      const errorMsg = 'Failed to load products: ' + (e instanceof Error ? e.message : 'Unknown error');
      setProductLoadError(errorMsg);
    } finally {
      setLoadingProducts(false);
    }
  };

  const addProduct = (variantId: number) => {
    const product = products.find((p) => p.variantId === variantId);
    if (!product) return;

    // Check if already added
    if (selectedItems.some((item) => item.variantId === variantId)) {
      setError('Product already added');
      return;
    }

    setSelectedItems([...selectedItems, { variantId, quantity: 1, product }]);
    setError(null);
  };

  const removeProduct = (variantId: number) => {
    setSelectedItems(selectedItems.filter((item) => item.variantId !== variantId));
  };

  const updateQuantity = (variantId: number, quantity: number) => {
    if (quantity < 1) return;
    setSelectedItems(
      selectedItems.map((item) => (item.variantId === variantId ? { ...item, quantity } : item))
    );
  };

  const calculateTotal = (): number => {
    return selectedItems.reduce((sum, item) => {
      const price = parseFloat(item.product.priceWithVat.replace(/[^0-9.,]/g, '').replace(',', '.'));
      return sum + price * item.quantity;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!recipientEmail || !recipientEmail.trim()) {
      setError('Customer email is required');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (selectedItems.length === 0) {
      setError('Please add at least one product');
      return;
    }

    // Quantity validation
    const invalidItems = selectedItems.filter(item => item.quantity < 1);
    if (invalidItems.length > 0) {
      setError('All products must have a quantity of at least 1');
      return;
    }

    // Check for duplicate products
    const variantIds = selectedItems.map(item => item.variantId);
    const uniqueIds = new Set(variantIds);
    if (variantIds.length !== uniqueIds.size) {
      setError('Duplicate products detected. Please remove duplicates.');
      return;
    }

    setLoading(true);

    try {
      const request: ManualOrderCreateRequest = {
        recipientEmail,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        items: selectedItems.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        paymentMethod,
        storeLocation: storeLocation || undefined,
        storeEmployeeName: storeEmployeeName || undefined,
        notes: notes || undefined,
        billingAddress: (billingStreet || billingCity || companyName) ? {
          street: billingStreet || undefined,
          city: billingCity || undefined,
          postalCode: billingPostalCode || undefined,
          country: billingCountry || undefined,
          companyName: isCompanyOrder ? (companyName || undefined) : undefined,
          ico: isCompanyOrder ? (ico || undefined) : undefined,
          dic: isCompanyOrder ? (dic || undefined) : undefined,
          icDph: isCompanyOrder ? (icDph || undefined) : undefined,
        } : undefined,
      };

      const response = await manualOrdersService.createManualOrder(request);
      setSuccess(response);

      // Clear form
      setRecipientEmail('');
      setFirstName('');
      setLastName('');
      setPaymentMethod('CASH_IN_STORE');
      setStoreLocation('');
      setStoreEmployeeName('');
      setNotes('');
      setSelectedItems([]);
      setBillingStreet('');
      setBillingCity('');
      setBillingPostalCode('');
      setBillingCountry('Slovakia');
      setCompanyName('');
      setIco('');
      setDic('');
      setIcDph('');
      setIsCompanyOrder(false);
    } catch (e) {
      setError('Failed to create order: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRecipientEmail('');
    setFirstName('');
    setLastName('');
    setPaymentMethod('CASH_IN_STORE');
    setStoreLocation('');
    setStoreEmployeeName('');
    setNotes('');
    setSelectedItems([]);
    setBillingStreet('');
    setBillingCity('');
    setBillingPostalCode('');
    setBillingCountry('Slovakia');
    setCompanyName('');
    setIco('');
    setDic('');
    setIcDph('');
    setIsCompanyOrder(false);
    setError(null);
    setSuccess(null);
  };

  const navTabs = (
    <nav className="dashboard-tabs">
      <button className="dashboard-tab active" aria-label="Create manual order">
        Create Manual Order
      </button>
      <button
        className="dashboard-tab"
        onClick={() => navigate('/admin/manual-orders/history')}
        aria-label="View manual order history"
      >
        Order History
      </button>
    </nav>
  );

  return (
    <AdminLayout title="Manual Order Creation" navTabs={navTabs}>
      <div className="admin-page">
        <div className="admin-container">
          {/* Success Message */}
          {success && (
            <div className="alert alert-success" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={24} />
                <div>
                  <strong>Order Created Successfully!</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
                    Order #{success.orderNumber} | Invoice #{success.invoiceNumber}
                    <br />
                    Email sent to: {success.recipientEmail}
                    {success.downloadLinks.length > 0 && (
                      <>
                        <br />
                        {success.downloadLinks.length} digital product(s) included
                      </>
                    )}
                  </p>
                  <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSuccess(null)}
                    >
                      Create Another Order
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/admin/manual-orders/history')}
                    >
                      View History
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && <div className="alert alert-error">{error}</div>}

          {/* Main Form */}
          <form onSubmit={handleSubmit}>
            <div className="admin-card" style={{ marginBottom: '20px' }}>
              <h3 className="section-title">Customer Information</h3>
              <div className="form-grid">
                <div className="form-field-full">
                  <label className="form-label">Customer Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="customer@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>

            <div className="admin-card" style={{ marginBottom: '20px' }}>
              <h3 className="section-title">Billing Address (Optional)</h3>
              <div className="form-grid">
                <div className="form-field-full">
                  <label className="form-label">
                    <input
                      type="checkbox"
                      checked={isCompanyOrder}
                      onChange={(e) => setIsCompanyOrder(e.target.checked)}
                      style={{ marginRight: '8px' }}
                    />
                    This is a company order (B2B)
                  </label>
                </div>

                {isCompanyOrder && (
                  <>
                    <div className="form-field-full">
                      <label className="form-label">Company Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Company s.r.o."
                      />
                    </div>
                    <div>
                      <label className="form-label">IČO</label>
                      <input
                        type="text"
                        className="form-input"
                        value={ico}
                        onChange={(e) => setIco(e.target.value)}
                        placeholder="12345678"
                      />
                    </div>
                    <div>
                      <label className="form-label">DIČ</label>
                      <input
                        type="text"
                        className="form-input"
                        value={dic}
                        onChange={(e) => setDic(e.target.value)}
                        placeholder="1234567890"
                      />
                    </div>
                    <div>
                      <label className="form-label">IČ DPH</label>
                      <input
                        type="text"
                        className="form-input"
                        value={icDph}
                        onChange={(e) => setIcDph(e.target.value)}
                        placeholder="SK1234567890"
                      />
                    </div>
                  </>
                )}

                <div className="form-field-full">
                  <label className="form-label">Street Address</label>
                  <input
                    type="text"
                    className="form-input"
                    value={billingStreet}
                    onChange={(e) => setBillingStreet(e.target.value)}
                    placeholder="Main Street 123"
                  />
                </div>
                <div>
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-input"
                    value={billingCity}
                    onChange={(e) => setBillingCity(e.target.value)}
                    placeholder="Bratislava"
                  />
                </div>
                <div>
                  <label className="form-label">Postal Code</label>
                  <input
                    type="text"
                    className="form-input"
                    value={billingPostalCode}
                    onChange={(e) => setBillingPostalCode(e.target.value)}
                    placeholder="81101"
                  />
                </div>
                <div>
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    className="form-input"
                    value={billingCountry}
                    onChange={(e) => setBillingCountry(e.target.value)}
                    placeholder="Slovakia"
                  />
                </div>
              </div>
            </div>

            <div className="admin-card" style={{ marginBottom: '20px' }}>
              <h3 className="section-title">Products</h3>

              {/* Product Load Error with Retry */}
              {productLoadError && (
                <div className="alert alert-error" style={{ marginBottom: '20px' }}>
                  <div>{productLoadError}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadProducts}
                    disabled={loadingProducts}
                    style={{ marginTop: '8px' }}
                  >
                    Retry Loading Products
                  </Button>
                </div>
              )}

              {/* Product Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Add Product</label>
                <select
                  className="form-input"
                  onChange={(e) => {
                    if (e.target.value) {
                      addProduct(Number(e.target.value));
                      e.target.value = '';
                    }
                  }}
                  disabled={loadingProducts || !!productLoadError}
                >
                  <option value="">
                    {loadingProducts ? 'Loading products...' :
                     productLoadError ? 'Failed to load products' :
                     'Select a product...'}
                  </option>
                  {products.map((product) => (
                    <option key={product.variantId} value={product.variantId}>
                      {product.masterProductName} - {product.variantName} ({product.sku}) - {product.priceWithVat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Products Table */}
              {selectedItems.length > 0 && (
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th style={{ width: '100px' }}>Quantity</th>
                        <th style={{ width: '120px' }}>Unit Price</th>
                        <th style={{ width: '120px' }}>Subtotal</th>
                        <th style={{ width: '80px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItems.map((item) => {
                        const price = parseFloat(
                          item.product.priceWithVat.replace(/[^0-9.,]/g, '').replace(',', '.')
                        );
                        const subtotal = price * item.quantity;

                        return (
                          <tr key={item.variantId}>
                            <td>
                              <div>{item.product.masterProductName}</div>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                {item.product.variantName}
                              </div>
                            </td>
                            <td>{item.product.sku}</td>
                            <td>
                              <input
                                type="number"
                                min="1"
                                className="form-input"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateQuantity(item.variantId, parseInt(e.target.value) || 1)
                                }
                                style={{ width: '80px', padding: '4px 8px' }}
                              />
                            </td>
                            <td>{item.product.priceWithVat}</td>
                            <td>€{subtotal.toFixed(2)}</td>
                            <td>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => removeProduct(item.variantId)}
                                type="button"
                              >
                                <X size={14} />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                          Total:
                        </td>
                        <td style={{ fontWeight: 'bold' }}>€{calculateTotal().toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {selectedItems.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                  <ShoppingCart size={48} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                  <p>No products selected. Add products from the dropdown above.</p>
                </div>
              )}
            </div>

            <div className="admin-card" style={{ marginBottom: '20px' }}>
              <h3 className="section-title">Payment & Store Information</h3>
              <div className="form-grid">
                <div>
                  <label className="form-label">Payment Method *</label>
                  <select
                    className="form-input"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                  >
                    <option value="CASH_IN_STORE">Cash in Store</option>
                    <option value="CARD_IN_STORE">Card in Store</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Store Location</label>
                  <input
                    type="text"
                    className="form-input"
                    value={storeLocation}
                    onChange={(e) => setStoreLocation(e.target.value)}
                    placeholder="e.g., Bratislava - Centrum"
                  />
                </div>
                <div className="form-field-full">
                  <label className="form-label">Employee Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={storeEmployeeName}
                    onChange={(e) => setStoreEmployeeName(e.target.value)}
                    placeholder="Salesperson name"
                  />
                </div>
                <div className="form-field-full">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes about this order..."
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Creating Order...' : 'Create Order'}
              </Button>
              <Button variant="outline" type="button" onClick={handleReset} disabled={loading}>
                Reset Form
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => navigate('/admin/orders')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminManualOrderCreate;
