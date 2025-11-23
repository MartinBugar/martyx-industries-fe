import React, { useState, useMemo, useEffect } from 'react';
import { logInfo, logWarn, logError } from '../../services/logger';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCart } from '../../context/useCart';
import { useAuth } from '../../context/useAuth';
import { useFormatters } from '../../hooks/useFormatters';
import './Checkout.css';
import StripeCheckoutButton from '../../components/StripeCheckoutButton';
import { shippingService } from '../../services/shippingService';
import { discountService } from '../../services/discountService';
import { addressService, type SavedAddress } from '../../services/addressService';
import { userCreditsService, type UserCreditDto } from '../../services/referralService';
import { useGooglePlacesAutocomplete, type ParsedAddress } from '../../hooks/useGooglePlacesAutocomplete';
import type { ShippingOptionDto } from '../../types/shipping';
import type { DiscountValidationDto } from '../../types/discounts';
import {
  trackBeginCheckout,
  trackAddShippingInfo,
  trackAddPaymentInfo
} from '../../services/analyticsService';
import { checkoutFormSchema, type CheckoutFormData } from '../../schemas/formSchemas';
import { stockReservationService } from '../../services/stockReservationService';
import { ReservationTimer } from '../../components/ReservationTimer/ReservationTimer';

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
    logInfo('[Checkout] Progress saved to sessionStorage');
  } catch (e) {
    logWarn('[Checkout] Failed to save progress:', e);
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
      logInfo('[Checkout] Saved progress expired (older than 24 hours)');
      sessionStorage.removeItem(CHECKOUT_PROGRESS_KEY);
      return null;
    }

    logInfo('[Checkout] Loaded saved progress from', new Date(progress.timestamp).toLocaleString());
    return progress;
  } catch (e) {
    logWarn('[Checkout] Failed to load progress:', e);
    return null;
  }
};

// Clear progress from sessionStorage
const clearProgress = (): void => {
  try {
    sessionStorage.removeItem(CHECKOUT_PROGRESS_KEY);
    logInfo('[Checkout] Progress cleared from sessionStorage');
  } catch (e) {
    logWarn('[Checkout] Failed to clear progress:', e);
  }
};

// Calculate estimated delivery date
const calculateEstimatedDelivery = (deliveryDays: number, formatDate: (date: Date) => string): string => {
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

  return formatDate(currentDate);
};

