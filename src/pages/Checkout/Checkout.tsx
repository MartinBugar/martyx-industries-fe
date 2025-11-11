import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { checkoutFormSchema, type CheckoutFormData } from '../../schemas/formSchemas';

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

// CheckoutFormData type now imported from formSchemas.ts

// SessionStorage key for checkout progress persistence
const CHECKOUT_PROGRESS_KEY = 'martyx_checkout_progress_v1';

// Interface for checkout progress stored in sessionStorage
interface CheckoutProgress {
  formData: CheckoutFormData;
  currentStep: 1 | 2 | 3;
  discountCode: string;
  timestamp: number; // When progress was saved
}

// Save progress to sessionStorage
const saveProgress = (
  formData: CheckoutFormData,
  currentStep: 1 | 2 | 3,
  discountCode: string
): void => {
  try {
    const progress: CheckoutProgress = {
      formData,
      currentStep,
      discountCode,
      timestamp: Date.now()
    };
    sessionStorage.setItem(CHECKOUT_PROGRESS_KEY, JSON.stringify(progress));
    console.log('[Checkout] Progress saved to sessionStorage');
  } catch (e) {
    console.warn('[Checkout] Failed to save progress:', e);
  }
};

// Load progress from sessionStorage
const loadProgress = (): CheckoutProgress | null => {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_PROGRESS_KEY);
    if (!raw) return null;

    const progress = JSON.parse(raw) as CheckoutProgress;

    // Check if progress is too old (e.g., > 24 hours)
    const age = Date.now() - progress.timestamp;
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

    if (age > MAX_AGE) {
      console.log('[Checkout] Saved progress expired (older than 24 hours)');
      sessionStorage.removeItem(CHECKOUT_PROGRESS_KEY);
      return null;
    }

    console.log('[Checkout] Loaded saved progress from', new Date(progress.timestamp).toLocaleString());
    return progress;
  } catch (e) {
    console.warn('[Checkout] Failed to load progress:', e);
    return null;
  }
};

