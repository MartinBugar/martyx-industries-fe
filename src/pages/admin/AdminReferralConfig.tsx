import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Button } from '../../components/ui';
import { referralConfigService, type ReferralConfigDto } from '../../services/referralConfigService';
import { useErrors } from '../../context/ErrorContext';
import './AdminReferralConfig.css';

const AdminReferralConfig: React.FC = () => {
    const { addError } = useErrors();
    const [config, setConfig] = useState<ReferralConfigDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedValues, setEditedValues] = useState<Partial<ReferralConfigDto>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            console.log('🔄 Loading referral configuration...');
            const data = await referralConfigService.getConfig();
            setConfig(data);
            console.log('✅ Loaded referral configuration');
        } catch (error) {
            console.error('❌ Failed to load referral configuration:', error);
            addError({
                message: 'Failed to load referral configuration. Please try again.',
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
            firstOrderReward: config.firstOrderReward,
            bonusReward: config.bonusReward,
            welcomeDiscountAmount: config.welcomeDiscountAmount,
            bonusOrderThreshold: config.bonusOrderThreshold,
            minOrderForDiscount: config.minOrderForDiscount,
            maxReferralsPerMonth: config.maxReferralsPerMonth,
            pendingPeriodDays: config.pendingPeriodDays
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
            console.log('💾 Updating referral configuration...');

            const updateRequest = {
                firstOrderReward: editedValues.firstOrderReward ?? config.firstOrderReward,
                bonusReward: editedValues.bonusReward ?? config.bonusReward,
                welcomeDiscountAmount: editedValues.welcomeDiscountAmount ?? config.welcomeDiscountAmount,
                bonusOrderThreshold: editedValues.bonusOrderThreshold ?? config.bonusOrderThreshold,
                minOrderForDiscount: editedValues.minOrderForDiscount ?? config.minOrderForDiscount,
                maxReferralsPerMonth: editedValues.maxReferralsPerMonth ?? config.maxReferralsPerMonth,
                pendingPeriodDays: editedValues.pendingPeriodDays ?? config.pendingPeriodDays
            };

            const updated = await referralConfigService.updateConfig(updateRequest);
            setConfig(updated);
            setIsEditing(false);
            setEditedValues({});

            console.log('✅ Referral configuration updated');
            addError({
                message: 'Successfully updated referral configuration',
                severity: 'info',
                recoverable: false
            });
        } catch (error) {
            console.error('❌ Failed to update referral configuration:', error);
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

    const handleValueChange = (field: keyof ReferralConfigDto, value: any) => {
        setEditedValues(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const getEditedValue = (field: keyof ReferralConfigDto, originalValue: any) => {
        return editedValues[field] ?? originalValue;
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="loading-spinner">Loading referral configuration...</div>
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
        <AdminLayout title="Referral Program Configuration">
            <div className="admin-referral-config">
                {/* Configuration Card */}
                <div className="config-card">
                    {isEditing ? (
                        <>
                            {/* Edit Mode */}
                            <div className="config-section">
                                <h3 className="section-title">💰 Reward Amounts</h3>
                                <div className="config-grid">
                                    <div className="form-group">
                                        <label>First Order Reward (€)</label>
                                        <p className="help-text">Paid to referrer when friend places first paid order</p>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={getEditedValue('firstOrderReward', config.firstOrderReward)}
                                            onChange={(e) => handleValueChange('firstOrderReward', parseFloat(e.target.value) || 0)}
                                            className="config-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Bonus Reward (€)</label>
                                        <p className="help-text">Bonus paid when friend completes threshold orders</p>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={getEditedValue('bonusReward', config.bonusReward)}
                                            onChange={(e) => handleValueChange('bonusReward', parseFloat(e.target.value) || 0)}
                                            className="config-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Welcome Discount (€)</label>
                                        <p className="help-text">Discount code amount for new referred user</p>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={getEditedValue('welcomeDiscountAmount', config.welcomeDiscountAmount)}
                                            onChange={(e) => handleValueChange('welcomeDiscountAmount', parseFloat(e.target.value) || 0)}
                                            className="config-input"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="config-section">
                                <h3 className="section-title">🎯 Thresholds & Limits</h3>
                                <div className="config-grid">
                                    <div className="form-group">
                                        <label>Bonus Order Threshold</label>
                                        <p className="help-text">Number of orders required for bonus reward</p>
                                        <input
                                            type="number"
                                            min="1"
                                            value={getEditedValue('bonusOrderThreshold', config.bonusOrderThreshold)}
                                            onChange={(e) => handleValueChange('bonusOrderThreshold', parseInt(e.target.value) || 1)}
                                            className="config-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Min Order for Discount (€)</label>
                                        <p className="help-text">Minimum order amount to use welcome discount</p>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={getEditedValue('minOrderForDiscount', config.minOrderForDiscount)}
                                            onChange={(e) => handleValueChange('minOrderForDiscount', parseFloat(e.target.value) || 0)}
                                            className="config-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Max Referrals per Month</label>
                                        <p className="help-text">Anti-fraud limit per user</p>
                                        <input
                                            type="number"
                                            min="1"
                                            value={getEditedValue('maxReferralsPerMonth', config.maxReferralsPerMonth)}
                                            onChange={(e) => handleValueChange('maxReferralsPerMonth', parseInt(e.target.value) || 1)}
                                            className="config-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Pending Period (days)</label>
                                        <p className="help-text">Days to wait before clearing pending rewards</p>
                                        <input
                                            type="number"
                                            min="0"
                                            value={getEditedValue('pendingPeriodDays', config.pendingPeriodDays)}
                                            onChange={(e) => handleValueChange('pendingPeriodDays', parseInt(e.target.value) || 0)}
                                            className="config-input"
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
                                <h3 className="section-title">💰 Reward Amounts</h3>
                                <div className="config-grid">
                                    <div className="config-item">
                                        <label>First Order Reward</label>
                                        <div className="config-value">€{config.firstOrderReward.toFixed(2)}</div>
                                        <p className="config-desc">Paid when friend places first order</p>
                                    </div>
                                    <div className="config-item">
                                        <label>Bonus Reward</label>
                                        <div className="config-value">€{config.bonusReward.toFixed(2)}</div>
                                        <p className="config-desc">Paid after {config.bonusOrderThreshold} orders</p>
                                    </div>
                                    <div className="config-item">
                                        <label>Welcome Discount</label>
                                        <div className="config-value">€{config.welcomeDiscountAmount.toFixed(2)}</div>
                                        <p className="config-desc">Discount code for new users</p>
                                    </div>
                                </div>
                            </div>

                            <div className="config-section">
                                <h3 className="section-title">🎯 Thresholds & Limits</h3>
                                <div className="config-grid">
                                    <div className="config-item">
                                        <label>Bonus Threshold</label>
                                        <div className="config-value">{config.bonusOrderThreshold} orders</div>
                                        <p className="config-desc">Orders required for bonus</p>
                                    </div>
                                    <div className="config-item">
                                        <label>Min Order Amount</label>
                                        <div className="config-value">€{config.minOrderForDiscount.toFixed(2)}</div>
                                        <p className="config-desc">Minimum to use discount</p>
                                    </div>
                                    <div className="config-item">
                                        <label>Monthly Limit</label>
                                        <div className="config-value">{config.maxReferralsPerMonth} refs</div>
                                        <p className="config-desc">Max referrals per user</p>
                                    </div>
                                    <div className="config-item">
                                        <label>Pending Period</label>
                                        <div className="config-value">{config.pendingPeriodDays} days</div>
                                        <p className="config-desc">Fraud prevention window</p>
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
                            {new Date(config.updatedAt).toLocaleString()}
                        </div>
                    )}
                </div>

                {/* Info Section */}
                <div className="info-section">
                    <h3>💡 How Referral Program Works</h3>
                    <ul>
                        <li><strong>First Order Reward:</strong> Referrer gets €{config.firstOrderReward.toFixed(2)} (cash credit) when friend pays their first order</li>
                        <li><strong>Bonus Reward:</strong> Referrer gets €{config.bonusReward.toFixed(2)} bonus when friend completes {config.bonusOrderThreshold} orders</li>
                        <li><strong>Welcome Discount:</strong> Friend gets €{config.welcomeDiscountAmount.toFixed(2)} discount code (min order €{config.minOrderForDiscount.toFixed(2)})</li>
                        <li><strong>Pending Period:</strong> Rewards are pending for {config.pendingPeriodDays} days to prevent fraud/refunds</li>
                        <li><strong>Monthly Limit:</strong> Anti-fraud protection - max {config.maxReferralsPerMonth} referrals per user per month</li>
                    </ul>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminReferralConfig;
