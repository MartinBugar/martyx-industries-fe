export type ConsentCategories = {
  necessary: boolean; // always true when saved
  analytics: boolean;
  marketing: boolean;
};

export type CookieConsent = {
  version: number;
  timestamp: number;
  categories: ConsentCategories;
};

const CONSENT_KEY = 'cookieConsent.v1';
const CURRENT_VERSION = 1;

export function getConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasConsent(): boolean {
  const c = getConsent();
  return !!c && c.version === CURRENT_VERSION;
}

export function saveConsent(categories: Partial<ConsentCategories>): CookieConsent {
  const payload: CookieConsent = {
    version: CURRENT_VERSION,
    timestamp: Date.now(),
    categories: {
      necessary: true,
      analytics: !!categories.analytics,
      marketing: !!categories.marketing,
    },
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
  return payload;
}

export function acceptAll(): CookieConsent {
  return saveConsent({ analytics: true, marketing: true });
}

export function rejectNonEssential(): CookieConsent {
  return saveConsent({ analytics: false, marketing: false });
}

export function resetConsent(): void {
  localStorage.removeItem(CONSENT_KEY);
}
