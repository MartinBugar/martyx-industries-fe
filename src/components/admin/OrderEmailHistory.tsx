import React, { useState, useEffect } from 'react';
import { Mail, Send, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { adminOrderEmailService, type OrderEmailDTO } from '../../services/adminOrderEmailService';
import { Button, Badge } from '../ui';
import './OrderEmailHistory.css';

interface OrderEmailHistoryProps {
    orderId: number;
}

const OrderEmailHistory: React.FC<OrderEmailHistoryProps> = ({ orderId }) => {
    const [emails, setEmails] = useState<OrderEmailDTO[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showResendModal, setShowResendModal] = useState<boolean>(false);
    const [bccEmail, setBccEmail] = useState<string>('');
    const [enableBcc, setEnableBcc] = useState<boolean>(false);
    const [resending, setResending] = useState<boolean>(false);
    const [resendSuccess, setResendSuccess] = useState<string | null>(null);

    useEffect(() => {
        loadEmailHistory();
    }, [orderId]);

    const loadEmailHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const emailHistory = await adminOrderEmailService.getEmailHistory(orderId);
            setEmails(emailHistory);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load email history';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendEmail = async () => {
        setResending(true);
        setError(null);
        setResendSuccess(null);

        try {
            const bcc = enableBcc && bccEmail.trim() ? bccEmail.trim() : undefined;
            const result = await adminOrderEmailService.resendOrderConfirmationEmail(orderId, bcc);
            setResendSuccess(result.message || 'Email resent successfully');
            setShowResendModal(false);
            setBccEmail('');
            setEnableBcc(false);

            // Reload email history to show the new email
            await loadEmailHistory();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to resend email';
            setError(message);
        } finally {
            setResending(false);
        }
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleString();
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'SENT':
                return <CheckCircle size={16} className="status-icon success" />;
            case 'FAILED':
                return <AlertCircle size={16} className="status-icon error" />;
            case 'PENDING':
                return <Clock size={16} className="status-icon pending" />;
            default:
                return null;
        }
    };

    const getStatusBadgeVariant = (status: string): 'success' | 'danger' | 'warning' => {
        switch (status) {
            case 'SENT':
                return 'success';
            case 'FAILED':
                return 'danger';
            default:
                return 'warning';
        }
    };

    return (
        <div className="order-email-history">
            <div className="email-history-header">
                <div className="header-title">
                    <Mail size={20} />
                    <h3>Email History</h3>
                    <Badge variant="secondary" size="sm">{emails.length}</Badge>
                </div>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowResendModal(true)}
                    disabled={loading}
                >
                    <Send size={16} />
                    Resend Email
                </Button>
            </div>

            {resendSuccess && (
                <div className="alert alert-success">
                    <CheckCircle size={16} />
                    {resendSuccess}
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {loading ? (
                <div className="email-loading">Loading email history...</div>
            ) : emails.length === 0 ? (
                <div className="email-empty">
                    <Mail size={48} className="empty-icon" />
                    <p>No emails sent yet for this order</p>
                </div>
            ) : (
                <div className="email-list">
                    {emails.map((email) => (
                        <div key={email.id} className="email-item">
                            <div className="email-item-header">
                                <div className="email-type">
                                    {getStatusIcon(email.emailStatus)}
                                    <span className="type-label">{email.emailType.replace(/_/g, ' ')}</span>
                                </div>
                                <Badge variant={getStatusBadgeVariant(email.emailStatus)} size="sm">
                                    {email.emailStatus}
                                </Badge>
                            </div>

                            <div className="email-item-body">
                                <div className="email-detail">
                                    <span className="detail-label">To:</span>
                                    <span className="detail-value">{email.recipientEmail}</span>
                                </div>

                                {email.bccEmail && (
                                    <div className="email-detail">
                                        <span className="detail-label">BCC:</span>
                                        <span className="detail-value">{email.bccEmail}</span>
                                    </div>
                                )}

                                {email.subject && (
                                    <div className="email-detail">
                                        <span className="detail-label">Subject:</span>
                                        <span className="detail-value">{email.subject}</span>
                                    </div>
                                )}

                                <div className="email-detail">
                                    <span className="detail-label">Sent:</span>
                                    <span className="detail-value">{formatDate(email.sentAt)}</span>
                                </div>

                                <div className="email-detail">
                                    <span className="detail-label">Sent by:</span>
                                    <span className="detail-value">
                                        {email.sentBy === 'SYSTEM' ? 'System (Automatic)' :
                                         email.sentBy === 'ADMIN_RESEND' && email.sentByAdminEmail ?
                                         `Admin (${email.sentByAdminEmail})` : email.sentBy}
                                    </span>
                                </div>

                                {email.errorMessage && (
                                    <div className="email-detail error-detail">
                                        <span className="detail-label">Error:</span>
                                        <span className="detail-value error-message">{email.errorMessage}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Resend Email Modal */}
            {showResendModal && (
                <div className="modal-overlay" onClick={() => setShowResendModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Resend Order Confirmation Email</h3>
                            <button
                                className="modal-close"
                                onClick={() => setShowResendModal(false)}
                                disabled={resending}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            <p className="modal-description">
                                This will resend the order confirmation email with invoice and download links to the customer.
                            </p>

                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={enableBcc}
                                        onChange={(e) => setEnableBcc(e.target.checked)}
                                        disabled={resending}
                                    />
                                    <span>Send BCC copy for verification</span>
                                </label>
                                <p className="form-help-text">
                                    Send a copy to your email to verify what the customer receives
                                </p>
                            </div>

                            {enableBcc && (
                                <div className="form-group">
                                    <label className="form-label">BCC Email Address</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="your-email@example.com"
                                        value={bccEmail}
                                        onChange={(e) => setBccEmail(e.target.value)}
                                        disabled={resending}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <Button
                                variant="outline"
                                onClick={() => setShowResendModal(false)}
                                disabled={resending}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleResendEmail}
                                disabled={resending || (enableBcc && !bccEmail.trim())}
                            >
                                {resending ? 'Sending...' : 'Resend Email'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderEmailHistory;
