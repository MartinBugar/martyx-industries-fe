import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import GeneralSettingsTabs from './GeneralSettingsTabs';
import { Button, Badge, SkeletonTable } from '../../components/ui';
import { systemSettingsService, type SystemSettingsDto } from '../../services/systemSettingsService';
import { useErrors } from '../../context/ErrorContext';
import { Settings, Lock, Unlock, Save, Edit, X, AlertTriangle, Info, Globe, Percent, DollarSign, RotateCw, Box, Eye, EyeOff } from 'lucide-react';
import './AdminUsers.css';
import './AdminButtonOverrides.css';
import './AdminSystemSettings.css';
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
            logInfo('Loading system settings...');
            const data = await systemSettingsService.getSettings();
            setSettings(data);
            logInfo('Loaded system settings');
        } catch (error) {
            logError('Failed to load system settings:', error);
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
            devGatePassword: settings.devGatePassword,
            ossEnabled: settings.ossEnabled,
            defaultVatRate: settings.defaultVatRate,
            sellerCountryCode: settings.sellerCountryCode,
            ossThresholdEur: settings.ossThresholdEur,
            autoRotate3DModel: settings.autoRotate3DModel,
            cassandraTabEnabled: settings.cassandraTabEnabled
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
            logInfo('Updating system settings...');

            const updateRequest: SystemSettingsDto = {
                id: settings.id,
                devGateEnabled: editedValues.devGateEnabled ?? settings.devGateEnabled,
                devGatePassword: editedValues.devGatePassword ?? settings.devGatePassword,
                ossEnabled: editedValues.ossEnabled ?? settings.ossEnabled,
                defaultVatRate: editedValues.defaultVatRate ?? settings.defaultVatRate,
                sellerCountryCode: editedValues.sellerCountryCode ?? settings.sellerCountryCode,
                ossThresholdEur: editedValues.ossThresholdEur ?? settings.ossThresholdEur,
                autoRotate3DModel: editedValues.autoRotate3DModel ?? settings.autoRotate3DModel,
                cassandraTabEnabled: editedValues.cassandraTabEnabled ?? settings.cassandraTabEnabled
            };

            const updated = await systemSettingsService.updateSettings(updateRequest);
            setSettings(updated);
            setIsEditing(false);
            setEditedValues({});

            logInfo('System settings updated');
            addError({
                message: 'Successfully updated system settings',
                severity: 'info',
                recoverable: false
            });
        } catch (error) {
            logError('Failed to update system settings:', error);
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

    const handleValueChange = (field: keyof SystemSettingsDto, value: string | boolean | number) => {
        setEditedValues(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const getEditedValue = <T extends string | boolean | number | undefined>(field: keyof SystemSettingsDto, originalValue: T): T => {
        return (editedValues[field] ?? originalValue) as T;
    };

    return (
        <AdminLayout title="General Settings">
            <div className="admin-page">
                <div className="admin-container">
                    {/* Sub-navigation tabs */}
                    <GeneralSettingsTabs />

                    {/* Header */}
                    <div className="admin-card admin-system-card-header">
                        <div className="admin-system-header-flex">
                            <div>
                                <h2 className="section-title admin-system-section-title">
                                    <Settings size={24} className="admin-system-section-title-icon" />
                                    System Settings
                                </h2>
                                <p className="admin-system-section-desc">
                                    Configure system-wide settings for your application.
                                </p>
                            </div>
                            {!isEditing && settings && (
                                <Button variant="outline" onClick={handleEdit}>
                                    <Edit size={16} />
                                    Edit Settings
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="admin-card">
                            <SkeletonTable rows={3} columns={2} />
                        </div>
                    ) : !settings ? (
                        <div className="admin-card">
                            <div className="admin-system-error-msg">
                                Failed to load settings. Please refresh the page.
                            </div>
                        </div>
                    ) : isEditing ? (
                        /* Edit Mode */
                        <>
                            <div className="admin-card admin-system-card-section">
                                <h3 className="section-title admin-system-section-title">
                                    <Lock size={20} className="admin-system-section-title-icon" />
                                    Development Access Gate
                                </h3>

                                <div className="form-grid">
                                    <div className="admin-system-full-width">
                                        <label className="form-label admin-system-checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={getEditedValue('devGateEnabled', settings.devGateEnabled) as boolean}
                                                onChange={(e) => handleValueChange('devGateEnabled', e.target.checked)}
                                                className="admin-system-checkbox"
                                            />
                                            <span className="admin-system-checkbox-text">
                                                Enable Development Access Gate
                                            </span>
                                        </label>
                                        <p className="admin-system-help-text">
                                            If enabled, users must enter a password to access the site
                                        </p>
                                    </div>

                                    <div>
                                        <label className="form-label">Access Password</label>
                                        <input
                                            type="text"
                                            value={getEditedValue('devGatePassword', settings.devGatePassword) as string}
                                            onChange={(e) => handleValueChange('devGatePassword', e.target.value)}
                                            className="form-input"
                                            placeholder="Enter password"
                                        />
                                        <p className="admin-system-field-help">
                                            Password required to access the development site
                                        </p>
                                    </div>
                                </div>

                            </div>

                            {/* OSS / Tax Configuration - Edit Mode */}
                            <div className="admin-card admin-system-card-section">
                                <h3 className="section-title admin-system-section-title">
                                    <Globe size={20} className="admin-system-section-title-icon" />
                                    OSS / Tax Configuration
                                </h3>

                                <div className="form-grid">
                                    <div className="admin-system-full-width">
                                        <label className="form-label admin-system-checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={getEditedValue('ossEnabled', settings.ossEnabled ?? false)}
                                                onChange={(e) => handleValueChange('ossEnabled', e.target.checked)}
                                                className="admin-system-checkbox"
                                            />
                                            <span className="admin-system-checkbox-text">
                                                Enable OSS (One Stop Shop)
                                            </span>
                                        </label>
                                        <p className="admin-system-help-text">
                                            When disabled, always use domestic VAT rate (23% SK). When enabled, use customer's country VAT rate.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="form-label">Default VAT Rate (%)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={getEditedValue('defaultVatRate', settings.defaultVatRate ?? 23)}
                                            onChange={(e) => handleValueChange('defaultVatRate', parseFloat(e.target.value) || 0)}
                                            className="form-input"
                                            placeholder="23.00"
                                        />
                                        <p className="admin-system-field-help">
                                            Domestic VAT rate (e.g., 23% for Slovakia)
                                        </p>
                                    </div>

                                    <div>
                                        <label className="form-label">Seller Country Code</label>
                                        <input
                                            type="text"
                                            maxLength={2}
                                            value={getEditedValue('sellerCountryCode', settings.sellerCountryCode ?? 'SK')}
                                            onChange={(e) => handleValueChange('sellerCountryCode', e.target.value.toUpperCase())}
                                            className="form-input admin-system-input-uppercase"
                                            placeholder="SK"
                                        />
                                        <p className="admin-system-field-help">
                                            ISO country code (e.g., SK, CZ, DE)
                                        </p>
                                    </div>

                                    <div>
                                        <label className="form-label">OSS Threshold (EUR)</label>
                                        <input
                                            type="number"
                                            step="100"
                                            min="0"
                                            value={getEditedValue('ossThresholdEur', settings.ossThresholdEur ?? 10000)}
                                            onChange={(e) => handleValueChange('ossThresholdEur', parseFloat(e.target.value) || 0)}
                                            className="form-input"
                                            placeholder="10000"
                                        />
                                        <p className="admin-system-field-help">
                                            EU OSS threshold (default 10,000 EUR annual B2C sales)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 3D Model Configuration - Edit Mode */}
                            <div className="admin-card admin-system-card-section">
                                <h3 className="section-title admin-system-section-title">
                                    <Box size={20} className="admin-system-section-title-icon" />
                                    3D Model Display
                                </h3>

                                <div className="form-grid">
                                    <div className="admin-system-full-width">
                                        <label className="form-label admin-system-checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={getEditedValue('autoRotate3DModel', settings.autoRotate3DModel ?? false)}
                                                onChange={(e) => handleValueChange('autoRotate3DModel', e.target.checked)}
                                                className="admin-system-checkbox"
                                            />
                                            <span className="admin-system-checkbox-text">
                                                Enable Auto-Rotate for 3D Models
                                            </span>
                                        </label>
                                        <p className="admin-system-help-text">
                                            When enabled, 3D product models will automatically rotate on product detail pages
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* UI Visibility Settings - Edit Mode */}
                            <div className="admin-card admin-system-card-section">
                                <h3 className="section-title admin-system-section-title">
                                    <Eye size={20} className="admin-system-section-title-icon" />
                                    UI Visibility
                                </h3>

                                <div className="form-grid">
                                    <div className="admin-system-full-width">
                                        <label className="form-label admin-system-checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={getEditedValue('cassandraTabEnabled', settings.cassandraTabEnabled ?? true)}
                                                onChange={(e) => handleValueChange('cassandraTabEnabled', e.target.checked)}
                                                className="admin-system-checkbox"
                                            />
                                            <span className="admin-system-checkbox-text">
                                                Show "My Cassandra" Tab in User Account
                                            </span>
                                        </label>
                                        <p className="admin-system-help-text">
                                            When disabled, the My Cassandra tab will be hidden from all users in their account section
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Save/Cancel Buttons */}
                            <div className="admin-card">
                                <div className="admin-system-actions">
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
                        </>
                    ) : (
                        /* Display Mode */
                        <>
                            <div className="admin-card admin-system-card-section">
                                <h3 className="section-title admin-system-section-title">
                                    <Lock size={20} className="admin-system-section-title-icon" />
                                    Development Access Gate
                                </h3>

                                <div className="admin-system-display-grid">
                                    <div className="admin-system-display-card">
                                        <div className="admin-system-display-label">Gate Status</div>
                                        <Badge
                                            variant={settings.devGateEnabled ? 'success' : 'warning'}
                                            size="sm"
                                            className="admin-system-badge"
                                        >
                                            {settings.devGateEnabled ? (
                                                <><Lock size={14} className="admin-system-icon-mr" /> Enabled</>
                                            ) : (
                                                <><Unlock size={14} className="admin-system-icon-mr" /> Disabled</>
                                            )}
                                        </Badge>
                                        <p className="admin-system-display-desc">
                                            {settings.devGateEnabled
                                                ? 'Users must enter password to access site'
                                                : 'Site is publicly accessible'}
                                        </p>
                                    </div>

                                    <div className="admin-system-display-card">
                                        <div className="admin-system-display-label">Current Password</div>
                                        <div className="admin-system-display-value">
                                            {'•'.repeat(Math.min(settings.devGatePassword.length, 12))}
                                        </div>
                                        <p className="admin-system-display-desc">
                                            Password is hidden for security
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* OSS / Tax Configuration - Display Mode */}
                            <div className="admin-card admin-system-card-section">
                                <h3 className="section-title admin-system-section-title">
                                    <Globe size={20} className="admin-system-section-title-icon" />
                                    OSS / Tax Configuration
                                </h3>

                                <div className="admin-system-display-grid-sm">
                                    <div className="admin-system-display-card">
                                        <div className="admin-system-display-label">OSS Status</div>
                                        <Badge
                                            variant={settings.ossEnabled ? 'success' : 'warning'}
                                            size="sm"
                                            className="admin-system-badge"
                                        >
                                            {settings.ossEnabled ? (
                                                <><Globe size={14} className="admin-system-icon-mr" /> Enabled</>
                                            ) : (
                                                <><Globe size={14} className="admin-system-icon-mr" /> Disabled</>
                                            )}
                                        </Badge>
                                        <p className="admin-system-display-desc">
                                            {settings.ossEnabled
                                                ? 'Using customer country VAT rates'
                                                : 'Always using domestic VAT rate'}
                                        </p>
                                    </div>

                                    <div className="admin-system-display-card">
                                        <div className="admin-system-display-label">Default VAT Rate</div>
                                        <div className="admin-system-display-value-flex">
                                            <Percent size={20} />
                                            {settings.defaultVatRate ?? 23}
                                        </div>
                                        <p className="admin-system-display-desc">
                                            Domestic VAT rate
                                        </p>
                                    </div>

                                    <div className="admin-system-display-card">
                                        <div className="admin-system-display-label">Seller Country</div>
                                        <div className="admin-system-display-value-flex">
                                            {settings.sellerCountryCode ?? 'SK'}
                                        </div>
                                        <p className="admin-system-display-desc">
                                            ISO country code
                                        </p>
                                    </div>

                                    <div className="admin-system-display-card">
                                        <div className="admin-system-display-label">OSS Threshold</div>
                                        <div className="admin-system-display-value-flex">
                                            <DollarSign size={20} />
                                            {(settings.ossThresholdEur ?? 10000).toLocaleString()} EUR
                                        </div>
                                        <p className="admin-system-display-desc">
                                            Annual B2C threshold
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 3D Model Configuration - Display Mode */}
                            <div className="admin-card admin-system-card-section">
                                <h3 className="section-title admin-system-section-title">
                                    <Box size={20} className="admin-system-section-title-icon" />
                                    3D Model Display
                                </h3>

                                <div className="admin-system-display-grid">
                                    <div className="admin-system-display-card">
                                        <div className="admin-system-display-label">Auto-Rotate Status</div>
                                        <Badge
                                            variant={settings.autoRotate3DModel ? 'success' : 'warning'}
                                            size="sm"
                                            className="admin-system-badge"
                                        >
                                            {settings.autoRotate3DModel ? (
                                                <><RotateCw size={14} className="admin-system-icon-mr" /> Enabled</>
                                            ) : (
                                                <><RotateCw size={14} className="admin-system-icon-mr" /> Disabled</>
                                            )}
                                        </Badge>
                                        <p className="admin-system-display-desc">
                                            {settings.autoRotate3DModel
                                                ? '3D models will automatically rotate on product pages'
                                                : '3D models remain static until user interaction'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* UI Visibility Settings - Display Mode */}
                            <div className="admin-card admin-system-card-section">
                                <h3 className="section-title admin-system-section-title">
                                    <Eye size={20} className="admin-system-section-title-icon" />
                                    UI Visibility
                                </h3>

                                <div className="admin-system-display-grid">
                                    <div className="admin-system-display-card">
                                        <div className="admin-system-display-label">My Cassandra Tab</div>
                                        <Badge
                                            variant={settings.cassandraTabEnabled !== false ? 'success' : 'warning'}
                                            size="sm"
                                            className="admin-system-badge"
                                        >
                                            {settings.cassandraTabEnabled !== false ? (
                                                <><Eye size={14} className="admin-system-icon-mr" /> Visible</>
                                            ) : (
                                                <><EyeOff size={14} className="admin-system-icon-mr" /> Hidden</>
                                            )}
                                        </Badge>
                                        <p className="admin-system-display-desc">
                                            {settings.cassandraTabEnabled !== false
                                                ? 'My Cassandra tab is visible in user account section'
                                                : 'My Cassandra tab is hidden from all users'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Info Section */}
                    <div className="admin-card admin-system-info-card">
                        <h3 className="admin-system-info-title">
                            <Info size={18} className="admin-system-info-icon" />
                            About Development Access Gate
                        </h3>
                        <ul className="admin-system-info-list">
                            <li><strong>Purpose:</strong> Restrict access to your development/staging environment</li>
                            <li><strong>When Enabled:</strong> Visitors see a password prompt before accessing the site</li>
                            <li><strong>When Disabled:</strong> Site is publicly accessible (normal production mode)</li>
                            <li><strong>Password Storage:</strong> Passwords are stored securely in the database</li>
                            <li><strong>Session:</strong> Once validated, users remain authenticated for their session</li>
                        </ul>
                    </div>

                    {/* Warning */}
                    <div className="admin-card admin-system-warning-card">
                        <p className="admin-system-warning-text">
                            <AlertTriangle size={18} className="admin-system-warning-icon" />
                            <span>
                                <strong>Important:</strong> Changes take effect immediately. If you enable the gate,
                                all current users will be logged out and required to enter the password.
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminSystemSettings;
