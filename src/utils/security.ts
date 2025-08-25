/**
 * Bezpečnostné utility funkcie pre frontend
 * Poskytuje ochranu proti XSS, injection útokom a ďalším bezpečnostným rizikám
 */

/**
 * HTML Sanitization - ochrana proti XSS útokom
 */
export const sanitizeHtml = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitizácia textu pre zobrazenie v UI
 */
export const sanitizeText = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Odstránenie control characters
    .replace(/javascript:/gi, '') // Odstránenie javascript: protokolu
    .replace(/data:/gi, '') // Odstránenie data: protokolu pre bezpečnosť
    .replace(/vbscript:/gi, '') // Odstránenie vbscript: protokolu
    .slice(0, 1000); // Limitovanie dĺžky
};

/**
 * Validácia emailovej adresy
 */
export const isValidEmail = (email: string): boolean => {
  if (typeof email !== 'string') return false;
  
  // RFC 5322 compliant regex (zjednodušená verzia)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return emailRegex.test(email) && email.length <= 254;
};

/**
 * Validácia hesla - silné heslo
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
} => {
  const errors: string[] = [];
  let score = 0;
  
  if (typeof password !== 'string') {
    return { isValid: false, errors: ['Heslo musí byť text'], strength: 'weak' };
  }
  
  // Minimálna dĺžka
  if (password.length < 8) {
    errors.push('Heslo musí mať aspoň 8 znakov');
  } else {
    score += 1;
  }
  
  // Maximálna dĺžka
  if (password.length > 128) {
    errors.push('Heslo je príliš dlhé (max 128 znakov)');
  }
  
  // Malé písmená
  if (!/[a-z]/.test(password)) {
    errors.push('Heslo musí obsahovať aspoň jedno malé písmeno');
  } else {
    score += 1;
  }
  
  // Veľké písmená
  if (!/[A-Z]/.test(password)) {
    errors.push('Heslo musí obsahovať aspoň jedno veľké písmeno');
  } else {
    score += 1;
  }
  
  // Číslice
  if (!/\d/.test(password)) {
    errors.push('Heslo musí obsahovať aspoň jednu číslicu');
  } else {
    score += 1;
  }
  
  // Špeciálne znaky
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    errors.push('Heslo musí obsahovať aspoň jeden špeciálny znak');
  } else {
    score += 1;
  }
  
  // Kontrola na common passwords
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Heslo je príliš jednoduché');
    score = 0;
  }
  
  // Určenie sily hesla
  let strength: 'weak' | 'medium' | 'strong' | 'very-strong' = 'weak';
  if (score >= 5 && password.length >= 12) strength = 'very-strong';
  else if (score >= 4 && password.length >= 10) strength = 'strong';
  else if (score >= 3 && password.length >= 8) strength = 'medium';
  
  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
};

/**
 * Bezpečná validácia URL
 */
export const isValidUrl = (url: string): boolean => {
  if (typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    // Povolené iba HTTPS a HTTP protokoly
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

/**
 * Sanitizácia pre LocalStorage klúče
 */
export const sanitizeStorageKey = (key: string): string => {
  if (typeof key !== 'string') return '';
  
  return key
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 50);
};

/**
 * Kontrola CSRF tokenu (ak je implementovaný)
 */
export const validateCSRFToken = (token: string): boolean => {
  if (typeof token !== 'string') return false;
  
  // Token by mal byť base64 string s minimálnou dĺžkou
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(token) && token.length >= 32;
};

/**
 * Rate limiting utility - sleduje počet pokusov
 */
class RateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private maxAttempts: number;
  private windowMs: number;
  
  constructor(maxAttempts = 5, windowMs = 900000) { // 15 minút default
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);
    
    if (!attempt) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }
    
    // Vyresetuj počítadlo ak je okno expired
    if (now - attempt.lastAttempt > this.windowMs) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }
    
    // Zvýš počítadlo
    attempt.count++;
    attempt.lastAttempt = now;
    
    return attempt.count <= this.maxAttempts;
  }
  
  getRemainingTime(identifier: string): number {
    const attempt = this.attempts.get(identifier);
    if (!attempt) return 0;
    
    const now = Date.now();
    const timeSinceLastAttempt = now - attempt.lastAttempt;
    
    if (timeSinceLastAttempt >= this.windowMs) return 0;
    
    return this.windowMs - timeSinceLastAttempt;
  }
  
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// Exporty pre rate limiting
export const loginRateLimiter = new RateLimiter(5, 900000); // 5 pokusov za 15 minút
export const registrationRateLimiter = new RateLimiter(3, 1800000); // 3 pokusy za 30 minút

/**
 * Bezpečné parsovanie JSON
 */
export const safeJsonParse = <T>(jsonString: string, fallback: T): T => {
  try {
    if (typeof jsonString !== 'string') return fallback;
    
    const parsed = JSON.parse(jsonString);
    
    // Základná validácia proti prototype pollution
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      if ('__proto__' in parsed || ('constructor' in parsed && parsed.constructor !== Object) || 'prototype' in parsed) {
        if (import.meta.env.DEV) {
          console.warn('Potential prototype pollution detected in JSON');
        }
        return fallback;
      }
    }
    
    return parsed;
  } catch {
    return fallback;
  }
};

/**
 * Bezpečné uloženie do localStorage s error handling
 */
export const secureLocalStorage = {
  set: (key: string, value: unknown): boolean => {
    try {
      const sanitizedKey = sanitizeStorageKey(key);
      if (!sanitizedKey) return false;
      
      const serialized = JSON.stringify(value);
      localStorage.setItem(sanitizedKey, serialized);
      return true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      return false;
    }
  },
  
  get: <T>(key: string, fallback: T): T => {
    try {
      const sanitizedKey = sanitizeStorageKey(key);
      if (!sanitizedKey) return fallback;
      
      const item = localStorage.getItem(sanitizedKey);
      if (item === null) return fallback;
      
      return safeJsonParse(item, fallback);
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return fallback;
    }
  },
  
  remove: (key: string): boolean => {
    try {
      const sanitizedKey = sanitizeStorageKey(key);
      if (!sanitizedKey) return false;
      
      localStorage.removeItem(sanitizedKey);
      return true;
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
      return false;
    }
  },
  
  clear: (): boolean => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  }
};

/**
 * Content Security Policy reporter (pre development)
 */
export const setupCSPReporting = (): void => {
  if (import.meta.env.DEV) {
    document.addEventListener('securitypolicyviolation', (event) => {
      console.warn('CSP Violation:', {
        directive: event.violatedDirective,
        blockedURI: event.blockedURI,
        documentURI: event.documentURI,
        originalPolicy: event.originalPolicy
      });
    });
  }
};

/**
 * Inicializácia CSRF tokenu z externého modulu
 */
export const initializeCSRFToken = async (): Promise<void> => {
  try {
    const { initializeCSRFToken: initCSRF } = await import('./csrf');
    initCSRF();
  } catch (error) {
    console.error('Failed to initialize CSRF token:', error);
  }
};

/**
 * Kontrola integrity subresource
 */
export const generateIntegrityHash = async (content: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-384', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));
  return `sha384-${hashBase64}`;
};
