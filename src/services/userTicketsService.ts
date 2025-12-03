import { API_BASE_URL, authHeaders, handleResponse, withLangHeaders } from './apiUtils';

// =========================================================================
// TYPES
// =========================================================================

export const TicketStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_CUSTOMER: 'WAITING_CUSTOMER',
  WAITING_INTERNAL: 'WAITING_INTERNAL',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED'
} as const;
export type TicketStatus = typeof TicketStatus[keyof typeof TicketStatus];

export const TicketPriority = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
} as const;
export type TicketPriority = typeof TicketPriority[keyof typeof TicketPriority];

export interface TicketDto {
  id: number;
  ticketNumber: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  categoryId?: number;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  userId?: number;
  customerEmail?: string;
  customerName?: string;
  relatedOrderId?: number;
  relatedOrderNumber?: string;
  assignedToId?: number;
  assignedToName?: string;
  assignedToEmail?: string;
  satisfactionRating?: number;
  satisfactionFeedback?: string;
  createdAt: string;
  updatedAt?: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  // Computed fields
  messageCount?: number;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  isOverdue?: boolean;
  responseTimeMinutes?: number;
  resolutionTimeMinutes?: number;
}

export interface TicketMessageDto {
  id: number;
  ticketId: number;
  content: string;
  senderId?: number;
  senderName?: string;
  senderEmail?: string;
  isStaffReply: boolean;
  internal: boolean;  // Backend uses 'internal' not 'isInternalNote'
  messageType?: string;
  createdAt: string;
  attachments?: string[];
}

// Backend wraps TicketDto inside TicketDetailDto
export interface TicketDetailDto {
  ticket: TicketDto;
  messages: TicketMessageDto[];
  category?: TicketCategoryDto;
  slaResponseHours?: number;
  slaResolutionHours?: number;
  slaResponseBreached?: boolean;
  slaResolutionBreached?: boolean;
}

export interface TicketCategoryDto {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CreateTicketRequest {
  subject: string;
  message: string;
  categoryId?: number;
  priority?: TicketPriority;
  orderId?: number;
}

export interface AddMessageRequest {
  content: string;
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

class UserTicketsService {
  private baseUrl = `${API_BASE_URL}/api/tickets`;

  /**
   * Create a new support ticket
   */
  async createTicket(request: CreateTicketRequest): Promise<TicketDto> {
    const response = await fetch(this.baseUrl, withLangHeaders({
      method: 'POST',
      headers: authHeaders() as HeadersInit,
      body: JSON.stringify(request),
    }));
    return handleResponse(response);
  }

  /**
   * Get all tickets for current user
   */
  async getMyTickets(page = 0, size = 10): Promise<PageResponse<TicketDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort: 'createdAt,desc'
    });

    const response = await fetch(`${this.baseUrl}?${params}`, withLangHeaders({
      method: 'GET',
      headers: authHeaders() as HeadersInit,
    }));
    return handleResponse(response);
  }

  /**
   * Get ticket by ID
   */
  async getTicketById(id: number): Promise<TicketDto> {
    const response = await fetch(`${this.baseUrl}/${id}`, withLangHeaders({
      method: 'GET',
      headers: authHeaders() as HeadersInit,
    }));
    return handleResponse(response);
  }

  /**
   * Get ticket with full details and messages
   */
  async getTicketDetail(id: number): Promise<TicketDetailDto> {
    const response = await fetch(`${this.baseUrl}/${id}/detail`, withLangHeaders({
      method: 'GET',
      headers: authHeaders() as HeadersInit,
    }));
    return handleResponse(response);
  }

  /**
   * Get messages for a ticket
   */
  async getTicketMessages(ticketId: number): Promise<TicketMessageDto[]> {
    const response = await fetch(`${this.baseUrl}/${ticketId}/messages`, withLangHeaders({
      method: 'GET',
      headers: authHeaders() as HeadersInit,
    }));
    return handleResponse(response);
  }

  /**
   * Add a message to a ticket
   */
  async addMessage(ticketId: number, content: string): Promise<TicketMessageDto> {
    const response = await fetch(`${this.baseUrl}/${ticketId}/messages`, withLangHeaders({
      method: 'POST',
      headers: authHeaders() as HeadersInit,
      body: JSON.stringify({ content }),
    }));
    return handleResponse(response);
  }

  /**
   * Close a ticket
   */
  async closeTicket(ticketId: number): Promise<TicketDto> {
    const response = await fetch(`${this.baseUrl}/${ticketId}/close`, withLangHeaders({
      method: 'POST',
      headers: authHeaders() as HeadersInit,
    }));
    return handleResponse(response);
  }

  /**
   * Reopen a closed ticket
   */
  async reopenTicket(ticketId: number): Promise<TicketDto> {
    const response = await fetch(`${this.baseUrl}/${ticketId}/reopen`, withLangHeaders({
      method: 'POST',
      headers: authHeaders() as HeadersInit,
    }));
    return handleResponse(response);
  }

  /**
   * Get available ticket categories
   */
  async getCategories(): Promise<TicketCategoryDto[]> {
    const response = await fetch(`${this.baseUrl}/categories`, withLangHeaders({
      method: 'GET',
      headers: authHeaders() as HeadersInit,
    }));
    return handleResponse(response);
  }

  // =========================================================================
  // HELPERS
  // =========================================================================

  getStatusLabel(status: TicketStatus): string {
    const labels: Record<TicketStatus, string> = {
      [TicketStatus.OPEN]: 'Open',
      [TicketStatus.IN_PROGRESS]: 'In Progress',
      [TicketStatus.WAITING_CUSTOMER]: 'Waiting for You',
      [TicketStatus.WAITING_INTERNAL]: 'Under Review',
      [TicketStatus.RESOLVED]: 'Resolved',
      [TicketStatus.CLOSED]: 'Closed'
    };
    return labels[status] || status;
  }

  getStatusColor(status: TicketStatus): string {
    const colors: Record<TicketStatus, string> = {
      [TicketStatus.OPEN]: '#3b82f6',
      [TicketStatus.IN_PROGRESS]: '#f59e0b',
      [TicketStatus.WAITING_CUSTOMER]: '#ef4444',
      [TicketStatus.WAITING_INTERNAL]: '#8b5cf6',
      [TicketStatus.RESOLVED]: '#10b981',
      [TicketStatus.CLOSED]: '#6b7280'
    };
    return colors[status] || '#6b7280';
  }

  getPriorityLabel(priority: TicketPriority): string {
    const labels: Record<TicketPriority, string> = {
      [TicketPriority.LOW]: 'Low',
      [TicketPriority.NORMAL]: 'Normal',
      [TicketPriority.HIGH]: 'High',
      [TicketPriority.URGENT]: 'Urgent'
    };
    return labels[priority] || priority;
  }

  getPriorityColor(priority: TicketPriority): string {
    const colors: Record<TicketPriority, string> = {
      [TicketPriority.LOW]: '#6b7280',
      [TicketPriority.NORMAL]: '#3b82f6',
      [TicketPriority.HIGH]: '#f59e0b',
      [TicketPriority.URGENT]: '#ef4444'
    };
    return colors[priority] || '#6b7280';
  }
}

export const userTicketsService = new UserTicketsService();
export default userTicketsService;
