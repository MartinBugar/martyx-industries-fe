import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { Button, Badge, SkeletonTable, ConfirmDialog, useConfirmDialog } from '../../components/ui';
import { accountLockoutConfigService, type AccountLockoutConfigDto, type LockedUserDto } from '../../services/accountLockoutConfigService';
import { useErrors } from '../../context/ErrorContext';
import { Shield, Lock, Unlock, Save, Edit, X, RefreshCw, AlertTriangle, Info, User } from 'lucide-react';
import { logInfo, logError } from '../../services/logger';
import './AdminUsers.css';
import './AdminButtonOverrides.css';

const AdminAccountLockoutConfig: React.FC = () => {
    const { addError } = useErrors();
    const [config, setConfig] = useState<AccountLockoutConfigDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedValues, setEditedValues] = useState<Partial<AccountLockoutConfigDto>>({});
    const [saving, setSaving] = useState(false);

    const [lockedUsers, setLockedUsers] = useState<LockedUserDto[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [showOnlyLocked, setShowOnlyLocked] = useState(false);

    const { confirm, dialogProps } = useConfirmDialog({
        title: 'Unlock Account',
        message: 'Are you sure you want to unlock this account?',
        variant: 'info',
        confirmText: 'Unlock',
        cancelText: 'Cancel'
    });

    useEffect(() => {
        loadConfig();
        loadLockedUsers();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            logInfo('Loading account lockout configuration...');
            const data = await accountLockoutConfigService.getAdminConfig();
            setConfig(data);
            logInfo('Loaded account lockout configuration');
        } catch (error) {
            logError('Failed to load account lockout configuration:', error);
            addError({
                message: 'Failed to load account lockout configuration. Please try again.',
                severity: 'error',
                recoverable: true,
                action: loadConfig
            });
        } finally {
            setLoading(false);
        }
    };

    const loadLockedUsers = async () => {
        try {
            setLoadingUsers(true);
            const data = showOnlyLocked
                ? await accountLockoutConfigService.getLockedUsers()
                : await accountLockoutConfigService.getUsersWithFailedAttempts();
            setLockedUsers(data);
        } catch (error) {
            logError('Failed to load locked users:', error);
            addError({
                message: 'Failed to load locked users. Please try again.',
                severity: 'error',
                recoverable: true,
                action: loadLockedUsers
            });
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleEdit = () => {
        if (!config) return;
        setIsEditing(true);
        setEditedValues({
            maxFailedAttempts: config.maxFailedAttempts,
            lockoutDurationMinutes: config.lockoutDurationMinutes,
            attemptResetHours: config.attemptResetHours,
            lockoutEnabled: config.lockoutEnabled
        });
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedValues({});
    };

    const handleSave = async () => {
        if (!config) return;
        try {
            setSaving(true);
            const updateRequest = {
                maxFailedAttempts: editedValues.maxFailedAttempts ?? config.maxFailedAttempts,
                lockoutDurationMinutes: editedValues.lockoutDurationMinutes ?? config.lockoutDurationMinutes,
                attemptResetHours: editedValues.attemptResetHours ?? config.attemptResetHours,
                lockoutEnabled: editedValues.lockoutEnabled ?? config.lockoutEnabled
            };
            const updated = await accountLockoutConfigService.updateConfig(updateRequest);
            setConfig(updated);
            setIsEditing(false);
            setEditedValues({});
            addError({ message: 'Successfully updated account lockout configuration', severity: 'info', recoverable: false });
        } catch (error) {
            logError('Failed to update account lockout configuration:', error);
            addError({ message: 'Failed to update configuration. Please try again.', severity: 'error', recoverable: true, action: handleSave });
        } finally {
            setSaving(false);
        }
    };

    const handleValueChange = (field: keyof AccountLockoutConfigDto, value: number | boolean) => {
        setEditedValues(prev => ({ ...prev, [field]: value }));
    };

    const getEditedValue = (field: keyof AccountLockoutConfigDto, originalValue: number | boolean) => {
        return editedValues[field] ?? originalValue;
    };

    const handleUnlockUser = useCallback(async (userId: number, email: string) => {
        const confirmed = await confirm({ title: 'Unlock Account', message: `Are you sure you want to unlock account ${email}?` });
        if (!confirmed) return;
        try {
            await accountLockoutConfigService.unlockUser(userId);
            addError({ message: `Successfully unlocked account ${email}`, severity: 'info', recoverable: false });
            await loadLockedUsers();
        } catch (error) {
            logError(`Failed to unlock user ${email}:`, error);
            addError({ message: `Failed to unlock account ${email}. Please try again.`, severity: 'error', recoverable: true });
        }
    }, [confirm, addError]);

    const handleLockUser = async (userId: number, email: string) => {
        const durationInput = window.prompt(`How many minutes should ${email} be locked for?`, '30');
        if (!durationInput) return;
        const durationMinutes = parseInt(durationInput, 10);
        if (isNaN(durationMinutes) || durationMinutes <= 0) {
            addError({ message: 'Invalid duration. Please enter a positive number.', severity: 'error', recoverable: false });
            return;
        }
        try {
            await accountLockoutConfigService.lockUser(userId, durationMinutes);
            addError({ message: `Successfully locked account ${email} for ${durationMinutes} minutes`, severity: 'info', recoverable: false });
            await loadLockedUsers();
        } catch (error) {
            logError(`Failed to lock user ${email}:`, error);
            addError({ message: `Failed to lock account ${email}. Please try again.`, severity: 'error', recoverable: true });
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    const formatTimeRemaining = (lockedUntil?: string) => {
        if (!lockedUntil) return '';
        const until = new Date(lockedUntil);
        const now = new Date();
        const diffMs = until.getTime() - now.getTime();
        if (diffMs <= 0) return 'Expired';
        const minutes = Math.floor(diffMs / 60000);
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    };

    return (
        <AdminLayout title="Account Lockout">
            <div className="admin-page">
                <div className="admin-container">
                    {/* Header */}
                    <div className="admin-card" style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                                <h2 className="section-title" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Shield size={24} style={{ color: 'var(--admin-accent)' }} />
                                    Account Lockout Configuration
                                </h2>
                                <p style={{ margin: 0, color: 'var(--admin-secondary)', fontSize: '14px' }}>
                                    Configure security settings for login attempt limits and account lockouts.
                                </p>
                            </div>
                            {!isEditing && config && (
                                <Button variant="outline" onClick={handleEdit}>
                                    <Edit size={16} />
                                    Edit Settings
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Configuration Card */}
                    {loading ? (
                        <div className="admin-card">
                            <SkeletonTable rows={4} columns={2} />
                        </div>
                    ) : !config ? (
                        <div className="admin-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--admin-error)' }}>
                            Failed to load configuration. Please refresh the page.
                        </div>
                    ) : isEditing ? (
                        <div className="admin-card" style={{ marginBottom: '24px' }}>
                            <h3 className="section-title" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Lock size={20} style={{ color: 'var(--admin-accent)' }} />
                                Security Rules
                            </h3>
                            <div className="form-grid">
                                <div>
                                    <label className="form-label">Maximum Failed Attempts</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={getEditedValue('maxFailedAttempts', config.maxFailedAttempts) as number}
                                        onChange={(e) => handleValueChange('maxFailedAttempts', parseInt(e.target.value) || 1)}
                                        className="form-input"
                                    />
                                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--admin-secondary)' }}>Recommended: 3-5 attempts</p>
                                </div>
                                <div>
                                    <label className="form-label">Lockout Duration (minutes)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="1440"
                                        value={getEditedValue('lockoutDurationMinutes', config.lockoutDurationMinutes) as number}
                                        onChange={(e) => handleValueChange('lockoutDurationMinutes', parseInt(e.target.value) || 1)}
                                        className="form-input"
                                    />
                                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--admin-secondary)' }}>Recommended: 15-30 minutes</p>
                                </div>
                                <div>
                                    <label className="form-label">Attempt Reset Period (hours)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="24"
                                        value={getEditedValue('attemptResetHours', config.attemptResetHours) as number}
                                        onChange={(e) => handleValueChange('attemptResetHours', parseInt(e.target.value) || 1)}
                                        className="form-input"
                                    />
                                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--admin-secondary)' }}>Counter resets after this period of inactivity</p>
                                </div>
                                <div>
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={getEditedValue('lockoutEnabled', config.lockoutEnabled) as boolean}
                                            onChange={(e) => handleValueChange('lockoutEnabled', e.target.checked)}
                                            style={{ width: '20px', height: '20px' }}
                                        />
                                        <span style={{ fontWeight: 600, color: 'var(--admin-primary)' }}>System Enabled</span>
                                    </label>
                                    <p style={{ margin: '6px 0 0 32px', fontSize: '12px', color: 'var(--admin-secondary)' }}>Global on/off switch for lockout system</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--admin-border)' }}>
                                <Button variant="primary" onClick={handleSave} disabled={saving} loading={saving}>
                                    <Save size={16} />
                                    Save Changes
                                </Button>
                                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                                    <X size={16} />
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="admin-card" style={{ marginBottom: '24px' }}>
                            <h3 className="section-title" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Lock size={20} style={{ color: 'var(--admin-accent)' }} />
                                Current Configuration
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                <div style={{ padding: '16px', background: 'var(--admin-bg-secondary)', borderRadius: '10px', border: '1px solid var(--admin-border)' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--admin-secondary)', marginBottom: '6px' }}>Max Failed Attempts</div>
                                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--admin-accent)' }}>{config.maxFailedAttempts}</div>
                                </div>
                                <div style={{ padding: '16px', background: 'var(--admin-bg-secondary)', borderRadius: '10px', border: '1px solid var(--admin-border)' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--admin-secondary)', marginBottom: '6px' }}>Lockout Duration</div>
                                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--admin-accent)' }}>{config.lockoutDurationMinutes}<span style={{ fontSize: '14px', fontWeight: 400 }}> min</span></div>
                                </div>
                                <div style={{ padding: '16px', background: 'var(--admin-bg-secondary)', borderRadius: '10px', border: '1px solid var(--admin-border)' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--admin-secondary)', marginBottom: '6px' }}>Reset Period</div>
                                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--admin-accent)' }}>{config.attemptResetHours}<span style={{ fontSize: '14px', fontWeight: 400 }}> hr</span></div>
                                </div>
                                <div style={{ padding: '16px', background: 'var(--admin-bg-secondary)', borderRadius: '10px', border: '1px solid var(--admin-border)' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--admin-secondary)', marginBottom: '6px' }}>System Status</div>
                                    <Badge variant={config.lockoutEnabled ? 'success' : 'warning'} size="sm" style={{ fontSize: '14px', padding: '8px 16px' }}>
                                        {config.lockoutEnabled ? 'Enabled' : 'Disabled'}
                                    </Badge>
                                </div>
                            </div>
                            {config.updatedBy && (
                                <p style={{ margin: '20px 0 0', fontSize: '12px', color: 'var(--admin-secondary)' }}>
                                    Last updated by {config.updatedBy} on {config.updatedAt ? new Date(config.updatedAt).toLocaleString() : 'Unknown'}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Locked Users */}
                    <div className="admin-card" style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                            <h3 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <User size={20} style={{ color: 'var(--admin-accent)' }} />
                                Users with Failed Attempts
                            </h3>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--admin-secondary)', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={showOnlyLocked} onChange={(e) => { setShowOnlyLocked(e.target.checked); setTimeout(loadLockedUsers, 0); }} />
                                    Show only locked
                                </label>
                                <Button variant="outline" size="sm" onClick={loadLockedUsers} disabled={loadingUsers}>
                                    <RefreshCw size={14} className={loadingUsers ? 'spinning' : ''} />
                                    Refresh
                                </Button>
                            </div>
                        </div>

                        {loadingUsers ? (
                            <SkeletonTable rows={3} columns={5} />
                        ) : lockedUsers.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--admin-secondary)' }}>
                                <Shield size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                                <p style={{ margin: 0 }}>{showOnlyLocked ? 'No locked users found' : 'No users with failed login attempts'}</p>
                            </div>
                        ) : (
                            <div className="table-wrapper">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Status</th>
                                            <th>Email</th>
                                            <th>Failed</th>
                                            <th>Last Attempt</th>
                                            <th>Locked Until</th>
                                            <th style={{ width: 140 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lockedUsers.map((user) => (
                                            <tr key={user.userId}>
                                                <td>
                                                    <Badge variant={user.currentlyLocked ? 'danger' : 'warning'} size="sm">
                                                        {user.currentlyLocked ? <><Lock size={12} style={{ marginRight: 4 }} /> Locked</> : 'Warning'}
                                                    </Badge>
                                                </td>
                                                <td style={{ fontWeight: 500 }}>{user.email}</td>
                                                <td style={{ fontWeight: 600, color: 'var(--admin-accent)' }}>{user.failedLoginAttempts || 0}</td>
                                                <td style={{ fontSize: '13px' }}>
                                                    <div>{formatDate(user.lastFailedLogin)}</div>
                                                    {user.lastFailedLoginIp && <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--admin-secondary)' }}>{user.lastFailedLoginIp}</div>}
                                                </td>
                                                <td>
                                                    {user.currentlyLocked ? (
                                                        <div>
                                                            <div style={{ fontSize: '13px' }}>{formatDate(user.lockedUntil)}</div>
                                                            <div style={{ fontSize: '12px', color: 'var(--admin-error)', fontWeight: 600 }}>({formatTimeRemaining(user.lockedUntil)})</div>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: 'var(--admin-secondary)' }}>-</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        {user.currentlyLocked ? (
                                                            <Button variant="primary" size="sm" onClick={() => handleUnlockUser(user.userId, user.email)}>
                                                                <Unlock size={14} />
                                                                Unlock
                                                            </Button>
                                                        ) : (
                                                            <>
                                                                <Button variant="danger" size="sm" onClick={() => handleLockUser(user.userId, user.email)}>
                                                                    <Lock size={14} />
                                                                </Button>
                                                                <Button variant="outline" size="sm" onClick={() => handleUnlockUser(user.userId, user.email)}>
                                                                    Reset
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="admin-card" style={{ background: 'var(--admin-info-bg)', borderColor: 'var(--admin-info)' }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Info size={18} style={{ color: 'var(--admin-info)' }} />
                            How Account Lockout Works
                        </h3>
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: 1.8 }}>
                            {config && (
                                <>
                                    <li><strong>Failed Attempts:</strong> User fails login {config.maxFailedAttempts} times → account locked for {config.lockoutDurationMinutes} minutes</li>
                                    <li><strong>Auto-Unlock:</strong> After {config.lockoutDurationMinutes} minutes, lockout expires automatically</li>
                                    <li><strong>Counter Reset:</strong> If user waits {config.attemptResetHours} hour(s) → counter resets to 0</li>
                                </>
                            )}
                            <li><strong>Security:</strong> Generic error messages prevent account enumeration attacks</li>
                        </ul>
                    </div>

                    {/* Warning */}
                    <div className="admin-card" style={{ background: 'var(--admin-warning-bg)', borderColor: 'var(--admin-warning)', marginTop: '20px' }}>
                        <p style={{ margin: 0, fontSize: '14px', color: '#92400E', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span><strong>Important:</strong> Changes take effect immediately. Existing locked accounts will use the old lockout duration until their lock expires.</span>
                        </p>
                    </div>
                </div>
            </div>

            <ConfirmDialog {...dialogProps} />
        </AdminLayout>
    );
};

export default AdminAccountLockoutConfig;