const Checkout: React.FC = () => {
  const { t } = useTranslation('checkout');
  const { formatDate } = useFormatters();
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

  // Credits state
  const [userCredits, setUserCredits] = useState<UserCreditDto | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [creditsToApply, setCreditsToApply] = useState<number>(0);
  const [creditsError, setCreditsError] = useState('');

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

  // Stock Reservation state
  const [reservationExpiresAt, setReservationExpiresAt] = useState<Date | null>(null);

  // Google Places Autocomplete handler
  const handlePlaceSelect = (address: ParsedAddress) => {
    logInfo('[Checkout] Google Places address selected:', address);

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

  // Check if cart contains any physical products that require shipping
  const hasPhysicalProducts = useMemo(() => {
    return items.some(item => item.product.requiresShipping);
  }, [items]);

  // Calculate cart weight
  const calculateCartWeight = () => {
    return items.reduce((total, item) => {
      const weight = item.product.weightKg || 0.5;
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
      logWarn('[Checkout] Mixed currencies detected in cart items:', currencies);
    }
    return first;
  }, [items]);

  // Calculate totals with discount, credits, shipping, and VAT breakdown
  const calculateTotals = () => {
    const subtotalWithVAT = getTotalPrice(); // Prices already include VAT

    // VAT calculation - use VAT rate from products (Slovak VAT is 23%)
    // Get VAT rate from first product (assuming all products have same VAT rate)
    const VAT_RATE = items.length > 0 && items[0].product.vatRate ? (items[0].product.vatRate / 100) : 0.23;
    const subtotalWithoutVAT = subtotalWithVAT / (1 + VAT_RATE);
    const vatAmount = subtotalWithVAT - subtotalWithoutVAT;

    const discountAmount = discountValidation?.valid ? (discountValidation.calculated_discount_amount || 0) : 0;
    const shippingCost = selectedShipping?.shipping_cost || 0;
    const appliedCredits = creditsToApply;

    // Calculate total: subtotal - discount + shipping - credits
    // Credits can't make total negative
    const totalBeforeCredits = subtotalWithVAT - discountAmount + shippingCost;
    const total = Math.max(0, totalBeforeCredits - appliedCredits);

    return {
      subtotal: subtotalWithVAT,
      subtotalWithoutVAT,
      vatAmount,
      vatRate: VAT_RATE,
      discount: discountAmount,
      shipping: shippingCost,
      credits: appliedCredits,
      total
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
        logInfo('[Checkout] Loaded', addresses.length, 'saved addresses');

        // Auto-select default or first address
        const defaultAddr = addresses.find(addr => addr.isDefault) || addresses[0];
        if (defaultAddr && defaultAddr.id) {
          setSelectedAddressId(defaultAddr.id);
          applyAddress(defaultAddr);
        }
      } catch (error) {
        logError('[Checkout] Failed to load saved addresses:', error);
      } finally {
        setIsLoadingAddresses(false);
      }
    };

    loadSavedAddresses();
  }, [user]);

  // Load user credits on mount (authenticated users only)
  useEffect(() => {
    const loadUserCredits = async () => {
      if (!user) {
        setUserCredits(null);
        return;
      }

      setIsLoadingCredits(true);
      try {
        const credits = await userCreditsService.getBalance();
        setUserCredits(credits);
        logInfo('[Checkout] User has €' + credits.creditBalance.toFixed(2) + ' in credits');
      } catch (error) {
        logError('[Checkout] Failed to load user credits:', error);
        setCreditsError('');
      } finally {
        setIsLoadingCredits(false);
      }
    };

    loadUserCredits();
  }, [user]);

  // Fetch shipping options when entering step 2
  useEffect(() => {
    const fetchShippingOptions = async () => {
      // Skip shipping if all products are digital
      if (!hasPhysicalProducts) {
        logInfo('[Checkout] All products are digital, skipping shipping options fetch');
        setShippingOptions([]);
        setSelectedShipping(null);
        return;
      }

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
          setShippingError(t('shipping.no_options_available'));
        }
      } catch (error) {
        logError('Error fetching shipping options:', error);
        setShippingError(t('shipping.calculation_failed'));
        setShippingOptions([]);
        setSelectedShipping(null);
      } finally {
        setIsLoadingShipping(false);
      }
    };

    fetchShippingOptions();
  }, [currentStep, hasPhysicalProducts]);

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

  // Stock Reservation: Reserve cart items on checkout mount
  useEffect(() => {
    const reserveStock = async () => {
      if (items.length === 0) return;

      try {
        const sessionId = !user ? (localStorage.getItem('martyx_session_id') || undefined) : undefined;
        const response = await stockReservationService.reserveCartItems(
          items.map(item => ({
            variantId: item.product.variantId,
            quantity: item.quantity
          })),
          sessionId
        );

        // Check if expiresAt is null (digital products don't need reservations)
        if (response.expiresAt) {
          setReservationExpiresAt(new Date(response.expiresAt));
          logInfo('✅ Stock reserved until:', response.expiresAt);
        } else {
          // Digital products - no reservation needed
          setReservationExpiresAt(null);
          logInfo('✅ No stock reservation needed (digital products)');
        }
      } catch (error) {
        logError('❌ Failed to reserve stock:', error);
        alert('Some items may not be available. Please check your cart.');
      }
    };

    reserveStock();

    // Cleanup: release reservations when leaving checkout
    return () => {
      const sessionId = !user ? (localStorage.getItem('martyx_session_id') || undefined) : undefined;
      stockReservationService.releaseReservations(sessionId).catch(logError);
    };
  }, []); // Run once on mount

  // Apply saved address to form
  const applyAddress = (address: SavedAddress) => {
    setValue('billingStreet', address.street);
    setValue('billingCity', address.city);
    setValue('billingState', address.state || '');
    setValue('billingPostalCode', address.zipCode);
    setValue('billingCountry', address.country);

    // Trigger validation for updated fields
    trigger(['billingStreet', 'billingCity', 'billingState', 'billingPostalCode', 'billingCountry']);

    logInfo('[Checkout] Applied address:', address.label || 'Unnamed address');
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
      alert(t('alerts.sign_in_required'));
      return;
    }

    // Validate that address fields are filled
    if (!formData.billingStreet || !formData.billingCity || !formData.billingPostalCode || !formData.billingCountry) {
      alert(t('alerts.complete_billing_first'));
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
      logInfo('[Checkout] Saved address:', saved.label);

      // Reload saved addresses
      const addresses = await addressService.getAllSavedAddresses();
      setSavedAddresses(addresses);
      setSelectedAddressId(saved.id || '');
      setShowSaveAddressOption(false);

      alert(t('alerts.address_saved', { name: saved.label }));
    } catch (err: unknown) {
      logError('[Checkout] Failed to save address:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert(t('alerts.address_save_failed', { error: errorMessage }));
    }
  };

  // Handle delete saved address
  const handleDeleteAddress = async (addressId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!window.confirm(t('alerts.confirm_delete_address'))) {
      return;
    }

    try {
      addressService.removeAddress(addressId);
      logInfo('[Checkout] Deleted address:', addressId);

      // Reload saved addresses
      const addresses = await addressService.getAllSavedAddresses();
      setSavedAddresses(addresses);

      if (selectedAddressId === addressId) {
        setSelectedAddressId('');
      }
    } catch (error) {
      logError('[Checkout] Failed to delete address:', error);
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
      setDiscountError(t('discount.enter_code'));
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
      logError('Error validating discount code:', error);
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

  // Handle credits application
  const handleApplyCredits = () => {
    if (!userCredits || userCredits.creditBalance <= 0) {
      setCreditsError(t('credits.no_balance'));
      return;
    }

    setCreditsError('');
    const totals = calculateTotals();
    const totalBeforeCredits = totals.subtotal - totals.discount + totals.shipping;

    // BUSINESS RULE 1: Minimum order value of €20 to use credits
    const MINIMUM_ORDER_VALUE = 20.00;
    if (totals.subtotal < MINIMUM_ORDER_VALUE) {
      setCreditsError(`Credits can only be used on orders of €${MINIMUM_ORDER_VALUE.toFixed(2)} or more. Current order: €${totals.subtotal.toFixed(2)}`);
      return;
    }

    // BUSINESS RULE 2: Maximum 50% of order can be paid with credits
    const MAX_CREDIT_PERCENTAGE = 0.50;
    const maxAllowedCredits = totals.subtotal * MAX_CREDIT_PERCENTAGE;

    // Calculate applicable amount considering all constraints:
    // 1. Cannot exceed user's available balance
    // 2. Cannot exceed order total
    // 3. Cannot exceed 50% of order total
    const maxApplicable = Math.min(
      userCredits.creditBalance,
      totalBeforeCredits,
      maxAllowedCredits
    );

    setCreditsToApply(maxApplicable);

    logInfo('[Checkout] Applied €' + maxApplicable.toFixed(2) + ' in credits (max allowed: €' + maxAllowedCredits.toFixed(2) + ')');
  };

  // Handle credits removal
  const handleRemoveCredits = () => {
    setCreditsToApply(0);
    setCreditsError('');
  };

  // Calculate maximum credits user can apply based on business rules
  const calculateMaxApplicableCredits = useMemo(() => {
    if (!userCredits || userCredits.creditBalance <= 0) return null;

    const totals = calculateTotals();
    const totalBeforeCredits = totals.subtotal - totals.discount + totals.shipping;

    const MINIMUM_ORDER_VALUE = 20.00;
    const MAX_CREDIT_PERCENTAGE = 0.50;

    // Check minimum order value
    if (totals.subtotal < MINIMUM_ORDER_VALUE) {
      return {
        canApply: false,
        reason: `Minimum order of €${MINIMUM_ORDER_VALUE.toFixed(2)} required`,
        maxAmount: 0
      };
    }

    // Calculate max allowed (50% of order)
    const maxAllowedCredits = totals.subtotal * MAX_CREDIT_PERCENTAGE;
    const maxApplicable = Math.min(
      userCredits.creditBalance,
      totalBeforeCredits,
      maxAllowedCredits
    );

    return {
      canApply: true,
      maxAmount: maxApplicable,
      isLimitedByBalance: userCredits.creditBalance < maxAllowedCredits,
      isLimitedByOrderValue: maxAllowedCredits < userCredits.creditBalance
    };
  }, [userCredits, items, discountValidation, selectedShipping]);

  // Stripe error handler
  const handleStripeError = (err: unknown) => {
    logError('Stripe payment error:', err);
    setPayStatus("error");
    alert(t('payment.failed'));
  };

  // Validate legal consents before payment
  // @ts-ignore - Reserved for validation logic
  const validateLegalConsents = (): boolean => {
    if (!formData.termsAccepted) {
      alert(t('alerts.accept_terms'));
      return false;
    }
    if (!formData.privacyAccepted) {
      alert(t('alerts.accept_privacy'));
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
        alert(t('alerts.fill_required_fields'));
        return;
      }

      // If all products are digital, skip shipping step (2) and go directly to payment (3)
      if (!hasPhysicalProducts) {
        logInfo('[Checkout] All products digital, skipping to payment step');
        setCurrentStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    if (currentStep === 2) {
      // Validate shipping selection (only for physical products)
      if (hasPhysicalProducts && !selectedShipping) {
        alert(t('alerts.select_shipping_method'));
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
      // If on step 3 and all products are digital, skip back to step 1 (bypass shipping)
      if (currentStep === 3 && !hasPhysicalProducts) {
        logInfo('[Checkout] All products digital, skipping back to information step');
        setCurrentStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Empty cart check
  if (items.length === 0) {
    return (
      <main className="checkout-container" role="main">
        <div className="empty-cart-message">
          <h2>{t('cart.empty')}</h2>
          <p>{t('cart.empty_message')}</p>
          <button
            className="continue-shopping-btn"
            onClick={() => navigate('/products')}
          >
            {t('buttons.continue_shopping')}
          </button>
        </div>
      </main>
    );
  }

  if (searchParams.get('paymentId')) {
    return (
      <main className="checkout-container" role="main">
        <div className="empty-cart-message">
          <h2>{t('payment.finalizing')}</h2>
          <p>{t('payment.redirecting')}</p>
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
      {/* Stock Reservation Timer - Show countdown if reservation is active */}
      {reservationExpiresAt && (
        <ReservationTimer
          expiresAt={reservationExpiresAt}
          onExpired={() => {
            logWarn('[Checkout] Stock reservation expired');
            setReservationExpiresAt(null);
            alert('Your stock reservation has expired. Please review your cart and try again.');
          }}
        />
      )}

      <div className="checkout-header">
        {/* Progress Steps - 2 or 3 STEPS depending on product type */}
        <div className="checkout-steps">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            {t('steps.information')}
          </div>

          {/* Show Shipping step only if cart has physical products */}
          {hasPhysicalProducts && (
            <>
              <div className="step-divider"></div>
              <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                {t('steps.shipping')}
              </div>
            </>
          )}

          <div className="step-divider"></div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
            {t('steps.review')}
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
                {t('form.contact_information')}
              </h2>

              {/* Guest Checkout Notice - Only shown for non-authenticated users */}
              {!user && (
                <div className="guest-checkout-notice">
                  <div className="notice-icon">ℹ️</div>
                  <div className="notice-content">
                    <strong>{t('form.guest_checkout')}</strong>
                    <p>
                      {t('form.guest_checkout_notice')}
                      <a href="/login" className="notice-link"> {t('form.sign_in')}</a>
                    </p>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="form-field">
                <label htmlFor="email">{t('form.email_address')} *</label>
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
                  <label htmlFor="firstName">{t('form.first_name')} *</label>
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
                  <label htmlFor="lastName">{t('form.last_name')} *</label>
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
                <label htmlFor="phone">{t('form.phone_number')} *</label>
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
                  <span>{t('form.purchasing_as_company')}</span>
                </label>
              </div>

              {/* B2B Fields */}
              {watch('isCompany') && (
                <div className="b2b-fields">
                  <div className="form-field">
                    <label htmlFor="companyName">{t('form.company_name')} *</label>
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
                      <label htmlFor="companyId">{t('form.company_id')} *</label>
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
                      <label htmlFor="taxId">{t('form.tax_id')} *</label>
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
                    <label htmlFor="vatId">{t('form.vat_number')}</label>
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

              <h3 className="subsection-title">{t('billing.title')}</h3>

              {/* Saved Addresses Selector - Only for authenticated users */}
              {user && (
                <div className="saved-addresses-section">
                  {isLoadingAddresses ? (
                    <div className="loading-addresses">
                      <span className="loading-spinner">⏳</span>
                      {t('form.loading_addresses')}
                    </div>
                  ) : savedAddresses.length > 0 ? (
                    <div className="form-field">
                      <label htmlFor="savedAddress">{t('form.saved_addresses')}</label>
                      <div className="saved-address-selector-wrapper">
                        <select
                          id="savedAddress"
                          className="saved-address-selector"
                          value={selectedAddressId}
                          onChange={handleAddressSelect}
                        >
                          <option value="">{t('form.new_address')}</option>
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
                            aria-label={t('form.delete')}
                            title={t('form.delete')}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                      <p className="field-hint">
                        {savedAddresses.length} {t('form.saved_addresses_available', { count: savedAddresses.length })}
                      </p>
                    </div>
                  ) : (
                    <div className="no-saved-addresses">
                      <p className="hint-text">{t('form.no_saved_addresses')}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="form-field">
                <label htmlFor="billingStreet">
                  {t('form.street_address')} *
                  {isAutocompleteLoaded && <span className="autocomplete-badge">🌍 {t('form.autocomplete')}</span>}
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
                  <span className="field-hint text-warning">{t('form.autocomplete_unavailable')}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="billingCity">{t('form.city')} *</label>
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
                  <label htmlFor="billingPostalCode">{t('form.postal_code')} *</label>
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
                  <label htmlFor="billingState">{t('form.state_province')}</label>
                  <input
                    type="text"
                    id="billingState"
                    autoComplete="address-level1"
                    placeholder="Bratislava Region"
                    {...register('billingState')}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="billingCountry">{t('form.country')} *</label>
                  <select
                    id="billingCountry"
                    autoComplete="country"
                    required
                    className={errors.billingCountry ? 'error' : ''}
                    {...register('billingCountry')}
                  >
                    <option value="">{t('form.select_country')}</option>
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
                  <span>{t('form.ship_different_address')}</span>
                </label>
              </div>

              {/* Shipping Address Fields */}
              {watch('shipToDifferentAddress') && (
                <div className="shipping-address-fields">
                  <h3 className="subsection-title">{t('form.shipping_address')}</h3>

                  <div className="form-field">
                    <label htmlFor="shippingStreet">{t('form.street_address')} *</label>
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
                      <label htmlFor="shippingCity">{t('form.city')} *</label>
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
                      <label htmlFor="shippingPostalCode">{t('form.postal_code')} *</label>
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
                      <label htmlFor="shippingState">{t('form.state_province')}</label>
                      <input
                        type="text"
                        id="shippingState"
                        autoComplete="shipping address-level1"
                        placeholder="Prague Region"
                        {...register('shippingState')}
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="shippingCountry">{t('form.country')} *</label>
                      <select
                        id="shippingCountry"
                        autoComplete="shipping country"
                        className={errors.shippingCountry ? 'error' : ''}
                        {...register('shippingCountry')}
                      >
                        <option value="">{t('form.select_country')}</option>
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
                  <span>{t('form.news_offers')}</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 2: SHIPPING METHOD */}
          {currentStep === 2 && (
            <div className="shipping-step">
              <h2 className="section-title">
                <span className="section-number">2</span>
                {t('form.shipping_method')}
              </h2>

              {isLoadingShipping ? (
                <div className="loading-message">
                  <span className="loading-spinner">⏳</span>
                  {t('shipping.calculating')}
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
                      ? calculateEstimatedDelivery(deliveryDaysMax, formatDate)
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
                              {deliveryDaysDisplay} {t('form.business_days')}
                              {estimatedDate && ` · ${t('form.estimated_delivery')}: ${estimatedDate}`}
                            </div>
                          )}
                        </div>
                        <div className="shipping-price">
                          {(option.shipping_cost || 0) === 0 ? t('cart.free') : `€${(option.shipping_cost || 0).toFixed(2)}`}
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="no-shipping-message">
                  <p>{t('shipping.no_options_location')}</p>
                  <p className="hint">{t('shipping.check_address')}</p>
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
                {t('steps.review')}
              </h2>

              {/* Order Review Summary */}
              <div className="order-review-summary">
                <h3 className="review-section-title">{t('order_summary.title')}</h3>

                {/* Contact Info */}
                <div className="review-section">
                  <div className="review-header">
                    <strong>{t('form.contact')}</strong>
                    <button
                      className="edit-btn"
                      onClick={() => setCurrentStep(1)}
                      aria-label={t('form.edit')}
                    >
                      {t('form.edit')}
                    </button>
                  </div>
                  <p>{formData.email}</p>
                  <p>{formData.phone}</p>
                </div>

                {/* Billing Address */}
                <div className="review-section">
                  <div className="review-header">
                    <strong>{t('billing.title')}</strong>
                    <button
                      className="edit-btn"
                      onClick={() => setCurrentStep(1)}
                      aria-label={t('form.edit')}
                    >
                      {t('form.edit')}
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
                    <strong>{t('form.shipping_address')}</strong>
                    <button
                      className="edit-btn"
                      onClick={() => setCurrentStep(1)}
                      aria-label={t('form.edit')}
                    >
                      {t('form.edit')}
                    </button>
                  </div>
                  {formData.shipToDifferentAddress ? (
                    <>
                      <p>{formData.shippingStreet}</p>
                      <p>{formData.shippingCity}, {formData.shippingPostalCode}</p>
                      <p>{COUNTRIES.find(c => c.code === formData.shippingCountry)?.name || formData.shippingCountry}</p>
                    </>
                  ) : (
                    <p>{t('form.same_as_billing')}</p>
                  )}
                </div>

                {/* Shipping Method - Only show if cart has physical products */}
                {hasPhysicalProducts && selectedShipping && (
                  <div className="review-section">
                    <div className="review-header">
                      <strong>{t('form.shipping_method')}</strong>
                      <button
                        className="edit-btn"
                        onClick={() => setCurrentStep(2)}
                        aria-label={t('form.edit')}
                      >
                        {t('form.edit')}
                      </button>
                    </div>
                    <p>{selectedShipping.rate_name}</p>
                    <p className="review-meta">
                      {selectedShipping.shipping_cost === 0 ? t('cart.free') : `€${selectedShipping.shipping_cost.toFixed(2)}`}
                    </p>
                  </div>
                )}

                {/* Digital Products Notice */}
                {!hasPhysicalProducts && (
                  <div className="review-section">
                    <div className="review-header">
                      <strong>{t('form.delivery_method')}</strong>
                    </div>
                    <div className="digital-delivery-notice">
                      <span className="delivery-icon">📧</span>
                      <p>{t('summary.digital_delivery_note')}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="subsection-divider"></div>

              {/* Payment */}
              <h3 className="review-section-title">{t('payment.title')}</h3>

              <div className="payment-security-badge">
                <span className="lock-icon">🔒</span>
                <span>{t('form.secure_payment_stripe')}</span>
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
                      {t('form.terms_consent')} <a href="/terms-of-service" target="_blank" rel="noopener noreferrer">{t('form.terms_link')}</a> {t('form.and')} <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">{t('form.privacy_policy_link')}</a> *
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
                      {...register('privacyAccepted')}
                    />
                    <span>
                      {t('form.newsletter_consent')}
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
                  disabled={!watch('termsAccepted')}
                  creditsToApply={creditsToApply}
                  discountCode={discountValidation?.valid ? discountValidation.code : undefined}
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
              ← {t('buttons.continue_shopping')}
            </button>

            <div className="nav-btn-group">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="nav-btn nav-btn-back"
                >
                  ← {t('buttons.back')}
                </button>
              )}

              {currentStep < 3 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="nav-btn nav-btn-next"
                >
                  {t('buttons.continue')} →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Order Summary - RIGHT SIDE (STICKY) */}
        <div className="order-summary-card" role="region" aria-labelledby="order-summary-title">
          <h2 id="order-summary-title">{t('order_summary.title')}</h2>

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
                      {t('summary.qty')}: {qty}
                      {currentStep === 1 && (
                        <div className="quantity-controls-inline">
                          <button
                            onClick={() => updateQuantity(item.product.variantId.toString(), qty - 1)}
                            className="qty-btn"
                            disabled={item.product.variantType === 'DIGITAL_ONLY'}
                            aria-label={t('cart.decrease_quantity')}
                          >
                            −
                          </button>
                          <button
                            onClick={() => updateQuantity(item.product.variantId.toString(), qty + 1)}
                            className="qty-btn"
                            disabled={item.product.variantType === 'DIGITAL_ONLY'}
                            aria-label={t('cart.increase_quantity')}
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
                        aria-label={t('cart.remove_item')}
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
                  placeholder={t('discount.code')}
                  disabled={isValidatingDiscount}
                />
                <button
                  type="button"
                  className="apply-discount-btn"
                  onClick={handleValidateDiscount}
                  disabled={isValidatingDiscount || !discountCode.trim()}
                >
                  {t('buttons.apply')}
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
                  aria-label={t('discount.remove')}
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

          {/* Credits Section - Only for authenticated users */}
          {user && !isLoadingCredits && userCredits && userCredits.creditBalance > 0 && (
            <>
              <div className="order-divider"></div>
              <div className="credits-section">
                {creditsToApply === 0 ? (
                  <>
                    <div className="credits-info">
                      <span className="credits-label">Available Credits:</span>
                      <span className="credits-balance">€{userCredits.creditBalance.toFixed(2)}</span>
                    </div>

                    {/* Show max applicable amount info */}
                    {calculateMaxApplicableCredits && !calculateMaxApplicableCredits.canApply && (
                      <p className="field-hint text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        {calculateMaxApplicableCredits.reason}
                      </p>
                    )}

                    {calculateMaxApplicableCredits && calculateMaxApplicableCredits.canApply && (
                      <p className="field-hint" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        You can use up to €{calculateMaxApplicableCredits.maxAmount.toFixed(2)}
                        {calculateMaxApplicableCredits.isLimitedByOrderValue && ' (max 50% of order)'}
                      </p>
                    )}

                    <button
                      type="button"
                      className="apply-credits-btn"
                      onClick={handleApplyCredits}
                      disabled={!calculateMaxApplicableCredits || !calculateMaxApplicableCredits.canApply}
                    >
                      Use Credits
                    </button>
                  </>
                ) : (
                  <div className="credits-applied">
                    <div className="credits-info-applied">
                      <span className="credits-icon">💰</span>
                      <span className="credits-amount">€{creditsToApply.toFixed(2)} Credits Applied</span>
                    </div>
                    <button
                      type="button"
                      className="remove-credits-btn"
                      onClick={handleRemoveCredits}
                      aria-label="Remove credits"
                    >
                      ×
                    </button>
                  </div>
                )}

                {creditsError && (
                  <div className="error-message-small">
                    {creditsError}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="order-divider"></div>

          {/* Order Breakdown */}
          <div className="order-breakdown">
            <div className="breakdown-row">
              <span>{t('summary.subtotal_excl_vat')}</span>
              <span>€{totals.subtotalWithoutVAT.toFixed(2)}</span>
            </div>

            <div className="breakdown-row vat-row">
              <span>{t('summary.vat')} ({(totals.vatRate * 100).toFixed(0)}%)</span>
              <span>€{totals.vatAmount.toFixed(2)}</span>
            </div>

            {discountValidation?.valid && totals.discount > 0 && (
              <div className="breakdown-row discount-row">
                <span>{t('order_summary.discount')}</span>
                <span className="discount-amount">-€{totals.discount.toFixed(2)}</span>
              </div>
            )}

            {/* Show shipping cost only if cart has physical products */}
            {hasPhysicalProducts && selectedShipping && (
              <div className="breakdown-row">
                <span>{t('order_summary.shipping')}</span>
                <span>
                  {totals.shipping === 0 ? t('cart.free') : `€${totals.shipping.toFixed(2)}`}
                </span>
              </div>
            )}

            {/* Show credits if applied */}
            {creditsToApply > 0 && (
              <div className="breakdown-row credits-row">
                <span>Credits Applied</span>
                <span className="credits-amount">-€{creditsToApply.toFixed(2)}</span>
              </div>
            )}

            {/* Digital delivery notice */}
            {!hasPhysicalProducts && (
              <div className="breakdown-row digital-delivery-row">
                <span>📧 {t('order_summary.delivery')}</span>
                <span className="digital-badge">{t('cart.digital')}</span>
              </div>
            )}

            <div className="order-divider"></div>

            <div className="order-total">
              <span>{t('summary.total_incl_vat')}</span>
              <span>€{totals.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Digital Delivery Badge - Only show for digital-only orders */}
          {!hasPhysicalProducts && (
            <div className="delivery-badge">
              <span className="badge-icon">📧</span>
              <div className="badge-text">
                <strong>{t('summary.instant_delivery')}</strong>
                <p>{t('summary.digital_delivery_note')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Checkout;
