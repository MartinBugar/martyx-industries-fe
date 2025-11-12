import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';
import type {
  InvoiceDto,
  CompanySettingsDto
} from '../types/invoice';

/**
 * Service for admin invoice management operations
 */

// Spring Data Page response interface
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

const jsonHeaders = () => defaultHeaders as HeadersInit;

export const adminInvoiceService = {
  /**
   * Get all invoices with pagination and optional search
   * @param page - Page number (default: 0)
   * @param size - Page size (default: 20)
   * @param sortBy - Sort field (default: 'id')
   * @param sortDir - Sort direction (default: 'DESC')
   * @param search - Optional search parameter
   * @returns Paginated list of invoices
   */
  async getAllInvoices(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'id',
    sortDir: string = 'DESC',
    search?: string
  ): Promise<PageResponse<InvoiceDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort: `${sortBy},${sortDir}`
    });

    if (search) {
      params.append('search', search);
    }

    const resp = await fetch(`${API_BASE_URL}/api/admin/invoices?${params}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as PageResponse<InvoiceDto>;
  },

  /**
   * Get invoice details by ID
   * @param id - Invoice ID
   * @returns Invoice details
   */
  async getInvoiceById(id: number): Promise<InvoiceDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/invoices/${id}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as InvoiceDto;
  },

  /**
   * Get invoice for a specific order
   * @param orderId - Order ID
   * @returns Invoice details
   */
  async getInvoiceByOrderId(orderId: number): Promise<InvoiceDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/invoices/order/${orderId}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as InvoiceDto;
  },

  /**
   * Download invoice PDF
   * @param id - Invoice ID
   * @returns PDF file as blob
   */
  async downloadInvoicePdf(id: number): Promise<Blob> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/invoices/${id}/pdf`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    if (!resp.ok) {
      throw new Error(`Failed to download invoice PDF: ${resp.statusText}`);
    }

    return await resp.blob();
  },

  /**
   * Generate invoice for an order
   * @param orderId - Order ID
   * @returns Created invoice
   */
  async generateInvoice(orderId: number): Promise<InvoiceDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/invoices/generate/${orderId}`, {
      method: 'POST',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as InvoiceDto;
  },

  /**
   * Regenerate invoice PDF
   * @param id - Invoice ID
   * @returns Updated invoice
   */
  async regenerateInvoice(id: number): Promise<InvoiceDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/invoices/${id}/regenerate`, {
      method: 'POST',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as InvoiceDto;
  },

  /**
   * Get company settings
   * @returns Company settings
   */
  async getCompanySettings(): Promise<CompanySettingsDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/invoices/company-settings`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as CompanySettingsDto;
  },

  /**
   * Update company settings
   * @param dto - Company settings data
   * @returns Updated company settings
   */
  async updateCompanySettings(dto: CompanySettingsDto): Promise<CompanySettingsDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/invoices/company-settings`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(dto),
    });

    return await handleResponse(resp) as CompanySettingsDto;
  },

  /**
   * Download invoice PDF and trigger browser download
   * @param id - Invoice ID
   * @param invoiceNumber - Invoice number for filename
   */
  async downloadAndSaveInvoicePdf(id: number, invoiceNumber: string): Promise<void> {
    const blob = await this.downloadInvoicePdf(id);

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Bulk download multiple invoices
   * @param invoices - Array of invoices to download
   */
  async bulkDownloadInvoices(invoices: InvoiceDto[]): Promise<void> {
    if (invoices.length === 0) {
      throw new Error('No invoices selected for download');
    }

    // Download each invoice individually with small delay
    for (const invoice of invoices) {
      try {
        await this.downloadAndSaveInvoicePdf(invoice.order_id, invoice.invoice_number);

        // Add small delay between downloads to avoid browser blocking
        if (invoices.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Failed to download invoice ${invoice.invoice_number}:`, error);
        // Continue with other downloads even if one fails
      }
    }
  },

  /**
   * Resend invoice email to customer
   * Note: This endpoint needs to be added to the backend
   * @param id - Invoice ID
   * @param email - Optional email address (if different from order email)
   */
  async resendInvoiceEmail(id: number, email?: string): Promise<{ message: string }> {
    const body = email ? JSON.stringify({ email }) : undefined;

    const resp = await fetch(`${API_BASE_URL}/api/admin/invoices/${id}/resend-email`, {
      method: 'POST',
      headers: jsonHeaders(),
      body,
    });

    return await handleResponse(resp) as { message: string };
  },
};
