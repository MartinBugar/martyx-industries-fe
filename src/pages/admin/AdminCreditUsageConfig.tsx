import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Button } from '../../components/ui';
import { creditUsageConfigService, type CreditUsageConfigDto } from '../../services/creditUsageConfigService';
import { useErrors } from '../../context/ErrorContext';
import './AdminCreditUsageConfig.css';
import { logInfo, logError } from '../../services/logger';

const AdminCreditUsageConfig: React.FC = () => {
    const { addError } = useErrors();
    const [config, setConfig] = useState<CreditUsageConfigDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedValues, setEditedValues] = useState<Partial<CreditUsageConfigDto>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            logInfo('🔄 Loading credit usage configuration...');
            const data = await creditUsageConfigService.getAdminConfig();
            setConfig(data);
            logInfo('✅ Loaded credit usage configuration');
        } catch (error) {
            logError('❌ Failed to load credit usage configuration:', error);
            addError({
                message: 'Failed to load credit usage configuration. Please try again.',
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
            minOrderValueForCredits: config.minOrderValueForCredits,
            maxCreditPercentage: config.maxCreditPercentage,
            allowCreditsWithDiscounts: config.allowCreditsWithDiscounts,
            creditsEnabled: config.creditsEnabled
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
            logInfo('💾 Updating credit usage configuration...');

            const updateRequest = {
                minOrderValueForCredits: editedValues.minOrderValueForCredits ?? config.minOrderValueForCredits,
                maxCreditPercentage: editedValues.maxCreditPercentage ?? config.maxCreditPercentage,
                allowCreditsWithDiscounts: editedValues.allowCreditsWithDiscounts ?? config.allowCreditsWithDiscounts,
                creditsEnabled: editedValues.creditsEnabled ?? config.creditsEnabled
            };

            const updated = await creditUsageConfigService.updateConfig(updateRequest);
            setConfig(updated);
            setIsEditing(false);
            setEditedValues({});

            logInfo('✅ Credit usage configuration updated');
            addError({
                message: 'Successfully updated credit usage configuration',
                severity: 'info',
                recoverable: false
            });
        } catch (error) {
            logError('❌ Failed to update credit usage configuration:', error);
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

    const handleValueChange = (field: keyof CreditUsageConfigDto, value: number | boolean) => {
        setEditedValues(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const getEditedValue = (field: keyof CreditUsageConfigDto, originalValue: number | boolean) => {
        return editedValues[field] ?? originalValue;
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="loading-spinner">Loading credit usage configuration...</div>
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
        <AdminLayout title="Credit Usage Configuration">
            <div className="admin-credit-usage-config">
                {/* Configuration Card */}
                <div className="config-card">
                    {isEditing ? (
                        <>
                            {/* Edit Mode */}
                            <div className="config-section">
                                <h3 className="section-title">💳 Credit Usage Rules</h3>
                                <div className="config-grid">
                                    <div className="form-group">
                                        <label>Minimum Order Value (€)</label>
                                        <p className="help-text">Minimum order subtotal required to use credits</p>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={getEditedValue('minOrderValueForCredits', config.minOrderValueForCredits) as number}
                                            onChange={(e) => handleValueChange('minOrderValueForCredits', parseFloat(e.target.value) || 0)}
                                            className="config-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Maximum Credit Percentage (%)</label>
                                        <p className="help-text">Maximum % of order that can be paid with credits</p>
                                        <input
                                            type="number"
                                            step="1"
                                            min="0"
                                            max="100"
                                            value={((getEditedValue('maxCreditPercentage', config.maxCreditPercentage) as number) * 100).toFixed(0)}
                                            onChange={(e) => handleValueChange('maxCreditPercentage', (parseFloat(e.target.value) || 0) / 100)}
                                            className="config-input"
                                        />
                                        <p className="hint-text">
                                            Current: {((getEditedValue('maxCreditPercentage', config.maxCreditPercentage) as number) * 100).toFixed(0)}%
                                            (Example: 50% = €100 order → max €50 from credits)
                                        </p>
                                    </div>

                                    <div className="form-group checkbox-group">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={getEditedValue('allowCreditsWithDiscounts', config.allowCreditsWithDiscounts) as boolean}
                                                onChange={(e) => handleValueChange('allowCreditsWithDiscounts', e.target.checked)}
                                            />
                                            <span>Allow credits with discount codes</span>
                                        </label>
                                        <p className="help-text">If unchecked, users must choose: either discount OR credits (not both)</p>
                                    </div>

                                    <div className="form-group checkbox-group">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={getEditedValue('creditsEnabled', config.creditsEnabled) as boolean}
                                                onChange={(e) => handleValueChange('creditsEnabled', e.target.checked)}
                                            />
                                            <span>Credits system enabled globally</span>
                                        </label>
                                        <p className="help-text">Global on/off switch for earning and using credits</p>
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
                                <h3 className="section-title">💳 Credit Usage Rules</h3>
                                <div className="config-grid">
                                    <div className="config-item">
                                        <label>Minimum Order Value</label>
                                        <div className="config-value">€{config.minOrderValueForCredits.toFixed(2)}</div>
                                        <p className="config-desc">Orders must be at least this amount to use credits</p>
                                    </div>
                                    <div className="config-item">
                                        <label>Maximum Credit Percentage</label>
                                        <div className="config-value">{(config.maxCreditPercentage * 100).toFixed(0)}%</div>
                                        <p className="config-desc">
                                            Max % of order payable with credits
                                            <br />
                                            (€100 order → max €{(config.maxCreditPercentage * 100).toFixed(0)} from credits)
                                        </p>
                                    </div>
                                    <div className="config-item">
                                        <label>Credits with Discounts</label>
                                        <div className={`config-badge ${config.allowCreditsWithDiscounts ? 'enabled' : 'disabled'}`}>
                                            {config.allowCreditsWithDiscounts ? '✅ Allowed' : '❌ Not Allowed'}
                                        </div>
                                        <p className="config-desc">Can users combine credits with discount codes?</p>
                                    </div>
                                    <div className="config-item">
                                        <label>System Status</label>
                                        <div className={`config-badge ${config.creditsEnabled ? 'enabled' : 'disabled'}`}>
                                            {config.creditsEnabled ? '🟢 Enabled' : '🔴 Disabled'}
                                        </div>
                                        <p className="config-desc">Global on/off switch for credit system</p>
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
                    <h3>💡 How Credit Usage Rules Work</h3>
                    <ul>
                        <li><strong>Minimum Order Value:</strong> Orders below €{config.minOrderValueForCredits.toFixed(2)} cannot use credits (anti-abuse)</li>
                        <li><strong>Maximum Percentage:</strong> Max {(config.maxCreditPercentage * 100).toFixed(0)}% of order can be paid with credits (ensures some cash payment)</li>
                        <li><strong>Example:</strong> €100 order → user can pay max €{(config.maxCreditPercentage * 100).toFixed(0)} with credits, €{(100 - config.maxCreditPercentage * 100).toFixed(0)} with Stripe</li>
                        <li><strong>Discounts Policy:</strong> {config.allowCreditsWithDiscounts ? 'Users can combine credits AND discount codes' : 'Users must choose: either credits OR discount (not both)'}</li>
                        <li><strong>Global Switch:</strong> If disabled, credits cannot be earned (referrals) or used (checkout) anywhere</li>
                    </ul>

                    <div className="warning-box">
                        <strong>⚠️ Important:</strong> Changes take effect immediately. Frontend will fetch new values automatically.
                        Backend ALWAYS validates using these rules (frontend cannot bypass).
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminCreditUsageConfig;
