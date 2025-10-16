import { API_BASE_URL, defaultHeaders, withLangHeaders } from '../services/apiUtils';

/**
 * Downloads a CSV export from the admin API.
 * @param endpoint - The export endpoint (e.g., 'users', 'products')
 * @param filename - Optional custom filename
 */
export async function downloadCsvExport(endpoint: string, filename?: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/export/${endpoint}`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    // Get the blob
    const blob = await response.blob();

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename || `export_${endpoint}_${Date.now()}.csv`;

    document.body.appendChild(a);
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}

/**
 * Export utility for admin pages.
 */
export const exportService = {
  users: () => downloadCsvExport('users', `users_export_${Date.now()}.csv`),
  products: () => downloadCsvExport('products', `products_export_${Date.now()}.csv`),
  orders: () => downloadCsvExport('orders', `orders_export_${Date.now()}.csv`),
  payments: () => downloadCsvExport('payments', `payments_export_${Date.now()}.csv`),
  reviews: () => downloadCsvExport('reviews', `reviews_export_${Date.now()}.csv`),
  contacts: () => downloadCsvExport('contacts', `contacts_export_${Date.now()}.csv`),
};
