import { useEffect, useRef, useState } from 'react';
import { logInfo, logWarn, logError } from '../services/logger';

// Type declarations for Google Maps (minimal subset needed)
interface GoogleMapsAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GoogleMapsPlaceResult {
  address_components?: GoogleMapsAddressComponent[];
  formatted_address?: string;
  geometry?: unknown;
}

interface GoogleMapsAutocomplete {
  addListener(event: string, callback: () => void): void;
  getPlace(): GoogleMapsPlaceResult;
}

interface GoogleMapsAutocompleteConstructor {
  new (input: HTMLInputElement, options?: {
    types?: string[];
    fields?: string[];
  }): GoogleMapsAutocomplete;
}

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: GoogleMapsAutocompleteConstructor;
        };
        event?: {
          clearInstanceListeners: (instance: GoogleMapsAutocomplete) => void;
        };
      };
    };
  }
}

/**
 * Google Places API configuration
 * Add your Google Maps API key to .env as VITE_GOOGLE_MAPS_API_KEY
 */
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-script';

/**
 * Address components parsed from Google Places
 */
export interface ParsedAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  countryCode: string;
}

/**
 * Load Google Maps JavaScript API
 */
const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Google Maps script failed to load')));
      return;
    }

    // No API key configured - skip loading
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.trim().length === 0) {
      logWarn('[GooglePlaces] No API key configured. Set VITE_GOOGLE_MAPS_API_KEY in .env');
      reject(new Error('Google Maps API key not configured'));
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.addEventListener('load', () => {
      logInfo('[GooglePlaces] Google Maps API loaded successfully');
      resolve();
    });

    script.addEventListener('error', () => {
      logError('[GooglePlaces] Failed to load Google Maps API');
      reject(new Error('Google Maps script failed to load'));
    });

    document.head.appendChild(script);
  });
};

/**
 * Parse Google Place result into structured address
 */
const parseAddressComponents = (place: GoogleMapsPlaceResult): ParsedAddress | null => {
  if (!place.address_components) {
    return null;
  }

  const address: Partial<ParsedAddress> = {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    countryCode: ''
  };

  let streetNumber = '';
  let route = '';

  place.address_components.forEach((component: GoogleMapsAddressComponent) => {
    const types = component.types;

    if (types.includes('street_number')) {
      streetNumber = component.long_name;
    }
    if (types.includes('route')) {
      route = component.long_name;
    }
    if (types.includes('locality')) {
      address.city = component.long_name;
    }
    if (types.includes('administrative_area_level_1')) {
      address.state = component.long_name;
    }
    if (types.includes('postal_code')) {
      address.zipCode = component.long_name;
    }
    if (types.includes('country')) {
      address.country = component.long_name;
      address.countryCode = component.short_name;
    }
  });

  // Combine street number and route
  address.street = [streetNumber, route].filter(Boolean).join(' ');

  // Validate that we have minimum required fields
  if (!address.city || !address.country) {
    logWarn('[GooglePlaces] Incomplete address data:', address);
    return null;
  }

  return address as ParsedAddress;
};

/**
 * Hook for Google Places Autocomplete
 *
 * @param onAddressSelect - Callback when address is selected
 * @returns inputRef - Ref to attach to input element, isLoaded - Whether API is loaded
 */
export const useGooglePlacesAutocomplete = (
  onAddressSelect: (address: ParsedAddress) => void
) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<GoogleMapsAutocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAutocomplete = async () => {
      try {
        // Load Google Maps API
        await loadGoogleMapsScript();

        if (!inputRef.current || !window.google?.maps?.places) {
          return;
        }

        // Initialize autocomplete
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          fields: ['address_components', 'formatted_address', 'geometry']
        });

        // Handle place selection
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();

          if (!place.address_components) {
            logWarn('[GooglePlaces] No address components in selected place');
            return;
          }

          const parsed = parseAddressComponents(place);
          if (parsed) {
            logInfo('[GooglePlaces] Address selected:', parsed);
            onAddressSelect(parsed);
          }
        });

        autocompleteRef.current = autocomplete;
        setIsLoaded(true);
        setError(null);
      } catch (err) {
        logWarn('[GooglePlaces] Failed to initialize:', err);
        setError(err instanceof Error ? err.message : 'Failed to load Google Places');
        setIsLoaded(false);
      }
    };

    initAutocomplete();

    // Cleanup
    return () => {
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [onAddressSelect]);

  return {
    inputRef,
    isLoaded,
    error
  };
};
