import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Button } from '../../components/ui';
import { systemSettingsService, type SystemSettingsDto } from '../../services/systemSettingsService';
import { useErrors } from '../../context/ErrorContext';
import './AdminCreditUsageConfig.css'; // Reusing existing styles
import { logInfo, logError } from '../../services/logger';

const AdminSystemSettings: React.FC = () => {
    const { addError } = useErrors();
    const [settings, setSettings] = useState<SystemSettingsDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedValues, setEditedValues] = useState<Partial<SystemSettingsDto>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            logInfo('🔄 Loading system settings...');
            const data = await systemSettingsService.getSettings();
            setSettings(data);
            logInfo('✅ Loaded system settings');
        } catch (error) {
            logError('❌ Failed to load system settings:', error);
            addError({
                message: 'Failed to load system settings. Please try again.',
                severity: 'error',
                recoverable: true,
                action: loadSettings
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        if (!settings) return;
        setIsEditing(true);
        setEditedValues({
            devGateEnabled: settings.devGateEnabled,
            devGatePassword: settings.devGatePassword
        });
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedValues({});
    };

    const handleSave = async () => {
        if (!settings) return;

        try {
            setSaving(true);
            logInfo('💾 Updating system settings...');

            const updateRequest: SystemSettingsDto = {
                id: settings.id,
                devGateEnabled: editedValues.devGateEnabled ?? settings.devGateEnabled,
                devGatePassword: editedValues.devGatePassword ?? settings.devGatePassword
            };

            const updated = await systemSettingsService.updateSettings(updateRequest);
            setSettings(updated);
            setIsEditing(false);
            setEditedValues({});

            logInfo('✅ System settings updated');
            addError({
                message: 'Successfully updated system settings',
                severity: 'info',
                recoverable: false
            });
        } catch (error) {
            logError('❌ Failed to update system settings:', error);
            addError({
                message: 'Failed to update settings. Please try again.',
                severity: 'error',
                recoverable: true,
                action: handleSave
            });
        } finally {
            setSaving(false);
        }
    };

    const handleValueChange = (field: keyof SystemSettingsDto, value: string | boolean) => {
        setEditedValues(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const getEditedValue = (field: keyof SystemSettingsDto, originalValue: string | boolean) => {
        return editedValues[field] ?? originalValue;
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="loading-spinner">Loading system settings...</div>
            </AdminLayout>
        );
    }

    if (!settings) {
        return (
            <AdminLayout>
                <div className="error-message">Failed to load settings</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="System Settings">
            <div className="admin-credit-usage-config">
                {/* Configuration Card */}
                <div className="config-card">
                    {isEditing ? (
                        <>
                            {/* Edit Mode */}
                            <div className="config-section">
                                <h3 className="section-title">🔧 Development Access Gate</h3>
                                <div className="config-grid">
                                    <div className="form-group checkbox-group">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={getEditedValue('devGateEnabled', settings.devGateEnabled) as boolean}
                                                onChange={(e) => handleValueChange('devGateEnabled', e.target.checked)}
                                            />
                                            <span>Enable Development Access Gate</span>
                                        </label>
                                        <p className="help-text">If enabled, users must enter a password to access the site</p>
                                    </div>

                                    <div className="form-group">
                                        <label>Access Password</label>
                                        <p className="help-text">Password required to access the development site</p>
                                        <input
                                            type="text"
                                            value={getEditedValue('devGatePassword', settings.devGatePassword) as string}
                                            onChange={(e) => handleValueChange('devGatePassword', e.target.value)}
                                            className="config-input"
                                            placeholder="Enter password"
                                        />
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
                                <h3 className="section-title">🔧 Development Access Gate</h3>
                                <div className="config-grid">
                                    <div className="config-item">
                                        <label>Gate Status</label>
                                        <div className={`config-badge ${settings.devGateEnabled ? 'enabled' : 'disabled'}`}>
                                            {settings.devGateEnabled ? '🔒 Enabled' : '🔓 Disabled'}
                                        </div>
                                        <p className="config-desc">
                                            {settings.devGateEnabled
                                                ? 'Users must enter password to access site'
                                                : 'Site is publicly accessible'}
                                        </p>
                                    </div>
                                    <div className="config-item">
                                        <label>Current Password</label>
                                        <div className="config-value">
                                            {'•'.repeat(settings.devGatePassword.length)}
                                        </div>
                                        <p className="config-desc">Password is hidden for security</p>
                                    </div>
                                </div>
                            </div>

                            <div className="button-group">
                                <Button onClick={handleEdit} variant="secondary">
                                    ✏️ Edit Settings
                                </Button>
                            </div>
                        </>
                    )}
                </div>

                {/* Info Section */}
                <div className="info-section">
                    <h3>💡 About Development Access Gate</h3>
                    <ul>
                        <li><strong>Purpose:</strong> Restrict access to your development/staging environment</li>
                        <li><strong>When Enabled:</strong> Visitors see a password prompt before accessing the site</li>
                        <li><strong>When Disabled:</strong> Site is publicly accessible (normal production mode)</li>
                        <li><strong>Password Storage:</strong> Passwords are stored securely in the database</li>
                        <li><strong>Session:</strong> Once validated, users remain authenticated for their session</li>
                    </ul>

                    <div className="warning-box">
                        <strong>⚠️ Important:</strong> Changes take effect immediately. If you enable the gate,
                        all current users will be logged out and required to enter the password.
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminSystemSettings;
