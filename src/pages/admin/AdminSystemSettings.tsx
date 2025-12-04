import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import GeneralSettingsTabs from './GeneralSettingsTabs';
import { Button, Badge, SkeletonTable } from '../../components/ui';
import { systemSettingsService, type SystemSettingsDto } from '../../services/systemSettingsService';
import { useErrors } from '../../context/ErrorContext';
import { Settings, Lock, Unlock, Save, Edit, X, AlertTriangle, Info, Globe, Percent, DollarSign, RotateCw, Box } from 'lucide-react';
import './AdminUsers.css';
import './AdminButtonOverrides.css';
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
            autoRotate3DModel: settings.autoRotate3DModel
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
                autoRotate3DModel: editedValues.autoRotate3DModel ?? settings.autoRotate3DModel
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
                    <div className="admin-card" style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                                <h2 className="section-title" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Settings size={24} style={{ color: 'var(--admin-accent)' }} />
                                    System Settings
                                </h2>
                                <p style={{ margin: 0, color: 'var(--admin-secondary)', fontSize: '14px' }}>
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
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--admin-error)' }}>
                                Failed to load settings. Please refresh the page.
                            </div>
                        </div>
                    ) : isEditing ? (
                        /* Edit Mode */
                        <>
                            <div className="admin-card" style={{ marginBottom: '20px' }}>
                                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <Lock size={20} style={{ color: 'var(--admin-accent)' }} />
                                    Development Access Gate
                                </h3>

                                <div className="form-grid">
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={getEditedValue('devGateEnabled', settings.devGateEnabled) as boolean}
                                                onChange={(e) => handleValueChange('devGateEnabled', e.target.checked)}
                                                style={{ width: '20px', height: '20px' }}
                                            />
                                            <span style={{ fontWeight: 600, color: 'var(--admin-primary)' }}>
                                                Enable Development Access Gate
                                            </span>
                                        </label>
                                        <p style={{ margin: '8px 0 0 32px', fontSize: '13px', color: 'var(--admin-secondary)' }}>
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
                                        <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--admin-secondary)' }}>
                                            Password required to access the development site
                                        </p>
                                    </div>
                                </div>

                            </div>

                            {/* OSS / Tax Configuration - Edit Mode */}
                            <div className="admin-card" style={{ marginBottom: '20px' }}>
                                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <Globe size={20} style={{ color: 'var(--admin-accent)' }} />
                                    OSS / Tax Configuration
                                </h3>

                                <div className="form-grid">
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={getEditedValue('ossEnabled', settings.ossEnabled ?? false)}
                                                onChange={(e) => handleValueChange('ossEnabled', e.target.checked)}
                                                style={{ width: '20px', height: '20px' }}
                                            />
                                            <span style={{ fontWeight: 600, color: 'var(--admin-primary)' }}>
                                                Enable OSS (One Stop Shop)
                                            </span>
                                        </label>
                                        <p style={{ margin: '8px 0 0 32px', fontSize: '13px', color: 'var(--admin-secondary)' }}>
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
                                        <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--admin-secondary)' }}>
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
                                            className="form-input"
                                            placeholder="SK"
                                            style={{ textTransform: 'uppercase' }}
                                        />
                                        <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--admin-secondary)' }}>
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
                                        <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--admin-secondary)' }}>
                                            EU OSS threshold (default 10,000 EUR annual B2C sales)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 3D Model Configuration - Edit Mode */}
                            <div className="admin-card" style={{ marginBottom: '20px' }}>
                                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <Box size={20} style={{ color: 'var(--admin-accent)' }} />
                                    3D Model Display
                                </h3>

                                <div className="form-grid">
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={getEditedValue('autoRotate3DModel', settings.autoRotate3DModel ?? false)}
                                                onChange={(e) => handleValueChange('autoRotate3DModel', e.target.checked)}
                                                style={{ width: '20px', height: '20px' }}
                                            />
                                            <span style={{ fontWeight: 600, color: 'var(--admin-primary)' }}>
                                                Enable Auto-Rotate for 3D Models
                                            </span>
                                        </label>
                                        <p style={{ margin: '8px 0 0 32px', fontSize: '13px', color: 'var(--admin-secondary)' }}>
                                            When enabled, 3D product models will automatically rotate on product detail pages
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Save/Cancel Buttons */}
                            <div className="admin-card">
                                <div style={{ display: 'flex', gap: '12px' }}>
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
                            <div className="admin-card" style={{ marginBottom: '20px' }}>
                                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <Lock size={20} style={{ color: 'var(--admin-accent)' }} />
                                    Development Access Gate
                                </h3>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                                    <div style={{ padding: '20px', background: 'var(--admin-bg-secondary)', borderRadius: '10px', border: '1px solid var(--admin-border)' }}>
                                        <div style={{ fontSize: '13px', color: 'var(--admin-secondary)', marginBottom: '8px' }}>Gate Status</div>
                                        <Badge
                                            variant={settings.devGateEnabled ? 'success' : 'warning'}
                                            size="sm"
                                            style={{ fontSize: '14px', padding: '8px 16px' }}
                                        >
                                            {settings.devGateEnabled ? (
                                                <><Lock size={14} style={{ marginRight: 6 }} /> Enabled</>
                                            ) : (
                                                <><Unlock size={14} style={{ marginRight: 6 }} /> Disabled</>
                                            )}
                                        </Badge>
                                        <p style={{ margin: '12px 0 0', fontSize: '13px', color: 'var(--admin-secondary)' }}>
                                            {settings.devGateEnabled
                                                ? 'Users must enter password to access site'
                                                : 'Site is publicly accessible'}
                                        </p>
                                    </div>

                                    <div style={{ padding: '20px', background: 'var(--admin-bg-secondary)', borderRadius: '10px', border: '1px solid var(--admin-border)' }}>
                                        <div style={{ fontSize: '13px', color: 'var(--admin-secondary)', marginBottom: '8px' }}>Current Password</div>
                                        <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--admin-primary)', letterSpacing: '2px' }}>
                                            {'•'.repeat(Math.min(settings.devGatePassword.length, 12))}
                                        </div>
                                        <p style={{ margin: '12px 0 0', fontSize: '13px', color: 'var(--admin-secondary)' }}>
                                            Password is hidden for security
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* OSS / Tax Configuration - Display Mode */}
                            <div className="admin-card" style={{ marginBottom: '20px' }}>
                                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <Globe size={20} style={{ color: 'var(--admin-accent)' }} />
                                    OSS / Tax Configuration
                                </h3>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                    <div style={{ padding: '20px', background: 'var(--admin-bg-secondary)', borderRadius: '10px', border: '1px solid var(--admin-border)' }}>
                                        <div style={{ fontSize: '13px', color: 'var(--admin-secondary)', marginBottom: '8px' }}>OSS Status</div>
                                        <Badge
                                            variant={settings.ossEnabled ? 'success' : 'warning'}
                                            size="sm"
                                            style={{ fontSize: '14px', padding: '8px 16px' }}
                                        >
                                            {settings.ossEnabled ? (
                                                <><Globe size={14} style={{ marginRight: 6 }} /> Enabled</>
                                            ) : (
                                                <><Globe size={14} style={{ marginRight: 6 }} /> Disabled</>
                                            )}
                                        </Badge>
                                        <p style={{ margin: '12px 0 0', fontSize: '13px', color: 'var(--admin-secondary)' }}>
                                            {settings.ossEnabled
                                                ? 'Using customer country VAT rates'
                                                : 'Always using domestic VAT rate'}
                                        </p>
                                    </div>

                                    <div style={{ padding: '20px', background: 'var(--admin-bg-secondary)', borderRadius: '10px', border: '1px solid var(--admin-border)' }}>
                                        <div style={{ fontSize: '13px', color: 'var(--admin-secondary)', marginBottom: '8px' }}>Default VAT Rate</div>
                                        <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--admin-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Percent size={20} />
                                            {settings.defaultVatRate ?? 23}
                                        </div>
                                        <p style={{ margin: '12px 0 0', fontSize: '13px', color: 'var(--admin-secondary)' }}>
                                            Domestic VAT rate
                                        </p>
                                    </div>

                                    <div style={{ padding: '20px', background: 'var(--admin-bg-secondary)', borderRadius: '10px', border: '1px solid var(--admin-border)' }}>
                                        <div style={{ fontSize: '13px', color: 'var(--admin-secondary)', marginBottom: '8px' }}>Seller Country</div>
                                        <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--admin-primary)' }}>
                                            {settings.sellerCountryCode ?? 'SK'}
                                        </div>
                                        <p style={{ margin: '12px 0 0', fontSize: '13px', color: 'var(--admin-secondary)' }}>
                                            ISO country code
                                        </p>
                                    </div>

                                    <div style={{ padding: '20px', background: 'var(--admin-bg-secondary)', borderRadius: '10px', border: '1px solid var(--admin-border)' }}>
                                        <div style={{ fontSize: '13px', color: 'var(--admin-secondary)', marginBottom: '8px' }}>OSS Threshold</div>
                                        <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--admin-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <DollarSign size={20} />
                                            {(settings.ossThresholdEur ?? 10000).toLocaleString()} EUR
                                        </div>
                                        <p style={{ margin: '12px 0 0', fontSize: '13px', color: 'var(--admin-secondary)' }}>
                                            Annual B2C threshold
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 3D Model Configuration - Display Mode */}
                            <div className="admin-card" style={{ marginBottom: '20px' }}>
                                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <Box size={20} style={{ color: 'var(--admin-accent)' }} />
                                    3D Model Display
                                </h3>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                                    <div style={{ padding: '20px', background: 'var(--admin-bg-secondary)', borderRadius: '10px', border: '1px solid var(--admin-border)' }}>
                                        <div style={{ fontSize: '13px', color: 'var(--admin-secondary)', marginBottom: '8px' }}>Auto-Rotate Status</div>
                                        <Badge
                                            variant={settings.autoRotate3DModel ? 'success' : 'warning'}
                                            size="sm"
                                            style={{ fontSize: '14px', padding: '8px 16px' }}
                                        >
                                            {settings.autoRotate3DModel ? (
                                                <><RotateCw size={14} style={{ marginRight: 6 }} /> Enabled</>
                                            ) : (
                                                <><RotateCw size={14} style={{ marginRight: 6 }} /> Disabled</>
                                            )}
                                        </Badge>
                                        <p style={{ margin: '12px 0 0', fontSize: '13px', color: 'var(--admin-secondary)' }}>
                                            {settings.autoRotate3DModel
                                                ? '3D models will automatically rotate on product pages'
                                                : '3D models remain static until user interaction'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Info Section */}
                    <div className="admin-card" style={{ background: 'var(--admin-info-bg)', borderColor: 'var(--admin-info)' }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: 'var(--admin-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Info size={18} style={{ color: 'var(--admin-info)' }} />
                            About Development Access Gate
                        </h3>
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: 'var(--admin-primary)', lineHeight: 1.8 }}>
                            <li><strong>Purpose:</strong> Restrict access to your development/staging environment</li>
                            <li><strong>When Enabled:</strong> Visitors see a password prompt before accessing the site</li>
                            <li><strong>When Disabled:</strong> Site is publicly accessible (normal production mode)</li>
                            <li><strong>Password Storage:</strong> Passwords are stored securely in the database</li>
                            <li><strong>Session:</strong> Once validated, users remain authenticated for their session</li>
                        </ul>
                    </div>

                    {/* Warning */}
                    <div className="admin-card" style={{ background: 'var(--admin-warning-bg)', borderColor: 'var(--admin-warning)', marginTop: '20px' }}>
                        <p style={{ margin: 0, fontSize: '14px', color: '#92400E', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
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
