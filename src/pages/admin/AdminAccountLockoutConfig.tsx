import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import GeneralSettingsTabs from './GeneralSettingsTabs';
import { Button, Badge, SkeletonTable, ConfirmDialog, useConfirmDialog } from '../../components/ui';
import { accountLockoutConfigService, type AccountLockoutConfigDto, type LockedUserDto } from '../../services/accountLockoutConfigService';
import { useErrors } from '../../context/ErrorContext';
import { Shield, Lock, Unlock, Save, Edit, X, RefreshCw, AlertTriangle, Info, User } from 'lucide-react';
import { logInfo, logError } from '../../services/logger';
import './AdminUsers.css';
import './AdminButtonOverrides.css';
import './AdminAccountLockoutConfig.css';

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
        <AdminLayout title="General Settings">
            <div className="admin-page">
                <div className="admin-container">
                    {/* Sub-navigation tabs */}
                    <GeneralSettingsTabs />

                    {/* Header */}
                    <div className="admin-card admin-lockout-card-header">
                        <div className="admin-lockout-header-flex">
                            <div>
                                <h2 className="section-title admin-lockout-section-title">
                                    <Shield size={24} className="admin-lockout-section-title-icon" />
                                    Account Lockout Configuration
                                </h2>
                                <p className="admin-lockout-section-desc">
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
                        <div className="admin-card admin-lockout-error-state">
                            Failed to load configuration. Please refresh the page.
                        </div>
                    ) : isEditing ? (
                        <div className="admin-card admin-lockout-card-section">
                            <h3 className="section-title admin-lockout-form-title">
                                <Lock size={20} className="admin-lockout-section-title-icon" />
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
                                    <p className="admin-lockout-field-help">Recommended: 3-5 attempts</p>
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
                                    <p className="admin-lockout-field-help">Recommended: 15-30 minutes</p>
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
                                    <p className="admin-lockout-field-help">Counter resets after this period of inactivity</p>
                                </div>
                                <div>
                                    <label className="form-label admin-lockout-checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={getEditedValue('lockoutEnabled', config.lockoutEnabled) as boolean}
                                            onChange={(e) => handleValueChange('lockoutEnabled', e.target.checked)}
                                            className="admin-lockout-checkbox"
                                        />
                                        <span className="admin-lockout-checkbox-text">System Enabled</span>
                                    </label>
                                    <p className="admin-lockout-field-help-indent">Global on/off switch for lockout system</p>
                                </div>
                            </div>
                            <div className="admin-lockout-form-actions">
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
                        <div className="admin-card admin-lockout-card-section">
                            <h3 className="section-title admin-lockout-form-title">
                                <Lock size={20} className="admin-lockout-section-title-icon" />
                                Current Configuration
                            </h3>
                            <div className="admin-lockout-stats-grid">
                                <div className="admin-lockout-stat-card">
                                    <div className="admin-lockout-stat-label">Max Failed Attempts</div>
                                    <div className="admin-lockout-stat-value">{config.maxFailedAttempts}</div>
                                </div>
                                <div className="admin-lockout-stat-card">
                                    <div className="admin-lockout-stat-label">Lockout Duration</div>
                                    <div className="admin-lockout-stat-value">{config.lockoutDurationMinutes}<span className="admin-lockout-stat-unit"> min</span></div>
                                </div>
                                <div className="admin-lockout-stat-card">
                                    <div className="admin-lockout-stat-label">Reset Period</div>
                                    <div className="admin-lockout-stat-value">{config.attemptResetHours}<span className="admin-lockout-stat-unit"> hr</span></div>
                                </div>
                                <div className="admin-lockout-stat-card">
                                    <div className="admin-lockout-stat-label">System Status</div>
                                    <Badge variant={config.lockoutEnabled ? 'success' : 'warning'} size="sm" className="admin-lockout-badge">
                                        {config.lockoutEnabled ? 'Enabled' : 'Disabled'}
                                    </Badge>
                                </div>
                            </div>
                            {config.updatedBy && (
                                <p className="admin-lockout-updated-info">
                                    Last updated by {config.updatedBy} on {config.updatedAt ? new Date(config.updatedAt).toLocaleString() : 'Unknown'}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Locked Users */}
                    <div className="admin-card admin-lockout-card-section">
                        <div className="admin-lockout-users-header">
                            <h3 className="section-title admin-lockout-users-title">
                                <User size={20} className="admin-lockout-section-title-icon" />
                                Users with Failed Attempts
                            </h3>
                            <div className="admin-lockout-users-actions">
                                <label className="admin-lockout-filter-label">
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
                            <div className="admin-lockout-empty-state">
                                <Shield size={40} className="admin-lockout-empty-icon" />
                                <p className="admin-lockout-empty-text">{showOnlyLocked ? 'No locked users found' : 'No users with failed login attempts'}</p>
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
                                            <th className="admin-lockout-col-actions">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lockedUsers.map((user) => (
                                            <tr key={user.userId}>
                                                <td>
                                                    <Badge variant={user.currentlyLocked ? 'danger' : 'warning'} size="sm">
                                                        {user.currentlyLocked ? <><Lock size={12} className="admin-lockout-badge-icon" /> Locked</> : 'Warning'}
                                                    </Badge>
                                                </td>
                                                <td className="admin-lockout-cell-email">{user.email}</td>
                                                <td className="admin-lockout-cell-attempts">{user.failedLoginAttempts || 0}</td>
                                                <td className="admin-lockout-cell-date">
                                                    <div>{formatDate(user.lastFailedLogin)}</div>
                                                    {user.lastFailedLoginIp && <div className="admin-lockout-cell-ip">{user.lastFailedLoginIp}</div>}
                                                </td>
                                                <td>
                                                    {user.currentlyLocked ? (
                                                        <div>
                                                            <div className="admin-lockout-cell-date">{formatDate(user.lockedUntil)}</div>
                                                            <div className="admin-lockout-cell-remaining">({formatTimeRemaining(user.lockedUntil)})</div>
                                                        </div>
                                                    ) : (
                                                        <span className="admin-lockout-cell-dash">-</span>
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
                    <div className="admin-card admin-lockout-info-card">
                        <h3 className="admin-lockout-info-title">
                            <Info size={18} className="admin-lockout-info-icon" />
                            How Account Lockout Works
                        </h3>
                        <ul className="admin-lockout-info-list">
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
                    <div className="admin-card admin-lockout-warning-card">
                        <p className="admin-lockout-warning-text">
                            <AlertTriangle size={18} className="admin-lockout-warning-icon" />
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
