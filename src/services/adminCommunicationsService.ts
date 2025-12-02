import api from './api';

// Types
export type CommunicationType =
  | 'ORDER_CONFIRMATION'
  | 'SHIPPING_NOTIFICATION'
  | 'DELIVERY_CONFIRMATION'
  | 'MARKETING_EMAIL'
  | 'PROMOTIONAL_EMAIL'
  | 'ABANDONED_CART_EMAIL'
  | 'SUPPORT_TICKET'
  | 'TICKET_REPLY'
  | 'ADMIN_NOTE'
  | 'PHONE_CALL'
  | 'REFUND_NOTIFICATION'
  | 'PASSWORD_RESET'
  | 'ACCOUNT_VERIFICATION'
  | 'WELCOME_EMAIL'
  | 'REVIEW_REQUEST'
  | 'INVOICE_EMAIL'
  | 'CUSTOM';

export type CommunicationDirection = 'OUTBOUND' | 'INBOUND';

export interface CustomerCommunicationDto {
  id: number;
  userId: number | null;
  guestEmail: string | null;
  communicationType: CommunicationType;
  direction: CommunicationDirection;
  subject: string;
  content: string | null;
  summary: string | null;

  // Email fields
  emailSentAt: string | null;
  emailOpenedAt: string | null;
  emailClickedAt: string | null;
  emailBounced: boolean;
  emailTemplate: string | null;

  // Call fields
  callDurationSeconds: number | null;
  callOutcome: string | null;

  // Related entities
  relatedOrderId: number | null;
  relatedTicketId: number | null;

  // Creator info
  createdById: number | null;
  createdByName: string | null;

  createdAt: string;
  updatedAt: string | null;

  // Convenience fields
  typeLabel: string;
  typeIcon: string;
  directionLabel: string;
}

