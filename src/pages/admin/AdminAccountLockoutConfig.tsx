import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { Button, ConfirmDialog, useConfirmDialog } from '../../components/ui';
import { accountLockoutConfigService, type AccountLockoutConfigDto, type LockedUserDto } from '../../services/accountLockoutConfigService';
import { useErrors } from '../../context/ErrorContext';
import './AdminCreditUsageConfig.css'; // Reuse existing CSS
import { logInfo, logError } from '../../services/logger';

const AdminAccountLockoutConfig: React.FC = () => {
    const { addError } = useErrors();
    const [config, setConfig] = useState<AccountLockoutConfigDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedValues, setEditedValues] = useState<Partial<AccountLockoutConfigDto>>({});
    const [saving, setSaving] = useState(false);

    // Locked users state
    const [lockedUsers, setLockedUsers] = useState<LockedUserDto[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [showOnlyLocked, setShowOnlyLocked] = useState(false);

    // Confirm dialog
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
            logInfo('🔄 Loading account lockout configuration...');
            const data = await accountLockoutConfigService.getAdminConfig();
            setConfig(data);
            logInfo('✅ Loaded account lockout configuration');
        } catch (error) {
            logError('❌ Failed to load account lockout configuration:', error);
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
            logInfo('🔄 Loading locked users...');
            const data = showOnlyLocked
                ? await accountLockoutConfigService.getLockedUsers()
                : await accountLockoutConfigService.getUsersWithFailedAttempts();
            setLockedUsers(data);
            logInfo(`✅ Loaded ${data.length} users`);
        } catch (error) {
            logError('❌ Failed to load locked users:', error);
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
            logInfo('💾 Updating account lockout configuration...');

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

            logInfo('✅ Account lockout configuration updated');
            addError({
                message: 'Successfully updated account lockout configuration',
                severity: 'info',
                recoverable: false
            });
        } catch (error) {
            logError('❌ Failed to update account lockout configuration:', error);
            addError({
                message: 'Failed to update configuration. Please try again.',
                severity: 'error',
                recoverable: true,
                action: handleSave
            });
        } finally {
            setSaving(false);
        }
    };

    const handleValueChange = (field: keyof AccountLockoutConfigDto, value: number | boolean) => {
        setEditedValues(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const getEditedValue = (field: keyof AccountLockoutConfigDto, originalValue: number | boolean) => {
        return editedValues[field] ?? originalValue;
    };

    const handleUnlockUser = useCallback(async (userId: number, email: string) => {
        const confirmed = await confirm({
            title: 'Unlock Account',
            message: `Are you sure you want to unlock account ${email}?`,
            variant: 'info',
            confirmText: 'Unlock',
            cancelText: 'Cancel'
        });
        if (!confirmed) return;

        try {
            logInfo(`🔓 Unlocking user ${email}...`);
            await accountLockoutConfigService.unlockUser(userId);
            logInfo(`✅ User ${email} unlocked`);

            addError({
                message: `Successfully unlocked account ${email}`,
                severity: 'info',
                recoverable: false
            });

            // Reload users list
            await loadLockedUsers();
        } catch (error) {
            logError(`❌ Failed to unlock user ${email}:`, error);
            addError({
                message: `Failed to unlock account ${email}. Please try again.`,
                severity: 'error',
                recoverable: true
            });
        }
    }, [confirm, addError]);

    const handleLockUser = async (userId: number, email: string) => {
        const durationInput = window.prompt(
            `How many minutes should ${email} be locked for?`,
            '30'
        );

        if (!durationInput) {
            return; // User cancelled
        }

        const durationMinutes = parseInt(durationInput, 10);
        if (isNaN(durationMinutes) || durationMinutes <= 0) {
            addError({
                message: 'Invalid duration. Please enter a positive number.',
                severity: 'error',
                recoverable: false
            });
            return;
        }

        try {
            logInfo(`🔒 Locking user ${email} for ${durationMinutes} minutes...`);
            await accountLockoutConfigService.lockUser(userId, durationMinutes);
            logInfo(`✅ User ${email} locked`);

            addError({
                message: `Successfully locked account ${email} for ${durationMinutes} minutes`,
                severity: 'info',
                recoverable: false
            });

            // Reload users list
            await loadLockedUsers();
        } catch (error) {
            logError(`❌ Failed to lock user ${email}:`, error);
            addError({
                message: `Failed to lock account ${email}. Please try again.`,
                severity: 'error',
                recoverable: true
            });
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

    if (loading) {
        return (
            <AdminLayout>
                <div className="loading-spinner">Loading account lockout configuration...</div>
            </AdminLayout>
        );
    }

    if (!config) {
        return (
            <AdminLayout>
                <div className="error-message">Failed to load configuration</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Account Lockout Configuration">
            <div className="admin-credit-usage-config">
                {/* Configuration Card */}
                <div className="config-card">
                    {isEditing ? (
                        <>
                            {/* Edit Mode */}
                            <div className="config-section">
                                <h3 className="section-title">🔒 Account Lockout Security Rules</h3>
                                <div className="config-grid">
                                    <div className="form-group">
                                        <label>Maximum Failed Attempts</label>
                                        <p className="help-text">Number of consecutive failed login attempts before lockout</p>
                                        <input
                                            type="number"
                                            step="1"
                                            min="1"
                                            max="10"
                                            value={getEditedValue('maxFailedAttempts', config.maxFailedAttempts) as number}
                                            onChange={(e) => handleValueChange('maxFailedAttempts', parseInt(e.target.value) || 1)}
                                            className="config-input"
                                        />
                                        <p className="hint-text">Recommended: 3-5 attempts</p>
                                    </div>

                                    <div className="form-group">
                                        <label>Lockout Duration (minutes)</label>
                                        <p className="help-text">How long to lock account after max attempts reached</p>
                                        <input
                                            type="number"
                                            step="1"
                                            min="1"
                                            max="1440"
                                            value={getEditedValue('lockoutDurationMinutes', config.lockoutDurationMinutes) as number}
                                            onChange={(e) => handleValueChange('lockoutDurationMinutes', parseInt(e.target.value) || 1)}
                                            className="config-input"
                                        />
                                        <p className="hint-text">
                                            Current: {getEditedValue('lockoutDurationMinutes', config.lockoutDurationMinutes)} minutes
                                            (Recommended: 15-30 minutes)
                                        </p>
                                    </div>

                                    <div className="form-group">
                                        <label>Attempt Reset Period (hours)</label>
                                        <p className="help-text">Hours of inactivity before resetting attempt counter</p>
                                        <input
                                            type="number"
                                            step="1"
                                            min="1"
                                            max="24"
                                            value={getEditedValue('attemptResetHours', config.attemptResetHours) as number}
                                            onChange={(e) => handleValueChange('attemptResetHours', parseInt(e.target.value) || 1)}
                                            className="config-input"
                                        />
                                        <p className="hint-text">
                                            After {getEditedValue('attemptResetHours', config.attemptResetHours)} hours of no activity, counter resets to 0
                                        </p>
                                    </div>

                                    <div className="form-group checkbox-group">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={getEditedValue('lockoutEnabled', config.lockoutEnabled) as boolean}
                                                onChange={(e) => handleValueChange('lockoutEnabled', e.target.checked)}
                                            />
                                            <span>Account lockout system enabled globally</span>
                                        </label>
                                        <p className="help-text">Global on/off switch for account lockout security</p>
                                    </div>
                                </div>
                            </div>

                            <div className="button-group">
                                <Button onClick={handleSave} variant="primary" disabled={saving}>
                                    {saving ? '💾 Saving...' : '💾 Save Changes'}
                                </Button>
                                <Button onClick={handleCancel} variant="secondary" disabled={saving}>
                                    Cancel
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Display Mode */}
                            <div className="config-section">
                                <h3 className="section-title">🔒 Account Lockout Security Rules</h3>
                                <div className="config-grid">
                                    <div className="config-item">
                                        <label>Maximum Failed Attempts</label>
                                        <div className="config-value">{config.maxFailedAttempts}</div>
                                        <p className="config-desc">Consecutive failed login attempts before lockout</p>
                                    </div>
                                    <div className="config-item">
                                        <label>Lockout Duration</label>
                                        <div className="config-value">{config.lockoutDurationMinutes} minutes</div>
                                        <p className="config-desc">
                                            Account is locked for this duration after max attempts
                                        </p>
                                    </div>
                                    <div className="config-item">
                                        <label>Attempt Reset Period</label>
                                        <div className="config-value">{config.attemptResetHours} hour{config.attemptResetHours > 1 ? 's' : ''}</div>
                                        <p className="config-desc">
                                            Counter resets after this period of inactivity
                                        </p>
                                    </div>
                                    <div className="config-item">
                                        <label>System Status</label>
                                        <div className={`config-badge ${config.lockoutEnabled ? 'enabled' : 'disabled'}`}>
                                            {config.lockoutEnabled ? '🟢 Enabled' : '🔴 Disabled'}
                                        </div>
                                        <p className="config-desc">Global on/off switch for lockout system</p>
                                    </div>
                                </div>
                            </div>

                            <div className="button-group">
                                <Button onClick={handleEdit} variant="secondary">
                                    ✏️ Edit Configuration
                                </Button>
                            </div>
                        </>
                    )}

                    {config.updatedBy && (
                        <div className="config-footer">
                            Last updated by {config.updatedBy} on{' '}
                            {config.updatedAt ? new Date(config.updatedAt).toLocaleString() : 'Unknown'}
                        </div>
                    )}
                </div>

                {/* Locked Users Section */}
                <div className="config-card">
                    <div className="config-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 className="section-title">🔒 Users with Failed Login Attempts</h3>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={showOnlyLocked}
                                        onChange={(e) => {
                                            setShowOnlyLocked(e.target.checked);
                                            setTimeout(loadLockedUsers, 0);
                                        }}
                                    />
                                    Show only locked
                                </label>
                                <Button onClick={loadLockedUsers} variant="secondary" disabled={loadingUsers}>
                                    {loadingUsers ? '🔄 Loading...' : '🔄 Refresh'}
                                </Button>
                            </div>
                        </div>

                        {loadingUsers ? (
                            <div className="loading-spinner">Loading users...</div>
                        ) : lockedUsers.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                {showOnlyLocked
                                    ? '✅ No locked users found'
                                    : '✅ No users with failed login attempts'}
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Failed Attempts</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Last Failed Login</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Last IP</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Locked Until</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lockedUsers.map((user) => (
                                            <tr key={user.userId} style={{ borderBottom: '1px solid #dee2e6' }}>
                                                <td style={{ padding: '0.75rem' }}>
                                                    {user.currentlyLocked ? (
                                                        <span style={{
                                                            background: '#f8d7da',
                                                            color: '#721c24',
                                                            padding: '0.25rem 0.5rem',
                                                            borderRadius: '4px',
                                                            fontSize: '0.85rem',
                                                            fontWeight: 600
                                                        }}>
                                                            🔒 LOCKED
                                                        </span>
                                                    ) : (
                                                        <span style={{
                                                            background: '#fff3cd',
                                                            color: '#856404',
                                                            padding: '0.25rem 0.5rem',
                                                            borderRadius: '4px',
                                                            fontSize: '0.85rem',
                                                            fontWeight: 600
                                                        }}>
                                                            ⚠️ Warning
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.75rem', fontWeight: 500 }}>{user.email}</td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    {user.firstName && user.lastName
                                                        ? `${user.firstName} ${user.lastName}`
                                                        : 'N/A'}
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>
                                                    {user.failedLoginAttempts || 0}
                                                </td>
                                                <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                                                    {formatDate(user.lastFailedLogin)}
                                                </td>
                                                <td style={{ padding: '0.75rem', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                                                    {user.lastFailedLoginIp || 'N/A'}
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    {user.currentlyLocked ? (
                                                        <div>
                                                            <div style={{ fontSize: '0.85rem' }}>{formatDate(user.lockedUntil)}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#dc3545', fontWeight: 600 }}>
                                                                ({formatTimeRemaining(user.lockedUntil)} remaining)
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: '#666' }}>Not locked</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                        {user.currentlyLocked ? (
                                                            <button
                                                                onClick={() => handleUnlockUser(user.userId, user.email)}
                                                                style={{
                                                                    padding: '0.4rem 0.8rem',
                                                                    background: '#28a745',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.85rem',
                                                                    fontWeight: 500
                                                                }}
                                                            >
                                                                🔓 Unlock
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => handleLockUser(user.userId, user.email)}
                                                                    style={{
                                                                        padding: '0.4rem 0.8rem',
                                                                        background: '#dc3545',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.85rem',
                                                                        fontWeight: 500
                                                                    }}
                                                                >
                                                                    🔒 Lock
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUnlockUser(user.userId, user.email)}
                                                                    style={{
                                                                        padding: '0.4rem 0.8rem',
                                                                        background: '#6c757d',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.85rem',
                                                                        fontWeight: 500
                                                                    }}
                                                                >
                                                                    Reset
                                                                </button>
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
                </div>

                {/* Info Section */}
                <div className="info-section">
                    <h3>💡 How Account Lockout Works</h3>
                    <ul>
                        <li><strong>Failed Attempts:</strong> User fails login {config.maxFailedAttempts} times → account locked for {config.lockoutDurationMinutes} minutes</li>
                        <li><strong>Auto-Unlock:</strong> After {config.lockoutDurationMinutes} minutes, lockout expires automatically</li>
                        <li><strong>Counter Reset:</strong> If user fails {config.maxFailedAttempts - 1} times then waits {config.attemptResetHours} hour(s) → counter resets to 0</li>
                        <li><strong>Security:</strong> Generic error messages prevent account enumeration attacks</li>
                        <li><strong>IP Tracking:</strong> Failed attempts tracked by IP for audit trail</li>
                    </ul>

                    <div className="warning-box">
                        <strong>⚠️ Important:</strong> Changes take effect immediately for all login attempts.
                        Existing locked accounts will use the old lockout duration until their lock expires.
                    </div>

                    <h3 style={{marginTop: '2rem'}}>🎯 Example Scenarios</h3>
                    <ul>
                        <li><strong>Scenario 1:</strong> User fails login at 10:00, 10:01, 10:02 → Locked until 10:{15 + config.lockoutDurationMinutes}</li>
                        <li><strong>Scenario 2:</strong> User fails login at 10:00, 10:01, then waits → Counter resets at {11 + config.attemptResetHours}:00</li>
                        <li><strong>Scenario 3:</strong> Admin can manually unlock accounts via user management</li>
                    </ul>
                </div>

                <ConfirmDialog {...dialogProps} />
            </div>
        </AdminLayout>
    );
};

export default AdminAccountLockoutConfig;
