import { API_BASE_URL, defaultHeaders } from './apiUtils';

// Normalize a potentially relative URL to an absolute URL targeting the backend API.
// If the URL starts with /api, we prefix with API_BASE_URL unless the current origin already matches.
const toAbsoluteApiUrl = (url: string): string => {
  try {
    if (!url) return url;
    // Already absolute
    if (/^https?:\/\//i.test(url)) return url;
    // Relative API route
    if (url.startsWith('/')) {
      // If API_BASE_URL origin equals window.location.origin, we can keep it relative
      try {
        const api = new URL(API_BASE_URL);
        if (typeof window !== 'undefined' && window.location && api.origin === window.location.origin) {
          return url; // dev proxy or same-origin deployment
        }
      } catch {
        // Fallback to prefix
      }
      return `${API_BASE_URL}${url}`;
    }
    // Other relative paths – treat as-is
    return url;
  } catch {
    return url;
  }
};

const extractFilenameFromDisposition = (disp?: string | null): string | undefined => {
  if (!disp) return undefined;
  // Try RFC 5987
  let m = disp.match(/filename\*=(?:UTF-8)?'(?:[^']*)'([^;\r\n]+)/i);
  if (m && m[1]) {
    const raw = m[1].trim().replace(/^"|"$/g, '');
    try { return decodeURIComponent(raw); } catch { return raw; }
  }
  m = disp.match(/filename\*=UTF-8''([^;\r\n]+)/i);
  if (m && m[1]) {
    const raw = m[1].trim().replace(/^"|"$/g, '');
    try { return decodeURIComponent(raw); } catch { return raw; }
  }
  // Quoted filename
  m = disp.match(/filename="([^"\r\n]+)"/i);
  if (m && m[1]) {
    const raw = m[1].trim();
    try { return decodeURIComponent(raw); } catch { return raw; }
  }
  // Unquoted
  m = disp.match(/filename=([^;\r\n]+)/i);
  if (m && m[1]) {
    const raw = m[1].trim().replace(/^"|"$/g, '');
    try { return decodeURIComponent(raw); } catch { return raw; }
  }
  return undefined;
};

const sanitizeFilename = (name?: string): string => {
  const base = (name || '').split(/[\\/]/).pop() || '';
  const cleaned = base.replace(/[^a-zA-Z0-9 ._()-]+/g, '_').trim();
  const trimmed = cleaned.replace(/^[. ]+|[. ]+$/g, '');
  return trimmed || 'download';
};

export type DownloadOptions = {
  suggestedName?: string;
  // Use credentials if you rely on cookies/sessions
  withCredentials?: boolean;
  // Allow caller to customize error message for UI
  friendlyError?: string;
  // If true, force the final filename to have .zip extension
  forceZip?: boolean;
};

// Core helper to fetch a URL (absolute or relative), read Blob, and trigger a download.
export const downloadFile = async (inputUrl: string, opts: DownloadOptions = {}): Promise<boolean> => {
  const { suggestedName, withCredentials = true, friendlyError } = opts;
  if (!inputUrl) {
    console.debug('[downloadFile] No URL provided');
    return false;
  }
  const url = toAbsoluteApiUrl(inputUrl);
  console.debug('[downloadFile] Fetching', { inputUrl, url, withCredentials });

  // Build headers without forcibly setting Content-Type for binary downloads
  const headers: Record<string, string> = {};
  Object.entries(defaultHeaders).forEach(([k, v]) => {
    if (v !== undefined) headers[k] = v as string;
  });
  delete headers['Content-Type'];

  const response = await fetch(url, {
    method: 'GET',
    headers: headers as HeadersInit,
    credentials: withCredentials ? 'include' : 'same-origin',
  });

  if (!response.ok) {
    const status = response.status;
    let msg: string | undefined;
    try { msg = await response.text(); } catch { /* ignore */ }
    console.debug('[downloadFile] Non-OK response', { status, msg });
    const error = friendlyError || (status === 401 || status === 403 || status === 410
      ? 'Your link may have expired or you are not authorized.'
      : 'Failed to download file.');
    throw new Error(error);
  }

  const blob = await response.blob();
  if (!blob || blob.size === 0) {
    console.debug('[downloadFile] Empty blob');
    throw new Error('File is empty or unavailable.');
  }

  // Determine filename: server header takes precedence
  const disp = response.headers.get('Content-Disposition') || response.headers.get('content-disposition') || undefined;
  const fromHeader = extractFilenameFromDisposition(disp);
  let finalName = sanitizeFilename(fromHeader || suggestedName);

  // Enforce .zip extension if requested
  if (opts.forceZip) {
    if (!finalName) finalName = 'product.zip';
    // If already has .zip (any case), normalize to .zip
    if (/\.zip$/i.test(finalName)) {
      finalName = finalName.replace(/\.[^.]+$/i, '.zip');
    } else {
      // Remove existing extension and append .zip
      finalName = finalName.replace(/\.[^.]+$/i, '');
      finalName = `${finalName}.zip`;
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = finalName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  return true;
};

export const downloadByUrl = async (url: string, suggestedName?: string): Promise<boolean> => {
  try {
    return await downloadFile(url, {
      suggestedName,
      withCredentials: true,
      friendlyError: 'Failed to download product. Your link may have expired; please check your email for a fresh link.',
    });
  } catch (e) {
    console.debug('[downloadByUrl] Error', e);
    throw e;
  }
};

// Product-specific variant that enforces .zip filenames
export const downloadProductByUrl = async (url: string, suggestedName?: string): Promise<boolean> => {
  try {
    // Ensure suggested name ends with .zip if provided
    let name = suggestedName;
    if (name) {
      if (/\.zip$/i.test(name)) {
        name = name.replace(/\.[^.]+$/i, '.zip');
      } else {
        name = name.replace(/\.[^.]+$/i, '');
        name = `${name}.zip`;
      }
    }
    return await downloadFile(url, {
      suggestedName: name,
      withCredentials: true,
      friendlyError: 'Failed to download product. Your link may have expired; please check your email for a fresh link.',
      forceZip: true,
    });
  } catch (e) {
    console.debug('[downloadProductByUrl] Error', e);
    throw e;
  }
};

export const downloadInvoiceByUrl = async (url: string, suggestedName?: string): Promise<boolean> => {
  try {
    // Ensure a .pdf suffix if no extension is present in suggestedName
    const name = suggestedName && /\.[A-Za-z0-9]{2,5}$/.test(suggestedName) ? suggestedName : (suggestedName ? `${suggestedName}.pdf` : undefined);
    return await downloadFile(url, {
      suggestedName: name,
      withCredentials: true,
      friendlyError: 'Failed to download invoice. Please try again later or check your email.',
    });
  } catch (e) {
    console.debug('[downloadInvoiceByUrl] Error', e);
    throw e;
  }
};
