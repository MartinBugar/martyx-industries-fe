import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Button } from '../../components/ui';
import { accountLockoutConfigService, type AccountLockoutConfigDto } from '../../services/accountLockoutConfigService';
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

    useEffect(() => {
        loadConfig();
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
            </div>
        </AdminLayout>
    );
};

export default AdminAccountLockoutConfig;
