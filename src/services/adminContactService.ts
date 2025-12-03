import { API_BASE_URL, authHeaders, handleResponse, withLangHeaders } from './apiUtils';

// =========================================================================
// TYPES
// =========================================================================

export interface ContactFormSubmissionDto {
  id: number;
  email: string;
  subject: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  processed: boolean;
  ipAddress?: string;
}

export interface ContactFormStatsDto {
  total: number;
  processed: number;
  unprocessed: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// =========================================================================
// SERVICE
// =========================================================================

class AdminContactService {
  private baseUrl = `${API_BASE_URL}/api/admin/contact-submissions`;

  /**
   * Get all contact form submissions with optional processed filter
   */
  async getSubmissions(
    page = 0,
    size = 20,
    processed?: boolean
  ): Promise<PageResponse<ContactFormSubmissionDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (processed !== undefined) {
      params.append('processed', processed.toString());
    }

    const response = await fetch(`${this.baseUrl}?${params}`, withLangHeaders({
      method: 'GET',
      headers: authHeaders() as HeadersInit,
    }));
    return handleResponse(response);
  }

  /**
   * Get unprocessed submissions count
   */
  async getUnprocessedCount(): Promise<{ count: number }> {
    const response = await fetch(`${this.baseUrl}/unprocessed-count`, withLangHeaders({
      method: 'GET',
      headers: authHeaders() as HeadersInit,
    }));
    return handleResponse(response);
  }

  /**
   * Get submission by ID
   */
  async getById(id: number): Promise<ContactFormSubmissionDto> {
    const response = await fetch(`${this.baseUrl}/${id}`, withLangHeaders({
      method: 'GET',
      headers: authHeaders() as HeadersInit,
    }));
    return handleResponse(response);
  }

  /**
   * Search submissions by email
   */
  async searchByEmail(email: string): Promise<ContactFormSubmissionDto[]> {
    const params = new URLSearchParams({ email });
    const response = await fetch(`${this.baseUrl}/search?${params}`, withLangHeaders({
      method: 'GET',
      headers: authHeaders() as HeadersInit,
    }));
    return handleResponse(response);
  }

  /**
   * Mark submission as processed
   */
  async markAsProcessed(id: number): Promise<ContactFormSubmissionDto> {
    const response = await fetch(`${this.baseUrl}/${id}/process`, withLangHeaders({
      method: 'POST',
      headers: authHeaders() as HeadersInit,
    }));
    return handleResponse(response);
  }

  /**
   * Mark submission as unprocessed
   */
  async markAsUnprocessed(id: number): Promise<ContactFormSubmissionDto> {
    const response = await fetch(`${this.baseUrl}/${id}/unprocess`, withLangHeaders({
      method: 'POST',
      headers: authHeaders() as HeadersInit,
    }));
    return handleResponse(response);
  }

  /**
   * Delete submission
   */
  async deleteSubmission(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, withLangHeaders({
      method: 'DELETE',
      headers: authHeaders() as HeadersInit,
    }));
    if (!response.ok) {
      throw new Error('Failed to delete submission');
    }
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<ContactFormStatsDto> {
    const response = await fetch(`${this.baseUrl}/stats`, withLangHeaders({
      method: 'GET',
      headers: authHeaders() as HeadersInit,
    }));
    return handleResponse(response);
  }

  // =========================================================================
  // HELPERS
  // =========================================================================

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('sk-SK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'práve teraz';
    if (diffMins < 60) return `pred ${diffMins} min`;
    if (diffHours < 24) return `pred ${diffHours} hod`;
    if (diffDays < 7) return `pred ${diffDays} dňami`;
    return this.formatDate(dateStr);
  }
}

export const adminContactService = new AdminContactService();
export default adminContactService;
