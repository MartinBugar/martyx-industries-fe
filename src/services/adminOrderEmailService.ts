import apiClient from './apiClient';

export interface OrderEmailDTO {
    id: number;
    orderId: number;
    emailType: string;
    recipientEmail: string;
    bccEmail?: string;
    subject?: string;
    sentAt: string;
    sentBy: string;
    sentByAdminId?: number;
    sentByAdminEmail?: string;
    emailStatus: string;
    errorMessage?: string;
}

export interface ResendEmailRequest {
    bccEmail?: string;
}

class AdminOrderEmailService {
    /**
     * Get email history for a specific order.
     */
    async getEmailHistory(orderId: number): Promise<OrderEmailDTO[]> {
        const response = await apiClient.get<OrderEmailDTO[]>(`/api/admin/orders/${orderId}/emails`);
        return response.data;
    }

    /**
     * Resend order confirmation email with optional BCC.
     */
    async resendOrderConfirmationEmail(orderId: number, bccEmail?: string): Promise<{ message: string }> {
        const request: ResendEmailRequest = bccEmail ? { bccEmail } : {};
        const response = await apiClient.post<{ message: string }>(
            `/api/admin/orders/${orderId}/resend-email`,
            request
        );
        return response.data;
    }

    /**
     * Get count of emails sent for an order.
     */
    async getEmailCount(orderId: number): Promise<number> {
        const response = await apiClient.get<{ count: number }>(`/api/admin/orders/${orderId}/emails/count`);
        return response.data.count;
    }
}

export const adminOrderEmailService = new AdminOrderEmailService();
