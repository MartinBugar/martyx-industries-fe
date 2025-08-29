import { API_BASE_URL, defaultHeaders } from './apiUtils';

export const orderService = {
  downloadProduct: async (orderId: number | string, productId: number | string, productName?: string): Promise<void> => {
    const url = `${API_BASE_URL}/api/orders/${orderId}/items/${productId}/download`;

    // Build headers without forcing Content-Type for binary response
    const headers: Record<string, string> = {};
    const auth = defaultHeaders['Authorization'];
    if (auth) headers['Authorization'] = auth;

    const response = await fetch(url, {
      method: 'GET',
      headers: headers as HeadersInit,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Mirror apiUtils 401 handling
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        delete defaultHeaders['Authorization'];
        window.dispatchEvent(new CustomEvent('auth:logout', {
          detail: { reason: 'api_error' }
        }));
      }
      let errorMessage = `Failed to download product (${response.status})`;
      try {
        const text = await response.text();
        if (text) errorMessage = text;
      } catch {
        // Ignore body parsing errors; use generic message
      }
      throw new Error(errorMessage);
    }

    const blob = await response.blob();

    // Determine filename from Content-Disposition header if present, otherwise use product name
    const cd = response.headers.get('content-disposition') || response.headers.get('Content-Disposition');
    let filename = `product-${productId}.zip`;
    
    if (cd) {
      const match = cd.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
      if (match && match[1]) {
        let fn = match[1].replace(/"/g, '');
        try { fn = decodeURIComponent(fn); } catch { /* ignore decode errors */ }
        filename = fn;
      }
    } else if (productName) {
      // Use product name as filename if no Content-Disposition header
      // Clean the product name to be safe for filenames
      const cleanName = productName
        .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
        .replace(/\s+/g, '-') // Replace spaces with dashes
        .trim();
      filename = cleanName ? `${cleanName}.zip` : `product-${productId}.zip`;
    }

    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  },

  downloadInvoice: async (orderId: number | string): Promise<void> => {
    const url = `${API_BASE_URL}/api/orders/${orderId}/invoice`;

    // Build headers without forcing Content-Type for binary response
    const headers: Record<string, string> = {};
    const auth = defaultHeaders['Authorization'];
    if (auth) headers['Authorization'] = auth;

    const response = await fetch(url, {
      method: 'GET',
      headers: headers as HeadersInit,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Mirror apiUtils 401 handling
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        delete defaultHeaders['Authorization'];
        window.dispatchEvent(new CustomEvent('auth:logout', {
          detail: { reason: 'api_error' }
        }));
      }
      let errorMessage = `Failed to download invoice (${response.status})`;
      try {
        const text = await response.text();
        if (text) errorMessage = text;
      } catch {
        // Ignore body parsing errors; use generic message
      }
      throw new Error(errorMessage);
    }

    const blob = await response.blob();

    // Determine filename from Content-Disposition header if present
    const cd = response.headers.get('content-disposition') || response.headers.get('Content-Disposition');
    let filename = `invoice-order-${orderId}.pdf`;
    if (cd) {
      const match = cd.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
      if (match && match[1]) {
        let fn = match[1].replace(/"/g, '');
        try { fn = decodeURIComponent(fn); } catch { /* ignore decode errors */ }
        filename = fn;
      }
    }

    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  }
};
