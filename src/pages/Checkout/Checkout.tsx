import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../context/useCart';
import { useAuth } from '../../context/useAuth';
import './Checkout.css';
import StripeCheckoutButton from '../../components/StripeCheckoutButton';
import { shippingService } from '../../services/shippingService';
import { discountService } from '../../services/discountService';
import { addressService, type SavedAddress } from '../../services/addressService';
import { useGooglePlacesAutocomplete, type ParsedAddress } from '../../hooks/useGooglePlacesAutocomplete';
import type { ShippingOptionDto } from '../../types/shipping';
import type { DiscountValidationDto } from '../../types/discounts';
import {
  trackBeginCheckout,
  trackAddShippingInfo,
  trackAddPaymentInfo
} from '../../services/analyticsService';

// Country list for dropdown
const COUNTRIES = [
  { code: 'SK', name: 'Slovakia' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'AT', name: 'Austria' },
  { code: 'DE', name: 'Germany' },
  { code: 'PL', name: 'Poland' },
  { code: 'HU', name: 'Hungary' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'RO', name: 'Romania' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'HR', name: 'Croatia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'US', name: 'United States' },
];

interface CheckoutFormData {
  // Contact Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Billing Address
  billingStreet: string;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
  billingCountry: string;

  // Shipping Address (if different)
  shipToDifferentAddress: boolean;
  shippingStreet: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;

  // B2B Customer fields
  isCompany: boolean;
  companyName: string;
  companyId: string; // IČO
  taxId: string;     // DIČ
  vatId: string;     // IČ DPH

  // Marketing
  newsletterOptIn: boolean;

  // Legal consents
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation regex (international format: +XXX XXX XXX XXX)
// Supports: +421 900 123 456, +1 234 567 8900, etc.
const PHONE_REGEX = /^\+?[\d\s\-\(\)]{9,20}$/;

// Calculate estimated delivery date
const calculateEstimatedDelivery = (deliveryDays: number): string => {
  const today = new Date();
  let businessDaysAdded = 0;
  let currentDate = new Date(today);

  while (businessDaysAdded < deliveryDays) {
    currentDate.setDate(currentDate.getDate() + 1);
    const dayOfWeek = currentDate.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDaysAdded++;
    }
  }

  return currentDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

const Checkout: React.FC = () => {
  const { t } = useTranslation('checkout');
  const { items, getTotalPrice, removeFromCart, updateQuantity } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [payStatus, setPayStatus] = useState<"idle"|"processing"|"success"|"error">("idle");

  // 3 STEPS: Information → Shipping → Payment
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const [formData, setFormData] = useState<CheckoutFormData>({
    // Contact
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',

    // Billing Address
    billingStreet: '',
    billingCity: '',
    billingState: '',
    billingPostalCode: '',
    billingCountry: 'SK',

    // Shipping Address
    shipToDifferentAddress: false,
    shippingStreet: '',
    shippingCity: '',
    shippingState: '',
    shippingPostalCode: '',
    shippingCountry: 'SK',

    // B2B
    isCompany: false,
    companyName: '',
    companyId: '',
    taxId: '',
    vatId: '',

    // Marketing
    newsletterOptIn: false,

    // Legal consents
    termsAccepted: false,
    privacyAccepted: false,
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Discount code state
  const [discountCode, setDiscountCode] = useState('');
  const [discountValidation, setDiscountValidation] = useState<DiscountValidationDto | null>(null);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState('');

  // Shipping state
  const [shippingOptions, setShippingOptions] = useState<ShippingOptionDto[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOptionDto | null>(null);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState('');

  // Saved Addresses state
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [showSaveAddressOption, setShowSaveAddressOption] = useState(false);

  // Google Places Autocomplete handler
  const handlePlaceSelect = (address: ParsedAddress) => {
    console.log('[Checkout] Google Places address selected:', address);

    setFormData(prev => ({
      ...prev,
      billingStreet: address.street,
      billingCity: address.city,
      billingState: address.state,
      billingPostalCode: address.zipCode,
      billingCountry: address.countryCode
    }));

    // Clear validation errors
    setValidationErrors(prev => ({
      ...prev,
      billingStreet: '',
      billingCity: '',
      billingState: '',
      billingPostalCode: '',
      billingCountry: ''
    }));

    // Deselect any saved address since user is using autocomplete
    setSelectedAddressId('');
  };

  // Google Places Autocomplete hook
  const { inputRef: autocompleteInputRef, isLoaded: isAutocompleteLoaded, error: autocompleteError } =
    useGooglePlacesAutocomplete(handlePlaceSelect);

  // Calculate cart weight
  const calculateCartWeight = () => {
    return items.reduce((total, item) => {
      const weight = (item.product as any).weightKg || 0.5;
      return total + (weight * item.quantity);
    }, 0);
  };

  // Derive currency from cart items
  const derivedCurrency = useMemo(() => {
    const currencies = items
      .map(i => i.product?.currency)
      .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
      .map(c => c.toUpperCase());
    if (currencies.length === 0) return 'EUR';
    const first = currencies[0];
    const mixed = !currencies.every(c => c === first);
    if (mixed) {
      console.warn('[Checkout] Mixed currencies detected in cart items:', currencies);
    }
    return first;
  }, [items]);

  // Calculate totals with discount, shipping, and VAT breakdown
  const calculateTotals = () => {
    const subtotalWithVAT = getTotalPrice(); // Prices already include VAT

    // VAT calculation (standard rate 20% for Slovakia)
    const VAT_RATE = 0.20;
    const subtotalWithoutVAT = subtotalWithVAT / (1 + VAT_RATE);
    const vatAmount = subtotalWithVAT - subtotalWithoutVAT;

    const discountAmount = discountValidation?.valid ? (discountValidation.calculated_discount_amount || 0) : 0;
    const shippingCost = selectedShipping?.shipping_cost || 0;
    const total = subtotalWithVAT - discountAmount + shippingCost;

    return {
      subtotal: subtotalWithVAT,
      subtotalWithoutVAT,
      vatAmount,
      vatRate: VAT_RATE,
      discount: discountAmount,
      shipping: shippingCost,
      total: Math.max(0, total)
    };
  };

  // Load saved addresses on mount (authenticated users only)
  useEffect(() => {
    const loadSavedAddresses = async () => {
      if (!user) {
        setSavedAddresses([]);
        return;
      }

      setIsLoadingAddresses(true);
      try {
        const addresses = await addressService.getAllSavedAddresses();
        setSavedAddresses(addresses);
        console.log('[Checkout] Loaded', addresses.length, 'saved addresses');

        // Auto-select default or first address
        const defaultAddr = addresses.find(addr => addr.isDefault) || addresses[0];
        if (defaultAddr && defaultAddr.id) {
          setSelectedAddressId(defaultAddr.id);
          applyAddress(defaultAddr);
        }
      } catch (error) {
        console.error('[Checkout] Failed to load saved addresses:', error);
      } finally {
        setIsLoadingAddresses(false);
      }
    };

    loadSavedAddresses();
  }, [user]);

  // Fetch shipping options when entering step 2
  useEffect(() => {
    const fetchShippingOptions = async () => {
      // Only fetch if on step 2 or later
      if (currentStep < 2) return;

      const destinationCountry = formData.shipToDifferentAddress
        ? formData.shippingCountry
        : formData.billingCountry;

      const destinationPostalCode = formData.shipToDifferentAddress
        ? formData.shippingPostalCode
        : formData.billingPostalCode;

      if (!destinationCountry || destinationCountry.trim().length < 2) {
        return;
      }

      setIsLoadingShipping(true);
      setShippingError('');

      try {
        const totals = calculateTotals();
        const response = await shippingService.calculateShipping({
          destination_country_code: destinationCountry.toUpperCase(),
          total_weight_kg: calculateCartWeight(),
          order_subtotal: totals.subtotal,
          destination_postal_code: destinationPostalCode || undefined
        });

        if (response.available_rates && response.available_rates.length > 0) {
          setShippingOptions(response.available_rates);
          // Auto-select cheapest option
          setSelectedShipping(response.available_rates[0]);
        } else {
          setShippingOptions([]);
          setSelectedShipping(null);
          setShippingError('No shipping options available for this destination');
        }
      } catch (error) {
        console.error('Error fetching shipping options:', error);
        setShippingError('Failed to calculate shipping costs. Please check your address.');
        setShippingOptions([]);
        setSelectedShipping(null);
      } finally {
        setIsLoadingShipping(false);
      }
    };

    fetchShippingOptions();
  }, [currentStep]);

  // GA4 Analytics: Track begin_checkout when component mounts
  useEffect(() => {
    if (items.length > 0) {
      const totals = calculateTotals();
      trackBeginCheckout(items, totals.total);
    }
  }, []); // Only run once on mount

  // GA4 Analytics: Track add_shipping_info when shipping method is selected
  useEffect(() => {
    if (selectedShipping && currentStep >= 2) {
      const totals = calculateTotals();
      trackAddShippingInfo(
        items,
        totals.total,
        selectedShipping.rate_name,
        selectedShipping.shipping_cost
      );
    }
  }, [selectedShipping]);

  // GA4 Analytics: Track add_payment_info when entering payment step
  useEffect(() => {
    if (currentStep === 3) {
      const totals = calculateTotals();
      trackAddPaymentInfo(items, totals.total);
    }
  }, [currentStep]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    const checked = target.checked;

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ''
      });
    }

    // If user manually changes address fields, unselect saved address
    if (name.startsWith('billing') && selectedAddressId) {
      setSelectedAddressId('');
    }
  };

  // Apply saved address to form
  const applyAddress = (address: SavedAddress) => {
    setFormData(prev => ({
      ...prev,
      billingStreet: address.street,
      billingCity: address.city,
      billingState: address.state || '',
      billingPostalCode: address.zipCode,
      billingCountry: address.country
    }));

    // Clear any validation errors for address fields
    setValidationErrors(prev => ({
      ...prev,
      billingStreet: '',
      billingCity: '',
      billingState: '',
      billingPostalCode: '',
      billingCountry: ''
    }));

    console.log('[Checkout] Applied address:', address.label || 'Unnamed address');
  };

  // Handle saved address selection
  const handleAddressSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const addressId = e.target.value;
    setSelectedAddressId(addressId);

    if (!addressId) {
      // User selected "Enter new address" - clear form
      return;
    }

    const selectedAddr = savedAddresses.find(addr => addr.id === addressId);
    if (selectedAddr) {
      applyAddress(selectedAddr);
    }
  };

  // Save current billing address to saved addresses
  const handleSaveCurrentAddress = async () => {
    if (!user) {
      alert('Please sign in to save addresses');
      return;
    }

    // Validate that address fields are filled
    if (!formData.billingStreet || !formData.billingCity || !formData.billingPostalCode || !formData.billingCountry) {
      alert('Please complete the billing address before saving');
      return;
    }

    try {
      const addressToSave: Omit<SavedAddress, 'id'> = {
        street: formData.billingStreet,
        city: formData.billingCity,
        state: formData.billingState,
        zipCode: formData.billingPostalCode,
        country: formData.billingCountry
      };

      const label = window.prompt('Enter a name for this address (e.g., "Home", "Work"):', 'Home');
      if (label === null) return; // User cancelled

      const saved = addressService.saveAddress(addressToSave, label || undefined);
      console.log('[Checkout] Saved address:', saved.label);

      // Reload saved addresses
      const addresses = await addressService.getAllSavedAddresses();
      setSavedAddresses(addresses);
      setSelectedAddressId(saved.id || '');
      setShowSaveAddressOption(false);

      alert(`Address saved as "${saved.label}"`);
    } catch (error) {
      console.error('[Checkout] Failed to save address:', error);
      alert('Failed to save address. Please try again.');
    }
  };

  // Handle delete saved address
  const handleDeleteAddress = async (addressId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!window.confirm('Delete this saved address?')) {
      return;
    }

    try {
      addressService.removeAddress(addressId);
      console.log('[Checkout] Deleted address:', addressId);

      // Reload saved addresses
      const addresses = await addressService.getAllSavedAddresses();
      setSavedAddresses(addresses);

      if (selectedAddressId === addressId) {
        setSelectedAddressId('');
      }
    } catch (error) {
      console.error('[Checkout] Failed to delete address:', error);
    }
  };

  // Validate email format
  const validateEmail = (email: string): boolean => {
    return EMAIL_REGEX.test(email);
  };

  // Validate phone format
  const validatePhone = (phone: string): boolean => {
    return PHONE_REGEX.test(phone);
  };

  // Validate Step 1 (Information)
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};

    // Contact info
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      errors.phone = 'Please enter a valid phone number (e.g., +421 900 123 456)';
    }

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    // Billing address
    if (!formData.billingStreet.trim()) {
      errors.billingStreet = 'Street address is required';
    }

    if (!formData.billingCity.trim()) {
      errors.billingCity = 'City is required';
    }

    if (!formData.billingPostalCode.trim()) {
      errors.billingPostalCode = 'Postal code is required';
    }

    if (!formData.billingCountry.trim()) {
      errors.billingCountry = 'Country is required';
    }

    // B2B validation
    if (formData.isCompany) {
      if (!formData.companyName.trim()) {
        errors.companyName = 'Company name is required';
      }
      if (!formData.companyId.trim()) {
        errors.companyId = 'Company ID (IČO) is required';
      }
      if (!formData.taxId.trim()) {
        errors.taxId = 'Tax ID (DIČ) is required';
      }
    }

    // Shipping address (if different)
    if (formData.shipToDifferentAddress) {
      if (!formData.shippingStreet.trim()) {
        errors.shippingStreet = 'Shipping street address is required';
      }
      if (!formData.shippingCity.trim()) {
        errors.shippingCity = 'Shipping city is required';
      }
      if (!formData.shippingPostalCode.trim()) {
        errors.shippingPostalCode = 'Shipping postal code is required';
      }
      if (!formData.shippingCountry.trim()) {
        errors.shippingCountry = 'Shipping country is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle discount code validation
  const handleValidateDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountError('Please enter a discount code');
      return;
    }

    setIsValidatingDiscount(true);
    setDiscountError('');

    try {
      const totals = calculateTotals();
      const validation = await discountService.validateDiscount(
        discountCode.trim(),
        totals.subtotal,
        user?.id ? Number(user.id) : undefined
      );

      setDiscountValidation(validation);

      if (!validation.valid) {
        setDiscountError(validation.error_message || 'Invalid discount code');
      }
    } catch (error) {
      console.error('Error validating discount code:', error);
      setDiscountError('Failed to validate discount code. Please try again.');
      setDiscountValidation(null);
    } finally {
      setIsValidatingDiscount(false);
    }
  };

  // Handle discount code removal
  const handleRemoveDiscount = () => {
    setDiscountCode('');
    setDiscountValidation(null);
    setDiscountError('');
  };

  // Stripe error handler
  const handleStripeError = (err: unknown) => {
    console.error('Stripe payment error:', err);
    setPayStatus("error");
    alert(t('payment.failed'));
  };

  // Validate legal consents before payment
  const validateLegalConsents = (): boolean => {
    if (!formData.termsAccepted) {
      alert('Please accept the Terms & Conditions to continue');
      return false;
    }
    if (!formData.privacyAccepted) {
      alert('Please accept the Privacy Policy to continue');
      return false;
    }
    return true;
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentStep === 1) {
      // Validate Information step
      if (!validateStep1()) {
        alert('Please fill in all required fields correctly');
        return;
      }
    }

    if (currentStep === 2) {
      // Validate shipping selection
      if (!selectedShipping) {
        alert('Please select a shipping method');
        return;
      }
    }

    // Note: Step 3 validation happens on Stripe button click (legal consents)

    // Move to next step
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Empty cart check
  if (items.length === 0) {
    return (
      <main className="checkout-container" role="main">
        <div className="empty-cart-message">
          <h2>Your cart is empty</h2>
          <p>Add some products to your cart before proceeding to checkout.</p>
          <button
            className="continue-shopping-btn"
            onClick={() => navigate('/products')}
          >
            Continue Shopping
          </button>
        </div>
      </main>
    );
  }

  if (searchParams.get('paymentId')) {
    return (
      <main className="checkout-container" role="main">
        <div className="empty-cart-message">
          <h2>Finalizing your payment…</h2>
          <p>Redirecting to payment summary.</p>
        </div>
      </main>
    );
  }

  const totals = calculateTotals();

  // Get shipping address (use shipping if different, otherwise billing)
  const shippingAddress = formData.shipToDifferentAddress
    ? {
        street: formData.shippingStreet,
        city: formData.shippingCity,
        state: formData.shippingState,
        postalCode: formData.shippingPostalCode,
        country: formData.shippingCountry,
      }
    : {
        street: formData.billingStreet,
        city: formData.billingCity,
        state: formData.billingState,
        postalCode: formData.billingPostalCode,
        country: formData.billingCountry,
      };

  return (
    <main className="checkout-container" role="main">
      <div className="checkout-header">
        {/* Progress Steps - 3 STEPS */}
        <div className="checkout-steps">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            Information
          </div>
          <div className="step-divider"></div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            Shipping
          </div>
          <div className="step-divider"></div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
            Payment
          </div>
        </div>
      </div>

      <div className="checkout-content">
        {/* Main Content - Conditional Rendering Based on Step */}
        <div className="checkout-form-card">
          {/* STEP 1: INFORMATION (Contact + Billing + Shipping) */}
          {currentStep === 1 && (
            <div className="information-step">
              <h2 className="section-title">
                <span className="section-number">1</span>
                Contact Information
              </h2>

              {/* Guest Checkout Notice - Only shown for non-authenticated users */}
              {!user && (
                <div className="guest-checkout-notice">
                  <div className="notice-icon">ℹ️</div>
                  <div className="notice-content">
                    <strong>Guest Checkout</strong>
                    <p>
                      You're checking out as a guest.
                      <a href="/login" className="notice-link"> Sign in</a> or
                      <a href="/register" className="notice-link"> create an account</a> to track your order and save your details for next time.
                    </p>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="form-field">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="your.email@example.com"
                  className={validationErrors.email ? 'error' : ''}
                />
                {validationErrors.email && (
                  <span className="field-error">{validationErrors.email}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    placeholder="John"
                    className={validationErrors.firstName ? 'error' : ''}
                  />
                  {validationErrors.firstName && (
                    <span className="field-error">{validationErrors.firstName}</span>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    placeholder="Doe"
                    className={validationErrors.lastName ? 'error' : ''}
                  />
                  {validationErrors.lastName && (
                    <span className="field-error">{validationErrors.lastName}</span>
                  )}
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="+421 900 123 456"
                  className={validationErrors.phone ? 'error' : ''}
                />
                {validationErrors.phone && (
                  <span className="field-error">{validationErrors.phone}</span>
                )}
              </div>

              {/* B2B Customer Toggle */}
              <div className="form-field checkbox-field">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isCompany"
                    checked={formData.isCompany}
                    onChange={handleInputChange}
                  />
                  <span>I'm purchasing as a company (B2B)</span>
                </label>
              </div>

              {/* B2B Fields */}
              {formData.isCompany && (
                <div className="b2b-fields">
                  <div className="form-field">
                    <label htmlFor="companyName">Company Name *</label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      required={formData.isCompany}
                      placeholder="Company s.r.o."
                      className={validationErrors.companyName ? 'error' : ''}
                    />
                    {validationErrors.companyName && (
                      <span className="field-error">{validationErrors.companyName}</span>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="companyId">Company Registration (IČO) *</label>
                      <input
                        type="text"
                        id="companyId"
                        name="companyId"
                        value={formData.companyId}
                        onChange={handleInputChange}
                        required={formData.isCompany}
                        placeholder="12345678"
                        className={validationErrors.companyId ? 'error' : ''}
                      />
                      {validationErrors.companyId && (
                        <span className="field-error">{validationErrors.companyId}</span>
                      )}
                    </div>

                    <div className="form-field">
                      <label htmlFor="taxId">Tax ID (DIČ) *</label>
                      <input
                        type="text"
                        id="taxId"
                        name="taxId"
                        value={formData.taxId}
                        onChange={handleInputChange}
                        required={formData.isCompany}
                        placeholder="1234567890"
                        className={validationErrors.taxId ? 'error' : ''}
                      />
                      {validationErrors.taxId && (
                        <span className="field-error">{validationErrors.taxId}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="vatId">VAT ID (IČ DPH) - Optional</label>
                    <input
                      type="text"
                      id="vatId"
                      name="vatId"
                      value={formData.vatId}
                      onChange={handleInputChange}
                      placeholder="SK1234567890"
                    />
                  </div>
                </div>
              )}

              {/* Billing Address */}
              <div className="subsection-divider"></div>

              <h3 className="subsection-title">Billing Address</h3>

              {/* Saved Addresses Selector - Only for authenticated users */}
              {user && (
                <div className="saved-addresses-section">
                  {isLoadingAddresses ? (
                    <div className="loading-addresses">
                      <span className="loading-spinner">⏳</span>
                      Loading saved addresses...
                    </div>
                  ) : savedAddresses.length > 0 ? (
                    <div className="form-field">
                      <label htmlFor="savedAddress">Use Saved Address</label>
                      <div className="saved-address-selector-wrapper">
                        <select
                          id="savedAddress"
                          className="saved-address-selector"
                          value={selectedAddressId}
                          onChange={handleAddressSelect}
                        >
                          <option value="">Enter new address</option>
                          {savedAddresses.map((addr) => (
                            <option key={addr.id} value={addr.id}>
                              {addr.label || 'Unnamed Address'} - {addressService.formatAddress(addr)}
                            </option>
                          ))}
                        </select>
                        {selectedAddressId && !savedAddresses.find(a => a.id === selectedAddressId)?.isPrimary && (
                          <button
                            type="button"
                            className="delete-address-btn"
                            onClick={(e) => handleDeleteAddress(selectedAddressId, e)}
                            aria-label="Delete selected address"
                            title="Delete this address"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                      <p className="field-hint">
                        {savedAddresses.length} saved address{savedAddresses.length !== 1 ? 'es' : ''} available
                      </p>
                    </div>
                  ) : (
                    <div className="no-saved-addresses">
                      <p className="hint-text">No saved addresses yet. Your address will be saved after checkout.</p>
                    </div>
                  )}
                </div>
              )}

              <div className="form-field">
                <label htmlFor="billingStreet">
                  Street Address *
                  {isAutocompleteLoaded && <span className="autocomplete-badge">🌍 Autocomplete</span>}
                </label>
                <input
                  ref={autocompleteInputRef}
                  type="text"
                  id="billingStreet"
                  name="billingStreet"
                  autoComplete="street-address"
                  value={formData.billingStreet}
                  onChange={handleInputChange}
                  required
                  placeholder={isAutocompleteLoaded ? "Start typing address..." : "123 Main Street"}
                  className={validationErrors.billingStreet ? 'error' : ''}
                />
                {validationErrors.billingStreet && (
                  <span className="field-error">{validationErrors.billingStreet}</span>
                )}
                {autocompleteError && !isAutocompleteLoaded && (
                  <span className="field-hint text-warning">Address autocomplete unavailable. Please enter manually.</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="billingCity">City *</label>
                  <input
                    type="text"
                    id="billingCity"
                    name="billingCity"
                    autoComplete="address-level2"
                    value={formData.billingCity}
                    onChange={handleInputChange}
                    required
                    placeholder="Bratislava"
                    className={validationErrors.billingCity ? 'error' : ''}
                  />
                  {validationErrors.billingCity && (
                    <span className="field-error">{validationErrors.billingCity}</span>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="billingPostalCode">Postal Code *</label>
                  <input
                    type="text"
                    id="billingPostalCode"
                    name="billingPostalCode"
                    autoComplete="postal-code"
                    value={formData.billingPostalCode}
                    onChange={handleInputChange}
                    required
                    placeholder="81101"
                    className={validationErrors.billingPostalCode ? 'error' : ''}
                  />
                  {validationErrors.billingPostalCode && (
                    <span className="field-error">{validationErrors.billingPostalCode}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="billingState">State/Region</label>
                  <input
                    type="text"
                    id="billingState"
                    name="billingState"
                    autoComplete="address-level1"
                    value={formData.billingState}
                    onChange={handleInputChange}
                    placeholder="Bratislava Region"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="billingCountry">Country *</label>
                  <select
                    id="billingCountry"
                    name="billingCountry"
                    autoComplete="country"
                    value={formData.billingCountry}
                    onChange={handleInputChange}
                    required
                    className={validationErrors.billingCountry ? 'error' : ''}
                  >
                    <option value="">Select a country</option>
                    {COUNTRIES.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.billingCountry && (
                    <span className="field-error">{validationErrors.billingCountry}</span>
                  )}
                </div>
              </div>

              {/* Ship to Different Address */}
              <div className="subsection-divider"></div>

              <div className="form-field checkbox-field">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="shipToDifferentAddress"
                    checked={formData.shipToDifferentAddress}
                    onChange={handleInputChange}
                  />
                  <span>Ship to a different address?</span>
                </label>
              </div>

              {/* Shipping Address Fields */}
              {formData.shipToDifferentAddress && (
                <div className="shipping-address-fields">
                  <h3 className="subsection-title">Shipping Address</h3>

                  <div className="form-field">
                    <label htmlFor="shippingStreet">Street Address *</label>
                    <input
                      type="text"
                      id="shippingStreet"
                      name="shippingStreet"
                      autoComplete="shipping street-address"
                      value={formData.shippingStreet}
                      onChange={handleInputChange}
                      required
                      placeholder="456 Delivery Street"
                      className={validationErrors.shippingStreet ? 'error' : ''}
                    />
                    {validationErrors.shippingStreet && (
                      <span className="field-error">{validationErrors.shippingStreet}</span>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="shippingCity">City *</label>
                      <input
                        type="text"
                        id="shippingCity"
                        name="shippingCity"
                        autoComplete="shipping address-level2"
                        value={formData.shippingCity}
                        onChange={handleInputChange}
                        required
                        placeholder="Prague"
                        className={validationErrors.shippingCity ? 'error' : ''}
                      />
                      {validationErrors.shippingCity && (
                        <span className="field-error">{validationErrors.shippingCity}</span>
                      )}
                    </div>

                    <div className="form-field">
                      <label htmlFor="shippingPostalCode">Postal Code *</label>
                      <input
                        type="text"
                        id="shippingPostalCode"
                        name="shippingPostalCode"
                        autoComplete="shipping postal-code"
                        value={formData.shippingPostalCode}
                        onChange={handleInputChange}
                        required
                        placeholder="11000"
                        className={validationErrors.shippingPostalCode ? 'error' : ''}
                      />
                      {validationErrors.shippingPostalCode && (
                        <span className="field-error">{validationErrors.shippingPostalCode}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="shippingState">State/Region</label>
                      <input
                        type="text"
                        id="shippingState"
                        name="shippingState"
                        autoComplete="shipping address-level1"
                        value={formData.shippingState}
                        onChange={handleInputChange}
                        placeholder="Prague Region"
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="shippingCountry">Country *</label>
                      <select
                        id="shippingCountry"
                        name="shippingCountry"
                        autoComplete="shipping country"
                        value={formData.shippingCountry}
                        onChange={handleInputChange}
                        required
                        className={validationErrors.shippingCountry ? 'error' : ''}
                      >
                        <option value="">Select a country</option>
                        {COUNTRIES.map(country => (
                          <option key={country.code} value={country.code}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                      {validationErrors.shippingCountry && (
                        <span className="field-error">{validationErrors.shippingCountry}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Newsletter Opt-in */}
              <div className="subsection-divider"></div>

              <div className="form-field checkbox-field">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="newsletterOptIn"
                    checked={formData.newsletterOptIn}
                    onChange={handleInputChange}
                  />
                  <span>Send me news and special offers</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 2: SHIPPING METHOD */}
          {currentStep === 2 && (
            <div className="shipping-step">
              <h2 className="section-title">
                <span className="section-number">2</span>
                Shipping Method
              </h2>

              {isLoadingShipping ? (
                <div className="loading-message">
                  <span className="loading-spinner">⏳</span>
                  Calculating shipping options...
                </div>
              ) : shippingOptions.length > 0 ? (
                <div className="shipping-options">
                  {shippingOptions.map((option) => {
                    const deliveryDaysMin = option.delivery_days_min || 0;
                    const deliveryDaysMax = option.delivery_days_max || 0;
                    const deliveryDaysDisplay = deliveryDaysMin && deliveryDaysMax && deliveryDaysMin !== deliveryDaysMax
                      ? `${deliveryDaysMin}-${deliveryDaysMax}`
                      : (deliveryDaysMin || deliveryDaysMax || '');

                    const estimatedDate = deliveryDaysMax
                      ? calculateEstimatedDelivery(deliveryDaysMax)
                      : '';

                    return (
                      <label
                        key={option.shipping_rate_id}
                        className={`shipping-option ${selectedShipping?.shipping_rate_id === option.shipping_rate_id ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="shipping"
                          value={option.shipping_rate_id}
                          checked={selectedShipping?.shipping_rate_id === option.shipping_rate_id}
                          onChange={() => setSelectedShipping(option)}
                        />
                        <div className="shipping-details">
                          <div className="shipping-name">{option.rate_name}</div>
                          {deliveryDaysDisplay && (
                            <div className="shipping-meta">
                              {deliveryDaysDisplay} business days
                              {estimatedDate && ` · Estimated delivery: ${estimatedDate}`}
                            </div>
                          )}
                        </div>
                        <div className="shipping-price">
                          {(option.shipping_cost || 0) === 0 ? 'FREE' : `€${(option.shipping_cost || 0).toFixed(2)}`}
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="no-shipping-message">
                  <p>No shipping options available for your location.</p>
                  <p className="hint">Please check your address in the previous step.</p>
                </div>
              )}

              {shippingError && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span> {shippingError}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: PAYMENT & REVIEW */}
          {currentStep === 3 && (
            <div className="payment-step">
              <h2 className="section-title">
                <span className="section-number">3</span>
                Review & Payment
              </h2>

              {/* Order Review Summary */}
              <div className="order-review-summary">
                <h3 className="review-section-title">Order Summary</h3>

                {/* Contact Info */}
                <div className="review-section">
                  <div className="review-header">
                    <strong>Contact</strong>
                    <button
                      className="edit-btn"
                      onClick={() => setCurrentStep(1)}
                      aria-label="Edit contact information"
                    >
                      Edit
                    </button>
                  </div>
                  <p>{formData.email}</p>
                  <p>{formData.phone}</p>
                </div>

                {/* Billing Address */}
                <div className="review-section">
                  <div className="review-header">
                    <strong>Billing Address</strong>
                    <button
                      className="edit-btn"
                      onClick={() => setCurrentStep(1)}
                      aria-label="Edit billing address"
                    >
                      Edit
                    </button>
                  </div>
                  <p>{formData.firstName} {formData.lastName}</p>
                  {formData.isCompany && <p>{formData.companyName}</p>}
                  <p>{formData.billingStreet}</p>
                  <p>{formData.billingCity}, {formData.billingPostalCode}</p>
                  <p>{COUNTRIES.find(c => c.code === formData.billingCountry)?.name || formData.billingCountry}</p>
                </div>

                {/* Shipping Address */}
                <div className="review-section">
                  <div className="review-header">
                    <strong>Shipping Address</strong>
                    <button
                      className="edit-btn"
                      onClick={() => setCurrentStep(1)}
                      aria-label="Edit shipping address"
                    >
                      Edit
                    </button>
                  </div>
                  {formData.shipToDifferentAddress ? (
                    <>
                      <p>{formData.shippingStreet}</p>
                      <p>{formData.shippingCity}, {formData.shippingPostalCode}</p>
                      <p>{COUNTRIES.find(c => c.code === formData.shippingCountry)?.name || formData.shippingCountry}</p>
                    </>
                  ) : (
                    <p>Same as billing address</p>
                  )}
                </div>

                {/* Shipping Method */}
                {selectedShipping && (
                  <div className="review-section">
                    <div className="review-header">
                      <strong>Shipping Method</strong>
                      <button
                        className="edit-btn"
                        onClick={() => setCurrentStep(2)}
                        aria-label="Edit shipping method"
                      >
                        Edit
                      </button>
                    </div>
                    <p>{selectedShipping.rate_name}</p>
                    <p className="review-meta">
                      {selectedShipping.shipping_cost === 0 ? 'FREE' : `€${selectedShipping.shipping_cost.toFixed(2)}`}
                    </p>
                  </div>
                )}
              </div>

              <div className="subsection-divider"></div>

              {/* Payment */}
              <h3 className="review-section-title">Payment</h3>

              <div className="payment-security-badge">
                <span className="lock-icon">🔒</span>
                <span>Secure payment powered by Stripe</span>
              </div>

              {/* Legal Consents - REQUIRED */}
              <div className="legal-consents-section">
                <div className="form-field checkbox-field">
                  <label className="checkbox-label legal-checkbox">
                    <input
                      type="checkbox"
                      name="termsAccepted"
                      checked={formData.termsAccepted}
                      onChange={handleInputChange}
                      required
                    />
                    <span>
                      I agree to the <a href="/terms-of-service" target="_blank" rel="noopener noreferrer">Terms & Conditions</a> *
                    </span>
                  </label>
                </div>

                <div className="form-field checkbox-field">
                  <label className="checkbox-label legal-checkbox">
                    <input
                      type="checkbox"
                      name="privacyAccepted"
                      checked={formData.privacyAccepted}
                      onChange={handleInputChange}
                      required
                    />
                    <span>
                      I agree to the <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> *
                    </span>
                  </label>
                </div>
              </div>

              <div className="stripe-container">
                <StripeCheckoutButton
                  items={items}
                  totalAmount={totals.total}
                  currency={derivedCurrency}
                  email={formData.email}
                  firstName={formData.firstName}
                  lastName={formData.lastName}
                  billingAddress={{
                    street: formData.billingStreet,
                    city: formData.billingCity,
                    state: formData.billingState,
                    postalCode: formData.billingPostalCode,
                    country: formData.billingCountry,
                    companyName: formData.isCompany ? formData.companyName : undefined,
                    companyId: formData.isCompany ? formData.companyId : undefined,
                    taxId: formData.isCompany ? formData.taxId : undefined,
                    vatId: formData.isCompany && formData.vatId ? formData.vatId : undefined,
                    isCompany: formData.isCompany
                  }}
                  onError={handleStripeError}
                  disabled={!formData.termsAccepted || !formData.privacyAccepted}
                />
              </div>

              {/* Status messages */}
              {payStatus !== "idle" && (
                <div className={`payment-status status-${payStatus}`} role="status" aria-live="polite" aria-atomic="true">
                  {payStatus === "processing" && (
                    <div className="status-content">
                      <div className="status-icon">⏳</div>
                      <span>{t('payment.processing')}</span>
                    </div>
                  )}
                  {payStatus === "success" && (
                    <div className="status-content">
                      <div className="status-icon">✅</div>
                      <span>{t('payment.success')}</span>
                    </div>
                  )}
                  {payStatus === "error" && (
                    <div className="status-content">
                      <div className="status-icon">❌</div>
                      <span>{t('payment.error')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="checkout-navigation">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="nav-btn nav-btn-link"
            >
              ← Continue Shopping
            </button>

            <div className="nav-btn-group">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="nav-btn nav-btn-back"
                >
                  ← Back
                </button>
              )}

              {currentStep < 3 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="nav-btn nav-btn-next"
                >
                  Continue →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Order Summary - RIGHT SIDE (STICKY) */}
        <div className="order-summary-card" role="region" aria-labelledby="order-summary-title">
          <h2 id="order-summary-title">Order Summary</h2>

          <div className="order-items" role="list">
            {items.map(item => {
              const unit = Number(item.product.priceWithVat);
              const qty = Number(item.quantity);
              const lineTotal = (unit * qty).toFixed(2);
              return (
                <div
                  key={item.product.variantId}
                  className="order-item"
                  role="listitem"
                >
                  <div className="item-info">
                    <div className="item-name">{item.product.name}</div>
                    <div className="item-quantity">
                      Qty: {qty}
                      {currentStep === 1 && (
                        <div className="quantity-controls-inline">
                          <button
                            onClick={() => updateQuantity(item.product.variantId.toString(), qty - 1)}
                            className="qty-btn"
                            disabled={item.product.variantType === 'DIGITAL_ONLY'}
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <button
                            onClick={() => updateQuantity(item.product.variantId.toString(), qty + 1)}
                            className="qty-btn"
                            disabled={item.product.variantType === 'DIGITAL_ONLY'}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="item-price-actions">
                    <div className="item-price">€{lineTotal}</div>
                    {currentStep === 1 && (
                      <button
                        onClick={() => removeFromCart(item.product.variantId.toString())}
                        className="remove-item-btn-small"
                        aria-label="Remove item"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="order-divider"></div>

          {/* Discount Code Section */}
          <div className="discount-section">
            {!discountValidation?.valid ? (
              <div className="discount-input-group">
                <input
                  type="text"
                  className="discount-input"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  placeholder="Discount code"
                  disabled={isValidatingDiscount}
                />
                <button
                  type="button"
                  className="apply-discount-btn"
                  onClick={handleValidateDiscount}
                  disabled={isValidatingDiscount || !discountCode.trim()}
                >
                  Apply
                </button>
              </div>
            ) : (
              <div className="discount-applied">
                <div className="discount-info">
                  <span className="discount-icon">✓</span>
                  <span className="discount-code">{discountValidation.code}</span>
                </div>
                <button
                  type="button"
                  className="remove-discount-btn"
                  onClick={handleRemoveDiscount}
                  aria-label="Remove discount"
                >
                  ×
                </button>
              </div>
            )}

            {discountError && (
              <div className="error-message-small">
                {discountError}
              </div>
            )}
          </div>

          <div className="order-divider"></div>

          {/* Order Breakdown */}
          <div className="order-breakdown">
            <div className="breakdown-row">
              <span>Subtotal (excl. VAT)</span>
              <span>€{totals.subtotalWithoutVAT.toFixed(2)}</span>
            </div>

            <div className="breakdown-row vat-row">
              <span>VAT ({(totals.vatRate * 100).toFixed(0)}%)</span>
              <span>€{totals.vatAmount.toFixed(2)}</span>
            </div>

            {discountValidation?.valid && totals.discount > 0 && (
              <div className="breakdown-row discount-row">
                <span>Discount</span>
                <span className="discount-amount">-€{totals.discount.toFixed(2)}</span>
              </div>
            )}

            {selectedShipping && (
              <div className="breakdown-row">
                <span>Shipping</span>
                <span>
                  {totals.shipping === 0 ? 'FREE' : `€${totals.shipping.toFixed(2)}`}
                </span>
              </div>
            )}

            <div className="order-divider"></div>

            <div className="order-total">
              <span>Total (incl. VAT)</span>
              <span>€{totals.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Digital Delivery Badge */}
          <div className="delivery-badge">
            <span className="badge-icon">📧</span>
            <div className="badge-text">
              <strong>Instant Delivery</strong>
              <p>Digital products sent to your email</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Checkout;
