/**
 * Admin Tickets Service
 * Handles API communication for customer support ticketing system
 */

import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';

// === Enums ===

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'WAITING_INTERNAL' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type TicketSource = 'WEB' | 'EMAIL' | 'PHONE' | 'CHAT' | 'ADMIN';

// === DTOs ===

export interface TicketDto {
  id: number;
  ticketNumber: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  source: TicketSource;
  // Customer info
  userId: number | null;
  customerEmail: string | null;
  customerName: string | null;
  // Category & Assignment
  categoryId: number | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  assignedToId: number | null;
  assignedToName: string | null;
  assignedToEmail: string | null;
  // Order reference
  relatedOrderId: number | null;
  relatedOrderNumber: string | null;
  // Timestamps
  createdAt: string;
  updatedAt: string;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  // Stats
  messageCount: number;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  responseTimeMinutes: number | null;
  resolutionTimeMinutes: number | null;
  // Satisfaction
  satisfactionRating: number | null;
  satisfactionFeedback: string | null;
}

export interface TicketMessageDto {
  id: number;
  ticketId: number;
  senderId: number | null;
  senderName: string | null;
  senderEmail: string | null;
  isStaffReply: boolean;
  content: string;
  internal: boolean;
  messageType: 'INITIAL' | 'REPLY' | 'INTERNAL_NOTE' | 'SYSTEM' | 'RESOLUTION';
  attachments: string[];
  createdAt: string;
}

export interface TicketDetailDto {
  ticket: TicketDto;
  messages: TicketMessageDto[];
  category: TicketCategoryDto | null;
  slaResponseHours: number | null;
  slaResolutionHours: number | null;
  slaResponseBreached: boolean;
  slaResolutionBreached: boolean;
}

export interface TicketCategoryDto {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  displayOrder: number;
  active: boolean;
  defaultPriority: string | null;
  slaResponseHours: number | null;
  slaResolutionHours: number | null;
  ticketCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CannedResponseDto {
  id: number;
  title: string;
  content: string;
  shortcut: string | null;
  categoryId: number | null;
  categoryName: string | null;
  language: string | null;
  displayOrder: number;
  active: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TicketStatsDto {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  unassignedTickets: number;
  // SLA
  slaBreachedCount: number;
  slaAtRiskCount: number;
  // Performance
  averageResponseTimeHours: number | null;
  averageResolutionTimeHours: number | null;
  // Today
  ticketsCreatedToday: number;
  ticketsResolvedToday: number;
  // Satisfaction
  averageSatisfactionRating: number | null;
  // By priority
  urgentCount: number;
  highCount: number;
  normalCount: number;
  lowCount: number;
}

// === Request DTOs ===

export interface CreateTicketRequest {
  subject: string;
  description?: string;
  priority?: TicketPriority;
  source?: TicketSource;
  categoryId?: number;
  orderId?: number;
  userId?: number;
  guestEmail?: string;
  guestName?: string;
}

export interface UpdateTicketRequest {
  subject?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  categoryId?: number;
  assignToId?: number;
  orderId?: number;
  satisfactionRating?: number;
  satisfactionFeedback?: string;
}

export interface AddTicketMessageRequest {
  content: string;
  internal?: boolean;
  attachments?: string[];
  sendEmail?: boolean;
  cannedResponseId?: number;
}

export interface TicketCategoryRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  displayOrder?: number;
  active?: boolean;
  defaultPriority?: string;
  slaResponseHours?: number;
  slaResolutionHours?: number;
}

// === Paginated Response ===

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// === API Functions ===

const BASE_URL = `${API_BASE_URL}/api/admin/tickets`;

// Ticket CRUD

export async function getTickets(
  params: {
    status?: TicketStatus;
    priority?: TicketPriority;
    categoryId?: number;
    assignedToId?: number;
    unassigned?: boolean;
    page?: number;
    size?: number;
    sort?: string;
  } = {}
): Promise<Page<TicketDto>> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.append('status', params.status);
  if (params.priority) searchParams.append('priority', params.priority);
  if (params.categoryId) searchParams.append('categoryId', params.categoryId.toString());
  if (params.assignedToId) searchParams.append('assignedToId', params.assignedToId.toString());
  if (params.unassigned !== undefined) searchParams.append('unassigned', params.unassigned.toString());
  searchParams.append('page', (params.page || 0).toString());
  searchParams.append('size', (params.size || 20).toString());
  if (params.sort) searchParams.append('sort', params.sort);

