import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Button } from '../../components/ui';
import xpConfigService, { type XpConfigDto } from '../../services/xpConfigService';
import { useErrors } from '../../context/ErrorContext';
import './AdminXpConfig.css';
import { logInfo, logError } from '../../services/logger';

// Available icons for XP sources
const AVAILABLE_ICONS = [
    '⭐', '💎', '🎯', '🏆', '🎁', '💰', '🎮', '🔥',
    '⚡', '✨', '🌟', '💫', '🎪', '🎨', '🎭', '🎬',
    '📸', '🖼️', '💬', '📝', '✍️', '📬', '📧', '🎂',
    '🎉', '🎊', '👥', '🤝', '💝', '🎓', '📚', '🔖'
];

const AdminXpConfig: React.FC = () => {
    const { addError } = useErrors();
    const [configs, setConfigs] = useState<XpConfigDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editedValues, setEditedValues] = useState<Record<number, Partial<XpConfigDto>>>({});
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        config: XpConfigDto | null;
        action: 'disable' | 'enable' | null;
    }>({ isOpen: false, config: null, action: null });

    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        try {
            setLoading(true);
            logInfo('🔄 Loading XP configurations...');
            const data = await xpConfigService.getAllXpConfigs();
            setConfigs(data);
            logInfo(`✅ Loaded ${data.length} XP configurations`);
        } catch (error) {
            logError('❌ Failed to load XP configurations:', error);
            addError({
                message: 'Failed to load XP configurations. Please try again.',
                severity: 'error',
                recoverable: true,
                action: loadConfigs
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (config: XpConfigDto) => {
        setEditingId(config.id);
        setEditedValues({
            ...editedValues,
            [config.id]: {
                xpAmount: config.xpAmount,
                isEnabled: config.isEnabled,
                maxPerDay: config.maxPerDay,
                description: config.description,
                icon: config.icon,
            }
        });
    };

    const handleCancel = (id: number) => {
        setEditingId(null);
        setEditedValues(prev => {
            const updated = { ...prev };
            delete updated[id];
            return updated;
        });
    };

    const handleSave = async (config: XpConfigDto) => {
        try {
            const edits = editedValues[config.id];
            if (!edits) {
                setEditingId(null);
                return;
            }

            logInfo(`💾 Updating XP config: ${config.sourceCode}`);

            const updateRequest = {
                sourceName: config.sourceName,
                sourceNameEn: config.sourceNameEn,
                sourceNameDe: config.sourceNameDe,
                xpAmount: edits.xpAmount ?? config.xpAmount,
                isEnabled: edits.isEnabled ?? config.isEnabled,
                frequencyLimit: config.frequencyLimit,
                maxPerDay: edits.maxPerDay ?? config.maxPerDay,
                maxTotal: config.maxTotal,
                description: edits.description ?? config.description,
                descriptionEn: config.descriptionEn,
                descriptionDe: config.descriptionDe,
                displayOrder: config.displayOrder,
                icon: edits.icon ?? config.icon,
            };

            await xpConfigService.updateXpConfig(config.id, updateRequest);

            logInfo(`✅ XP config updated: ${config.sourceCode}`);
            addError({
                message: `Successfully updated ${config.sourceName}`,
                severity: 'info',
                recoverable: false
            });
            setEditingId(null);
            setEditedValues(prev => {
                const updated = { ...prev };
                delete updated[config.id];
                return updated;
            });
            await loadConfigs();
        } catch (error) {
            logError(`❌ Failed to update XP config ${config.sourceCode}:`, error);
            addError({
                message: 'Failed to update configuration. Please try again.',
                severity: 'error',
                recoverable: true,
                action: () => handleSave(config)
            });
        }
    };

    const handleToggleRequest = (config: XpConfigDto) => {
        // Show confirmation dialog for critical actions
        setConfirmDialog({
            isOpen: true,
            config: config,
            action: config.isEnabled ? 'disable' : 'enable'
        });
    };

    const handleToggleConfirm = async () => {
        const { config } = confirmDialog;
        if (!config) return;

        try {
            logInfo(`🔄 Toggling XP config: ${config.sourceCode} to ${!config.isEnabled}`);
            await xpConfigService.toggleXpSource(config.id, !config.isEnabled);
            logInfo(`✅ Toggled successfully`);
            addError({
                message: `Successfully ${config.isEnabled ? 'disabled' : 'enabled'} ${config.sourceName}`,
                severity: 'info',
                recoverable: false
            });
            setConfirmDialog({ isOpen: false, config: null, action: null });
            await loadConfigs();
        } catch (error) {
            logError(`❌ Failed to toggle XP config ${config.sourceCode}:`, error);
            addError({
                message: 'Failed to toggle configuration. Please try again.',
                severity: 'error',
                recoverable: true,
                action: handleToggleConfirm
            });
            setConfirmDialog({ isOpen: false, config: null, action: null });
        }
    };

    const handleToggleCancel = () => {
        setConfirmDialog({ isOpen: false, config: null, action: null });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleValueChange = (id: number, field: keyof XpConfigDto, value: any) => {
        setEditedValues(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getEditedValue = (id: number, field: keyof XpConfigDto, originalValue: any) => {
        return editedValues[id]?.[field] ?? originalValue;
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="loading-spinner">Loading XP configurations...</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="XP configuration">
            <div className="admin-xp-config">
                <div className="configs-list">
                    {configs.map((config) => {
                        const isEditing = editingId === config.id;
                        const currentXpAmount = getEditedValue(config.id, 'xpAmount', config.xpAmount) as number;
                        const currentMaxPerDay = getEditedValue(config.id, 'maxPerDay', config.maxPerDay) as number | undefined;
                        const currentDescription = getEditedValue(config.id, 'description', config.description) as string | undefined;
                        const currentIcon = getEditedValue(config.id, 'icon', config.icon) as string | undefined;

                        return (
                            <div key={config.id} className={`config-row ${!config.isEnabled ? 'disabled' : ''}`}>
                                <div className="config-icon">
                                    {config.icon || '⭐'}
                                </div>

                                <div className="config-info">
                                    <div className="config-header">
                                        <h3>{config.sourceName}</h3>
                                        <span className="source-code">{config.sourceCode}</span>
                                    </div>
                                    <p className="config-description">{config.description}</p>
                                    <div className="config-meta">
                                        <span className="frequency-badge">{config.frequencyLimit || 'UNLIMITED'}</span>
                                        {config.maxPerDay && (
                                            <span className="limit-badge">Max {config.maxPerDay}/day</span>
                                        )}
                                    </div>
                                </div>

                                <div className="config-controls">
                                    {isEditing ? (
                                        <div className="edit-form">
                                            <div className="form-group">
                                                <label>Icon:</label>
                                                <div className="icon-picker">
                                                    {AVAILABLE_ICONS.map((icon) => (
                                                        <button
                                                            key={icon}
                                                            type="button"
                                                            className={`icon-option ${currentIcon === icon ? 'selected' : ''}`}
                                                            onClick={() => handleValueChange(config.id, 'icon', icon)}
                                                            title={icon}
                                                        >
                                                            {icon}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>XP Amount:</label>
                                                <input
                                                    type="number"
                                                    value={currentXpAmount}
                                                    onChange={(e) => handleValueChange(
                                                        config.id,
                                                        'xpAmount',
                                                        parseInt(e.target.value) || 0
                                                    )}
                                                    className="xp-input"
                                                />
                                            </div>

                                            {config.frequencyLimit === 'MAX_PER_DAY' && (
                                                <div className="form-group">
                                                    <label>Max per day:</label>
                                                    <input
                                                        type="number"
                                                        value={currentMaxPerDay || 0}
                                                        onChange={(e) => handleValueChange(
                                                            config.id,
                                                            'maxPerDay',
                                                            parseInt(e.target.value) || 0
                                                        )}
                                                        className="xp-input"
                                                    />
                                                </div>
                                            )}

                                            <div className="form-group full-width">
                                                <label>Description (SK):</label>
                                                <textarea
                                                    value={currentDescription || ''}
                                                    onChange={(e) => handleValueChange(
                                                        config.id,
                                                        'description',
                                                        e.target.value
                                                    )}
                                                    className="description-textarea"
                                                    rows={2}
                                                />
                                            </div>

                                            <div className="button-group">
                                                <Button onClick={() => handleSave(config)} variant="primary">
                                                    💾 Save
                                                </Button>
                                                <Button onClick={() => handleCancel(config.id)} variant="secondary">
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="display-controls">
                                            <div className="xp-display">
                                                <span className="xp-value">{config.xpAmount}</span>
                                                <span className="xp-label">XP</span>
                                            </div>
                                            <div className="button-group">
                                                <Button onClick={() => handleEdit(config)} variant="secondary" size="sm">
                                                    ✏️ Edit
                                                </Button>
                                                <Button
                                                    onClick={() => handleToggleRequest(config)}
                                                    variant={config.isEnabled ? 'secondary' : 'primary'}
                                                    size="sm"
                                                >
                                                    {config.isEnabled ? '🔴 Disable' : '🟢 Enable'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {config.updatedBy && (
                                    <div className="config-footer">
                                        Last updated by {config.updatedBy.username} on{' '}
                                        {new Date(config.updatedAt).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="info-section">
                    <h3>💡 How XP Earning Works</h3>
                    <ul>
                        <li><strong>UNLIMITED:</strong> Users can earn XP unlimited times (e.g., PURCHASE)</li>
                        <li><strong>ONCE_PER_PRODUCT:</strong> Users can earn XP only once per product (e.g., REVIEW, GALLERY_UPLOAD)</li>
                        <li><strong>MAX_PER_DAY:</strong> Users can earn XP up to X times per day (e.g., FORUM_POST: 10/day)</li>
                        <li><strong>ONCE_LIFETIME:</strong> Users can earn XP only once ever (e.g., EMAIL_VERIFICATION)</li>
                        <li><strong>ONCE_PER_YEAR:</strong> Users can earn XP once per year (e.g., BIRTHDAY_BONUS)</li>
                    </ul>
                </div>

                {/* Confirmation Dialog */}
                {confirmDialog.isOpen && confirmDialog.config && (
                    <div className="confirm-dialog-overlay" onClick={handleToggleCancel}>
                        <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                            <div className="confirm-dialog-header">
                                <h3>⚠️ Confirm Action</h3>
                            </div>
                            <div className="confirm-dialog-body">
                                <p>
                                    Are you sure you want to <strong>{confirmDialog.action}</strong> the XP source:
                                </p>
                                <p className="confirm-dialog-source">
                                    {confirmDialog.config.icon} <strong>{confirmDialog.config.sourceName}</strong>
                                </p>
                                {confirmDialog.action === 'disable' && (
                                    <p className="confirm-dialog-warning">
                                        Users will no longer be able to earn XP from this source until you re-enable it.
                                    </p>
                                )}
                            </div>
                            <div className="confirm-dialog-footer">
                                <Button onClick={handleToggleCancel} variant="secondary">
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleToggleConfirm}
                                    variant={confirmDialog.action === 'disable' ? 'danger' : 'primary'}
                                >
                                    {confirmDialog.action === 'disable' ? '🔴 Disable' : '🟢 Enable'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminXpConfig;