export interface CommunicationStatsDto {
  totalCommunications: number;
  outboundCount: number;
  inboundCount: number;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsBounced: number;
  openRate: number;
  clickRate: number;
  countByType: Record<string, number>;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// API functions
export const getCustomerTimeline = async (
  userId: number,
  page: number = 0,
  size: number = 20
): Promise<Page<CustomerCommunicationDto>> => {
  const response = await api.get(`/api/admin/communications/user/${userId}`, {
    params: { page, size }
  });
  return response.data;
};

export const getFilteredTimeline = async (
  userId: number,
  filters: {
    type?: CommunicationType;
    direction?: CommunicationDirection;
    startDate?: string;
    endDate?: string;
  },
  page: number = 0,
  size: number = 20
): Promise<Page<CustomerCommunicationDto>> => {
  const response = await api.get(`/api/admin/communications/user/${userId}/filter`, {
    params: { ...filters, page, size }
  });
  return response.data;
};

export const searchCommunications = async (
  userId: number,
  query: string,
  page: number = 0,
  size: number = 20
): Promise<Page<CustomerCommunicationDto>> => {
  const response = await api.get(`/api/admin/communications/user/${userId}/search`, {
    params: { query, page, size }
  });
  return response.data;
};

export const getByOrderId = async (orderId: number): Promise<CustomerCommunicationDto[]> => {
  const response = await api.get(`/api/admin/communications/order/${orderId}`);
  return response.data;
};

export const getByTicketId = async (ticketId: number): Promise<CustomerCommunicationDto[]> => {
  const response = await api.get(`/api/admin/communications/ticket/${ticketId}`);
  return response.data;
};

export const getGuestTimeline = async (
  email: string,
  page: number = 0,
  size: number = 20
): Promise<Page<CustomerCommunicationDto>> => {
  const response = await api.get(`/api/admin/communications/guest`, {
    params: { email, page, size }
  });
  return response.data;
};

export const getCommunicationById = async (id: number): Promise<CustomerCommunicationDto> => {
  const response = await api.get(`/api/admin/communications/${id}`);
  return response.data;
};

export const addAdminNote = async (
  userId: number,
  data: { subject: string; content: string }
): Promise<CustomerCommunicationDto> => {
  const response = await api.post(`/api/admin/communications/user/${userId}/note`, data);
  return response.data;
};

export const logPhoneCall = async (
  userId: number,
  data: {
    subject: string;
    notes: string;
    durationSeconds?: number;
    outcome?: string;
  }
): Promise<CustomerCommunicationDto> => {
  const response = await api.post(`/api/admin/communications/user/${userId}/call`, data);
  return response.data;
};

export const logCustomCommunication = async (
  userId: number,
  data: {
    type: CommunicationType;
    direction: CommunicationDirection;
    subject: string;
    content?: string;
    relatedOrderId?: number;
    relatedTicketId?: number;
  }
): Promise<CustomerCommunicationDto> => {
  const response = await api.post(`/api/admin/communications/user/${userId}/custom`, data);
  return response.data;
};

export const getCustomerStats = async (userId: number): Promise<CommunicationStatsDto> => {
  const response = await api.get(`/api/admin/communications/user/${userId}/stats`);
  return response.data;
};

export const getRecentCommunications = async (
  userId: number,
  limit: number = 5
): Promise<CustomerCommunicationDto[]> => {
  const response = await api.get(`/api/admin/communications/user/${userId}/recent`, {
    params: { limit }
  });
  return response.data;
};

export const updateNote = async (
  id: number,
  data: { subject: string; content: string }
): Promise<CustomerCommunicationDto> => {
  const response = await api.put(`/api/admin/communications/${id}`, data);
  return response.data;
};

export const deleteNote = async (id: number): Promise<void> => {
  await api.delete(`/api/admin/communications/${id}`);
};

// Helper functions
export const getTypeLabel = (type: CommunicationType): string => {
  const labels: Record<CommunicationType, string> = {
    ORDER_CONFIRMATION: 'Potvrdenie objednávky',
    SHIPPING_NOTIFICATION: 'Notifikácia o odoslaní',
    DELIVERY_CONFIRMATION: 'Potvrdenie doručenia',
    MARKETING_EMAIL: 'Marketingový email',
    PROMOTIONAL_EMAIL: 'Promo email',
    ABANDONED_CART_EMAIL: 'Opustený košík',
    SUPPORT_TICKET: 'Support tiket',
    TICKET_REPLY: 'Odpoveď na tiket',
    ADMIN_NOTE: 'Poznámka admina',
    PHONE_CALL: 'Telefónny hovor',
    REFUND_NOTIFICATION: 'Notifikácia o refunde',
    PASSWORD_RESET: 'Reset hesla',
    ACCOUNT_VERIFICATION: 'Overenie účtu',
    WELCOME_EMAIL: 'Uvítací email',
    REVIEW_REQUEST: 'Žiadosť o recenziu',
    INVOICE_EMAIL: 'Faktúra',
    CUSTOM: 'Vlastná správa'
  };
  return labels[type] || type;
};

export const getTypeIcon = (type: CommunicationType): string => {
  const icons: Record<CommunicationType, string> = {
    ORDER_CONFIRMATION: 'shopping-cart',
    SHIPPING_NOTIFICATION: 'truck',
    DELIVERY_CONFIRMATION: 'package',
    MARKETING_EMAIL: 'megaphone',
    PROMOTIONAL_EMAIL: 'tag',
    ABANDONED_CART_EMAIL: 'shopping-cart',
    SUPPORT_TICKET: 'help-circle',
    TICKET_REPLY: 'message-circle',
    ADMIN_NOTE: 'file-text',
    PHONE_CALL: 'phone',
    REFUND_NOTIFICATION: 'credit-card',
    PASSWORD_RESET: 'key',
    ACCOUNT_VERIFICATION: 'check-circle',
    WELCOME_EMAIL: 'user-plus',
    REVIEW_REQUEST: 'star',
    INVOICE_EMAIL: 'file-text',
    CUSTOM: 'mail'
  };
  return icons[type] || 'mail';
};

export const getTypeColor = (type: CommunicationType): string => {
  const colors: Record<CommunicationType, string> = {
    ORDER_CONFIRMATION: '#10b981',
    SHIPPING_NOTIFICATION: '#3b82f6',
    DELIVERY_CONFIRMATION: '#22c55e',
    MARKETING_EMAIL: '#8b5cf6',
    PROMOTIONAL_EMAIL: '#f59e0b',
    ABANDONED_CART_EMAIL: '#ef4444',
    SUPPORT_TICKET: '#6366f1',
    TICKET_REPLY: '#8b5cf6',
    ADMIN_NOTE: '#64748b',
    PHONE_CALL: '#14b8a6',
    REFUND_NOTIFICATION: '#f97316',
    PASSWORD_RESET: '#64748b',
    ACCOUNT_VERIFICATION: '#22c55e',
    WELCOME_EMAIL: '#10b981',
    REVIEW_REQUEST: '#eab308',
    INVOICE_EMAIL: '#3b82f6',
    CUSTOM: '#94a3b8'
  };
  return colors[type] || '#94a3b8';
};

export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Práve teraz';
  if (diffMins < 60) return `Pred ${diffMins} min`;
  if (diffHours < 24) return `Pred ${diffHours} hod`;
  if (diffDays < 7) return `Pred ${diffDays} dňami`;

  return date.toLocaleDateString('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
};