  const response = await fetch(`${BASE_URL}?${searchParams}`, {
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

export async function searchTickets(query: string, page = 0, size = 20): Promise<Page<TicketDto>> {
  const searchParams = new URLSearchParams({ q: query, page: page.toString(), size: size.toString() });
  const response = await fetch(`${BASE_URL}/search?${searchParams}`, {
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

export async function getTicketById(id: number): Promise<TicketDto> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

export async function getTicketDetail(id: number): Promise<TicketDetailDto> {
  const response = await fetch(`${BASE_URL}/${id}/detail`, {
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

export async function getTicketByNumber(ticketNumber: string): Promise<TicketDto> {
  const response = await fetch(`${BASE_URL}/number/${ticketNumber}`, {
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

export async function createTicket(request: CreateTicketRequest): Promise<TicketDto> {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: withLangHeaders(defaultHeaders()),
    body: JSON.stringify(request),
  });
  return handleResponse(response);
}

export async function updateTicket(id: number, request: UpdateTicketRequest): Promise<TicketDto> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: withLangHeaders(defaultHeaders()),
    body: JSON.stringify(request),
  });
  return handleResponse(response);
}

export async function deleteTicket(id: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: withLangHeaders(defaultHeaders()),
  });
  if (!response.ok) {
    throw new Error('Failed to delete ticket');
  }
}

// Ticket queries

export async function getTicketsByUser(userId: number, page = 0, size = 20): Promise<Page<TicketDto>> {
  const searchParams = new URLSearchParams({ page: page.toString(), size: size.toString() });
  const response = await fetch(`${BASE_URL}/user/${userId}?${searchParams}`, {
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

export async function getTicketsByGuestEmail(email: string, page = 0, size = 20): Promise<Page<TicketDto>> {
  const searchParams = new URLSearchParams({ email, page: page.toString(), size: size.toString() });
  const response = await fetch(`${BASE_URL}/guest?${searchParams}`, {
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

export async function getMyTickets(page = 0, size = 20): Promise<Page<TicketDto>> {
  const searchParams = new URLSearchParams({ page: page.toString(), size: size.toString() });
  const response = await fetch(`${BASE_URL}/my-tickets?${searchParams}`, {
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

export async function getTicketsByOrder(orderId: number): Promise<TicketDto[]> {
  const response = await fetch(`${BASE_URL}/order/${orderId}`, {
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

// Ticket actions

export async function assignTicket(ticketId: number, staffId: number): Promise<TicketDto> {
  const response = await fetch(`${BASE_URL}/${ticketId}/assign?staffId=${staffId}`, {
    method: 'POST',
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

export async function assignTicketToMe(ticketId: number): Promise<TicketDto> {
  const response = await fetch(`${BASE_URL}/${ticketId}/assign-to-me`, {
    method: 'POST',
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

export async function unassignTicket(ticketId: number): Promise<TicketDto> {
  const response = await fetch(`${BASE_URL}/${ticketId}/unassign`, {
    method: 'POST',
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

export async function changeTicketStatus(ticketId: number, status: TicketStatus): Promise<TicketDto> {
  const response = await fetch(`${BASE_URL}/${ticketId}/status?status=${status}`, {
    method: 'POST',
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

export async function changeTicketPriority(ticketId: number, priority: TicketPriority): Promise<TicketDto> {
  const response = await fetch(`${BASE_URL}/${ticketId}/priority?priority=${priority}`, {
    method: 'POST',
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

export async function resolveTicket(ticketId: number, resolutionMessage: string): Promise<TicketDto> {
  const response = await fetch(`${BASE_URL}/${ticketId}/resolve`, {
    method: 'POST',
    headers: withLangHeaders(defaultHeaders()),
    body: JSON.stringify({ resolutionMessage }),
  });
  return handleResponse(response);
}

export async function closeTicket(ticketId: number): Promise<TicketDto> {
  const response = await fetch(`${BASE_URL}/${ticketId}/close`, {
    method: 'POST',
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

export async function reopenTicket(ticketId: number): Promise<TicketDto> {
  const response = await fetch(`${BASE_URL}/${ticketId}/reopen`, {
    method: 'POST',
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

// Messages

export async function getTicketMessages(ticketId: number): Promise<TicketMessageDto[]> {
  const response = await fetch(`${BASE_URL}/${ticketId}/messages`, {
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

export async function addMessage(ticketId: number, request: AddTicketMessageRequest): Promise<TicketMessageDto> {
  const response = await fetch(`${BASE_URL}/${ticketId}/messages`, {
    method: 'POST',
    headers: withLangHeaders(defaultHeaders()),
    body: JSON.stringify(request),
  });
  return handleResponse(response);
}

export async function addInternalNote(ticketId: number, content: string): Promise<TicketMessageDto> {
  const response = await fetch(`${BASE_URL}/${ticketId}/internal-note`, {
    method: 'POST',
    headers: withLangHeaders(defaultHeaders()),
    body: JSON.stringify({ content }),
  });
  return handleResponse(response);
}

// Bulk operations

export async function bulkUpdateStatus(ticketIds: number[], status: TicketStatus): Promise<{ updated: number }> {
  const response = await fetch(`${BASE_URL}/bulk/status`, {
    method: 'POST',
    headers: withLangHeaders(defaultHeaders()),
    body: JSON.stringify({ ticketIds, status }),
  });
  return handleResponse(response);
}

export async function bulkAssign(ticketIds: number[], staffId: number): Promise<{ updated: number }> {
  const response = await fetch(`${BASE_URL}/bulk/assign`, {
    method: 'POST',
    headers: withLangHeaders(defaultHeaders()),
    body: JSON.stringify({ ticketIds, staffId }),
  });
  return handleResponse(response);
}

// Categories

export async function getAllCategories(): Promise<TicketCategoryDto[]> {
  const response = await fetch(`${BASE_URL}/categories`, {
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

export async function getActiveCategories(): Promise<TicketCategoryDto[]> {
  const response = await fetch(`${BASE_URL}/categories/active`, {
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

export async function getCategoryById(id: number): Promise<TicketCategoryDto> {
  const response = await fetch(`${BASE_URL}/categories/${id}`, {
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

export async function createCategory(request: TicketCategoryRequest): Promise<TicketCategoryDto> {
  const response = await fetch(`${BASE_URL}/categories`, {
    method: 'POST',
    headers: withLangHeaders(defaultHeaders()),
    body: JSON.stringify(request),
  });
  return handleResponse(response);
}

export async function updateCategory(id: number, request: TicketCategoryRequest): Promise<TicketCategoryDto> {
  const response = await fetch(`${BASE_URL}/categories/${id}`, {
    method: 'PUT',
    headers: withLangHeaders(defaultHeaders()),
    body: JSON.stringify(request),
  });
  return handleResponse(response);
}

export async function deleteCategory(id: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: withLangHeaders(defaultHeaders()),
  });
  if (!response.ok) {
    throw new Error('Failed to delete category');
  }
}

// Canned Responses

export async function getAllCannedResponses(): Promise<CannedResponseDto[]> {
  const response = await fetch(`${BASE_URL}/canned-responses`, {
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

export async function getCannedResponsesByCategory(categoryId: number): Promise<CannedResponseDto[]> {
  const response = await fetch(`${BASE_URL}/canned-responses/category/${categoryId}`, {
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

export async function searchCannedResponses(query: string): Promise<CannedResponseDto[]> {
  const searchParams = new URLSearchParams({ q: query });
  const response = await fetch(`${BASE_URL}/canned-responses/search?${searchParams}`, {
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

export async function getCannedResponseByShortcut(shortcut: string): Promise<CannedResponseDto> {
  const response = await fetch(`${BASE_URL}/canned-responses/shortcut/${shortcut}`, {
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

export async function createCannedResponse(request: CannedResponseDto): Promise<CannedResponseDto> {
  const response = await fetch(`${BASE_URL}/canned-responses`, {
    method: 'POST',
    headers: withLangHeaders(defaultHeaders()),
    body: JSON.stringify(request),
  });
  return handleResponse(response);
}

export async function updateCannedResponse(id: number, request: CannedResponseDto): Promise<CannedResponseDto> {
  const response = await fetch(`${BASE_URL}/canned-responses/${id}`, {
    method: 'PUT',
    headers: withLangHeaders(defaultHeaders()),
    body: JSON.stringify(request),
  });
  return handleResponse(response);
}

export async function deleteCannedResponse(id: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/canned-responses/${id}`, {
    method: 'DELETE',
    headers: withLangHeaders(defaultHeaders()),
  });
  if (!response.ok) {
    throw new Error('Failed to delete canned response');
  }
}

// Statistics

export async function getTicketStats(): Promise<TicketStatsDto> {
  const response = await fetch(`${BASE_URL}/stats`, {
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

export async function getAvailableStatuses(): Promise<string[]> {
  const response = await fetch(`${BASE_URL}/statuses`, {
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

export async function getAvailablePriorities(): Promise<string[]> {
  const response = await fetch(`${BASE_URL}/priorities`, {
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

export async function getAvailableSources(): Promise<string[]> {
  const response = await fetch(`${BASE_URL}/sources`, {
    headers: withLangHeaders(defaultHeaders()),
  });
  return handleResponse(response);
}

// === Helper Functions ===

export function getStatusLabel(status: TicketStatus): string {
  const labels: Record<TicketStatus, string> = {
    OPEN: 'Otvorený',
    IN_PROGRESS: 'V riešení',
    WAITING_CUSTOMER: 'Čaká na zákazníka',
    WAITING_INTERNAL: 'Čaká interne',
    RESOLVED: 'Vyriešený',
    CLOSED: 'Uzavretý',
  };
  return labels[status] || status;
}

export function getStatusColor(status: TicketStatus): string {
  const colors: Record<TicketStatus, string> = {
    OPEN: '#3B82F6',
    IN_PROGRESS: '#F59E0B',
    WAITING_CUSTOMER: '#8B5CF6',
    WAITING_INTERNAL: '#6B7280',
    RESOLVED: '#10B981',
    CLOSED: '#6B7280',
  };
  return colors[status] || '#6B7280';
}

export function getPriorityLabel(priority: TicketPriority): string {
  const labels: Record<TicketPriority, string> = {
    LOW: 'Nízka',
    NORMAL: 'Normálna',
    HIGH: 'Vysoká',
    URGENT: 'Urgentná',
  };
  return labels[priority] || priority;
}

export function getPriorityColor(priority: TicketPriority): string {
  const colors: Record<TicketPriority, string> = {
    LOW: '#6B7280',
    NORMAL: '#3B82F6',
    HIGH: '#F59E0B',
    URGENT: '#EF4444',
  };
  return colors[priority] || '#6B7280';
}

export function getSourceLabel(source: TicketSource): string {
  const labels: Record<TicketSource, string> = {
    WEB: 'Web',
    EMAIL: 'Email',
    PHONE: 'Telefón',
    CHAT: 'Chat',
    ADMIN: 'Admin',
  };
  return labels[source] || source;
}

export function formatTimeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Práve teraz';
  if (diffMins < 60) return `Pred ${diffMins} min`;
  if (diffHours < 24) return `Pred ${diffHours} hod`;
  if (diffDays < 7) return `Pred ${diffDays} dňami`;
  return then.toLocaleDateString('sk-SK');
}