// Clear progress from sessionStorage
const clearProgress = (): void => {
  try {
    sessionStorage.removeItem(CHECKOUT_PROGRESS_KEY);
    console.log('[Checkout] Progress cleared from sessionStorage');
  } catch (e) {
    console.warn('[Checkout] Failed to clear progress:', e);
  }
};

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

  // Load saved progress from sessionStorage (if available)
  const savedProgress = loadProgress();

  // 3 STEPS: Information → Shipping → Payment
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(savedProgress?.currentStep || 1);

  // React Hook Form setup with zod validation
  const {
    register,
    formState: { errors },
    watch,
    setValue,
    trigger,
    getValues
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    mode: 'onBlur',
    defaultValues: savedProgress?.formData || {
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
    }
  });

  // Watch all form values for progress persistence
  const formData = watch();

  // Track if progress was restored from sessionStorage
  const [progressRestored, setProgressRestored] = useState<boolean>(!!savedProgress);

  // Discount code state
  const [discountCode, setDiscountCode] = useState(savedProgress?.discountCode || '');
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
  // @ts-ignore - Reserved for future "save address" UI feature
  const [showSaveAddressOption, setShowSaveAddressOption] = useState(false);

  // Google Places Autocomplete handler
  const handlePlaceSelect = (address: ParsedAddress) => {
    console.log('[Checkout] Google Places address selected:', address);

    setValue('billingStreet', address.street);
    setValue('billingCity', address.city);
    setValue('billingState', address.state);
    setValue('billingPostalCode', address.zipCode);
    setValue('billingCountry', address.countryCode);

    // Trigger validation for updated fields
    trigger(['billingStreet', 'billingCity', 'billingState', 'billingPostalCode', 'billingCountry']);

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

    // VAT calculation - use VAT rate from products (Slovak VAT is 23%)
    // Get VAT rate from first product (assuming all products have same VAT rate)
    const VAT_RATE = items.length > 0 && items[0].product.vatRate ? (items[0].product.vatRate / 100) : 0.23;
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

  // Progress Persistence: Save form data to sessionStorage
  useEffect(() => {
    // Don't save if cart is empty (user might be on checkout page after clearing cart)
    if (items.length === 0) {
      clearProgress();
      return;
    }

    // Save current progress
    saveProgress(formData, currentStep, discountCode);
  }, [formData, currentStep, discountCode, items.length]);

  // Progress Persistence: Hide "Progress restored" notification after 5 seconds
  useEffect(() => {
    if (progressRestored) {
      const timer = setTimeout(() => {
        setProgressRestored(false);
      }, 5000); // Hide after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [progressRestored]);

  // Progress Persistence: Clear progress on successful payment
  // This will be called from the Stripe success redirect handler
  useEffect(() => {
    // Check if coming back from successful payment
    const paymentSuccess = searchParams.get('payment') === 'success';
    if (paymentSuccess) {
      clearProgress();
    }
  }, [searchParams]);

  // Apply saved address to form
  const applyAddress = (address: SavedAddress) => {
    setValue('billingStreet', address.street);
    setValue('billingCity', address.city);
    setValue('billingState', address.state || '');
    setValue('billingPostalCode', address.zipCode);
    setValue('billingCountry', address.country);

    // Trigger validation for updated fields
    trigger(['billingStreet', 'billingCity', 'billingState', 'billingPostalCode', 'billingCountry']);

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
  // @ts-ignore - Reserved for future "save address" button
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
        state: formData.billingState || '',
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

  // Validate Step 1 (Information) using react-hook-form
  const validateStep1 = async (): Promise<boolean> => {
    // Trigger validation for all step 1 fields
    const result = await trigger([
      'firstName',
      'lastName',
      'email',
      'phone',
      'billingStreet',
      'billingCity',
      'billingState',
      'billingPostalCode',
      'billingCountry',
      'isCompany',
      'companyName',
      'companyId',
      'taxId',
      'vatId',
      'shipToDifferentAddress',
      'shippingStreet',
      'shippingCity',
      'shippingState',
      'shippingPostalCode',
      'shippingCountry',
      'newsletterOptIn'
    ]);

    return result;
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
  // @ts-ignore - Reserved for validation logic
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
  const handleNext = async () => {
    if (currentStep === 1) {
      // Validate Information step
      const isValid = await validateStep1();
      if (!isValid) {
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
  // @ts-ignore - Reserved for future use
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
                  autoComplete="email"
                  required
                  placeholder="your.email@example.com"
                  className={errors.email ? 'error' : ''}
                  {...register('email')}
                />
                {errors.email && (
                  <span className="field-error">{errors.email.message}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    autoComplete="given-name"
                    required
                    placeholder="John"
                    className={errors.firstName ? 'error' : ''}
                    {...register('firstName')}
                  />
                  {errors.firstName && (
                    <span className="field-error">{errors.firstName.message}</span>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    autoComplete="family-name"
                    required
                    placeholder="Doe"
                    className={errors.lastName ? 'error' : ''}
                    {...register('lastName')}
                  />
                  {errors.lastName && (
                    <span className="field-error">{errors.lastName.message}</span>
                  )}
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  autoComplete="tel"
                  required
                  placeholder="+421 900 123 456"
                  className={errors.phone ? 'error' : ''}
                  {...register('phone')}
                />
                {errors.phone && (
                  <span className="field-error">{errors.phone.message}</span>
                )}
              </div>

              {/* B2B Customer Toggle */}
              <div className="form-field checkbox-field">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    {...register('isCompany')}
                  />
                  <span>I'm purchasing as a company (B2B)</span>
                </label>
              </div>

              {/* B2B Fields */}
              {watch('isCompany') && (
                <div className="b2b-fields">
                  <div className="form-field">
                    <label htmlFor="companyName">Company Name *</label>
                    <input
                      type="text"
                      id="companyName"
                      placeholder="Company s.r.o."
                      className={errors.companyName ? 'error' : ''}
                      {...register('companyName')}
                    />
                    {errors.companyName && (
                      <span className="field-error">{errors.companyName.message}</span>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="companyId">Company Registration (IČO) *</label>
                      <input
                        type="text"
                        id="companyId"
                        placeholder="12345678"
                        className={errors.companyId ? 'error' : ''}
                        {...register('companyId')}
                      />
                      {errors.companyId && (
                        <span className="field-error">{errors.companyId.message}</span>
                      )}
                    </div>

                    <div className="form-field">
                      <label htmlFor="taxId">Tax ID (DIČ) *</label>
                      <input
                        type="text"
                        id="taxId"
                        placeholder="1234567890"
                        className={errors.taxId ? 'error' : ''}
                        {...register('taxId')}
                      />
                      {errors.taxId && (
                        <span className="field-error">{errors.taxId.message}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="vatId">VAT ID (IČ DPH) - Optional</label>
                    <input
                      type="text"
                      id="vatId"
                      placeholder="SK1234567890"
                      {...register('vatId')}
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
                  type="text"
                  id="billingStreet"
                  autoComplete="street-address"
                  required
                  placeholder={isAutocompleteLoaded ? "Start typing address..." : "123 Main Street"}
                  className={errors.billingStreet ? 'error' : ''}
                  {...register('billingStreet', {
                    onChange: () => {
                      // Deselect saved address when manually typing
                      if (selectedAddressId) {
                        setSelectedAddressId('');
                      }
                    },
                    setValueAs: (value) => {
                      // Pass ref to autocomplete
                      return value;
                    }
                  })}
                  ref={(el) => {
                    // Set both refs
                    const { ref } = register('billingStreet');
                    ref(el);
                    if (autocompleteInputRef && typeof autocompleteInputRef !== 'function') {
                      autocompleteInputRef.current = el;
                    }
                  }}
                />
                {errors.billingStreet && (
                  <span className="field-error">{errors.billingStreet.message}</span>
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
                    autoComplete="address-level2"
                    required
                    placeholder="Bratislava"
                    className={errors.billingCity ? 'error' : ''}
                    {...register('billingCity')}
                  />
                  {errors.billingCity && (
                    <span className="field-error">{errors.billingCity.message}</span>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="billingPostalCode">Postal Code *</label>
                  <input
                    type="text"
                    id="billingPostalCode"
                    autoComplete="postal-code"
                    required
                    placeholder="81101"
                    className={errors.billingPostalCode ? 'error' : ''}
                    {...register('billingPostalCode')}
                  />
                  {errors.billingPostalCode && (
                    <span className="field-error">{errors.billingPostalCode.message}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="billingState">State/Region</label>
                  <input
                    type="text"
                    id="billingState"
                    autoComplete="address-level1"
                    placeholder="Bratislava Region"
                    {...register('billingState')}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="billingCountry">Country *</label>
                  <select
                    id="billingCountry"
                    autoComplete="country"
                    required
                    className={errors.billingCountry ? 'error' : ''}
                    {...register('billingCountry')}
                  >
                    <option value="">Select a country</option>
                    {COUNTRIES.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                  {errors.billingCountry && (
                    <span className="field-error">{errors.billingCountry.message}</span>
                  )}
                </div>
              </div>

              {/* Ship to Different Address */}
              <div className="subsection-divider"></div>

              <div className="form-field checkbox-field">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    {...register('shipToDifferentAddress')}
                  />
                  <span>Ship to a different address?</span>
                </label>
              </div>

              {/* Shipping Address Fields */}
              {watch('shipToDifferentAddress') && (
                <div className="shipping-address-fields">
                  <h3 className="subsection-title">Shipping Address</h3>

                  <div className="form-field">
                    <label htmlFor="shippingStreet">Street Address *</label>
                    <input
                      type="text"
                      id="shippingStreet"
                      autoComplete="shipping street-address"
                      placeholder="456 Delivery Street"
                      className={errors.shippingStreet ? 'error' : ''}
                      {...register('shippingStreet')}
                    />
                    {errors.shippingStreet && (
                      <span className="field-error">{errors.shippingStreet.message}</span>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="shippingCity">City *</label>
                      <input
                        type="text"
                        id="shippingCity"
                        autoComplete="shipping address-level2"
                        placeholder="Prague"
                        className={errors.shippingCity ? 'error' : ''}
                        {...register('shippingCity')}
                      />
                      {errors.shippingCity && (
                        <span className="field-error">{errors.shippingCity.message}</span>
                      )}
                    </div>

                    <div className="form-field">
                      <label htmlFor="shippingPostalCode">Postal Code *</label>
                      <input
                        type="text"
                        id="shippingPostalCode"
                        autoComplete="shipping postal-code"
                        placeholder="11000"
                        className={errors.shippingPostalCode ? 'error' : ''}
                        {...register('shippingPostalCode')}
                      />
                      {errors.shippingPostalCode && (
                        <span className="field-error">{errors.shippingPostalCode.message}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="shippingState">State/Region</label>
                      <input
                        type="text"
                        id="shippingState"
                        autoComplete="shipping address-level1"
                        placeholder="Prague Region"
                        {...register('shippingState')}
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="shippingCountry">Country *</label>
                      <select
                        id="shippingCountry"
                        autoComplete="shipping country"
                        className={errors.shippingCountry ? 'error' : ''}
                        {...register('shippingCountry')}
                      >
                        <option value="">Select a country</option>
                        {COUNTRIES.map(country => (
                          <option key={country.code} value={country.code}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                      {errors.shippingCountry && (
                        <span className="field-error">{errors.shippingCountry.message}</span>
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
                    {...register('newsletterOptIn')}
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
                      required
                      {...register('termsAccepted')}
                    />
                    <span>
                      I agree to the <a href="/terms-of-service" target="_blank" rel="noopener noreferrer">Terms & Conditions</a> *
                    </span>
                  </label>
                  {errors.termsAccepted && (
                    <span className="field-error">{errors.termsAccepted.message}</span>
                  )}
                </div>

                <div className="form-field checkbox-field">
                  <label className="checkbox-label legal-checkbox">
                    <input
                      type="checkbox"
                      required
                      {...register('privacyAccepted')}
                    />
                    <span>
                      I agree to the <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> *
                    </span>
                  </label>
                  {errors.privacyAccepted && (
                    <span className="field-error">{errors.privacyAccepted.message}</span>
                  )}
                </div>
              </div>

              <div className="stripe-container">
                <StripeCheckoutButton
                  items={items}
                  totalAmount={totals.total}
                  currency={derivedCurrency}
                  email={getValues('email')}
                  firstName={getValues('firstName')}
                  lastName={getValues('lastName')}
                  billingAddress={{
                    street: getValues('billingStreet'),
                    city: getValues('billingCity'),
                    state: getValues('billingState') || '',
                    postalCode: getValues('billingPostalCode'),
                    country: getValues('billingCountry'),
                    companyName: getValues('isCompany') ? getValues('companyName') : undefined,
                    companyId: getValues('isCompany') ? getValues('companyId') : undefined,
                    taxId: getValues('isCompany') ? getValues('taxId') : undefined,
                    vatId: getValues('isCompany') && getValues('vatId') ? getValues('vatId') : undefined,
                    isCompany: getValues('isCompany')
                  }}
                  onError={handleStripeError}
                  disabled={!watch('termsAccepted') || !watch('privacyAccepted')}
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
