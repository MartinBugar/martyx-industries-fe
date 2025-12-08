/**
 * Invoice and Company Settings Type Definitions
 * Corresponds to backend DTOs for Slovak law-compliant invoicing
 */

/**
 * Invoice data with Slovak law compliance
 * Contains complete invoice information including PDF URL and numbering details
 */
export interface InvoiceDto {
  invoice_number: string;
  invoice_year: number;
  invoice_sequence_number: number;
  invoice_issued_at: string; // ISO date string
  invoice_generated_at: string; // ISO date string
  invoice_pdf_url?: string;
  invoice_file_name?: string;
  invoice_content_type?: string;
  order_id: number;
  order_number?: string;
  total_amount: number;
  currency: string;
  company_settings?: CompanySettingsDto;
}

/**
 * Company Settings for invoices
 * Contains company legal information for Slovak law compliance
 */
export interface CompanySettingsDto {
  id: number;
  company_name: string;
  company_id: string; // IČO (Slovak company registration number)
  tax_id: string; // DIČ (Slovak tax ID)
  vat_id?: string; // IČ DPH (Slovak VAT ID)
  is_vat_payer: boolean;
  vat_registration_paragraph?: string; // e.g., "§4"
  vat_registration_date?: string; // ISO date string
  company_founded_date?: string; // ISO date string
  street: string;
  city: string;
  postal_code: string;
  country: string;
  country_code: string;
  email: string;
  phone?: string;
  website?: string;
  bank_name?: string;
  bank_account?: string;
  iban?: string;
  swift_bic?: string;
  registration_court?: string;
  registration_number?: string;
  invoice_prefix?: string;
  invoice_footer_text?: string;
  invoice_notes?: string;
  invoice_issued_by_name?: string; // Name shown on invoice as "Issued by"
  default_vat_rate_percent?: number; // Default VAT rate percentage (fallback)
  payment_terms_days?: number; // Number of days until payment is due
  default_payment_method?: string; // Default payment method text
  is_active: boolean;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

/**
 * Invoice Sequence tracking
 * Tracks last invoice number per year for continuous numbering (Slovak law compliance)
 */
export interface InvoiceSequenceDto {
  id: number;
  year: number;
  last_sequence_number: number;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}
