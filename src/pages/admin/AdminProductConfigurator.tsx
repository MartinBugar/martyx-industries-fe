/// <reference path="../../global.d.ts" />
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, Plus, Trash2, Edit2, Upload, Check, X, AlertTriangle, Settings, Package, Box, FileArchive, FileJson, Download } from 'lucide-react';
import AdminLayout from './AdminLayout';
import ProductNavTabs from '../../components/admin/ProductNavTabs';
import ConfirmModal from '../../components/common/ConfirmModal';
import './AdminUsers.css';
import './AdminProductConfigurator.css';
import { adminProductsService, type BaseProduct } from '../../services/adminProductsService';
import { configuratorService } from '../../services/configuratorService';
import type { Configurator, ConfiguratorSlot, ConfiguratorOption, UploadState, ReadinessInfo } from '../../types/configurator';

// Types for confirm modal
interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  variant: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  isLoading?: boolean;
}

/**
 * Toggle Switch Component
 */
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}> = ({ checked, onChange, disabled, size = 'md' }) => (
  <div
    onClick={disabled ? undefined : onChange}
    className={`cfg-toggle cfg-toggle-${size} ${checked ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
    role="switch"
    aria-checked={checked}
    tabIndex={disabled ? -1 : 0}
    onKeyDown={(e) => {
      if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onChange();
      }
    }}
  >
    <div className="cfg-toggle-thumb" />
  </div>
);

/**
 * Progress Stepper Component - replaces ReadinessChecklist
 */
const ProgressStepper: React.FC<{
  readiness: ReadinessInfo;
  enabled: boolean;
  onToggleEnabled: () => void;
  toggleDisabled: boolean;
}> = ({ readiness, enabled, onToggleEnabled, toggleDisabled }) => {
  const steps = [
    { key: 'baseModel', label: 'Base Model', completed: readiness.hasBaseModel },
    { key: 'slots', label: 'Slots', completed: readiness.hasSlots, detail: readiness.totalSlots > 0 ? `(${readiness.totalSlots})` : undefined },
    { key: 'options', label: 'Options', completed: readiness.totalOptions > 0, detail: readiness.totalOptions > 0 ? `(${readiness.totalOptions})` : undefined },
    { key: 'glbs', label: 'GLB Files', completed: readiness.hasOptionsWithGlb, detail: readiness.totalOptions > 0 ? `(${readiness.optionsWithGlb}/${readiness.totalOptions})` : undefined },
  ];

  const completedCount = steps.filter(s => s.completed).length;

  return (
    <div className={`cfg-progress ${readiness.ready ? 'ready' : 'not-ready'}`}>
      <div className="cfg-progress-header">
        <div className="cfg-progress-info">
          <div className="cfg-progress-bar-container">
            <div className="cfg-progress-bar" style={{ width: `${(completedCount / steps.length) * 100}%` }} />
          </div>
          <span className="cfg-progress-text">{completedCount}/{steps.length} steps completed</span>
        </div>
        <div className="cfg-progress-toggle">
          <span className={`cfg-status-label ${enabled ? 'enabled' : 'disabled'}`}>
            {enabled ? 'ENABLED' : 'DISABLED'}
          </span>
          <ToggleSwitch
            checked={enabled}
            onChange={onToggleEnabled}
            disabled={toggleDisabled || (!readiness.ready && !enabled)}
            size="sm"
          />
        </div>
      </div>
      <div className="cfg-progress-steps">
        {steps.map((step, index) => (
          <div key={step.key} className={`cfg-step ${step.completed ? 'completed' : 'pending'}`}>
            <div className="cfg-step-indicator">
              {step.completed ? <Check size={12} /> : <span>{index + 1}</span>}
            </div>
            <span className="cfg-step-label">
              {step.label}
              {step.detail && <span className="cfg-step-detail">{step.detail}</span>}
            </span>
          </div>
        ))}
      </div>
      {!readiness.ready && !enabled && readiness.missingItems.length > 0 && (
        <div className="cfg-progress-warning">
          <AlertTriangle size={14} />
          <span>Complete all steps to enable the configurator</span>
        </div>
      )}
    </div>
  );
};

/**
 * Collapsible Section Component
 */
const CollapsibleSection: React.FC<{
  title: string;
  icon?: React.ReactNode;
  badge?: string | number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  actions?: React.ReactNode;
  variant?: 'default' | 'danger';
}> = ({ title, icon, badge, defaultExpanded = true, children, actions, variant = 'default' }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={`cfg-section ${variant === 'danger' ? 'cfg-section-danger' : ''}`}>
      <div className="cfg-section-header" onClick={() => setExpanded(!expanded)}>
        <div className="cfg-section-title">
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          {icon}
          <span>{title}</span>
          {badge !== undefined && <span className="cfg-section-badge">{badge}</span>}
        </div>
        {actions && <div className="cfg-section-actions" onClick={e => e.stopPropagation()}>{actions}</div>}
      </div>
      {expanded && <div className="cfg-section-content">{children}</div>}
    </div>
  );
};

/**
 * Asset Card Component - for Base Model and Base Digital File
 */
const AssetCard: React.FC<{
  type: 'model' | 'file';
  title: string;
  fileName?: string;
  fileSize?: number;
  fileUrl?: string;
  onUpload: (file: File) => void;
  onDelete: () => void;
  uploading: boolean;
  uploadProgress: number;
  deleting: boolean;
  accept: string;
  hint: string;
  previewElement?: React.ReactNode;
}> = ({ type, title, fileName, fileSize, fileUrl, onUpload, onDelete, uploading, uploadProgress, deleting, accept, hint, previewElement }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = '';
    }
  };

  return (
    <div className="cfg-asset-card">
      <div className="cfg-asset-header">
        {type === 'model' ? <Box size={20} /> : <FileArchive size={20} />}
        <span className="cfg-asset-title">{title}</span>
      </div>

      {fileName ? (
        <div className="cfg-asset-info">
          {previewElement}
          <div className="cfg-asset-file">
            <span className="cfg-asset-filename">{fileName}</span>
            {fileSize && (
              <span className="cfg-asset-size">({configuratorService.formatFileSize(fileSize)})</span>
            )}
          </div>
          <div className="cfg-asset-actions">
            {fileUrl && (
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary">
                {type === 'model' ? 'View' : 'Download'}
              </a>
            )}
            <button
              className={`btn btn-sm btn-outline-danger ${deleting ? 'btn-loading' : ''}`}
              onClick={onDelete}
              disabled={deleting}
            >
              {deleting ? '...' : <Trash2 size={14} />}
            </button>
          </div>
        </div>
      ) : (
        <div
          className="cfg-asset-upload"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
          onDragLeave={(e) => { e.currentTarget.classList.remove('dragover'); }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) onUpload(file);
          }}
        >
          <Upload size={24} />
          <span>Click or drag to upload</span>
          <span className="cfg-asset-hint">{hint}</span>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {uploading && (
        <div className="cfg-asset-progress">
          <div className="cfg-asset-progress-bar">
            <div className="cfg-asset-progress-fill" style={{ width: `${uploadProgress}%` }} />
          </div>
          <span>{uploadProgress}%</span>
        </div>
      )}
    </div>
  );
};

/**
 * Option Card Component - replaces table row
 */
const OptionCard: React.FC<{
  option: ConfiguratorOption;
  isDefault: boolean;
  currencySymbol: string;
  localPrice: number | undefined;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  onUploadGlb: (file: File) => void;
  onUploadZip: (file: File) => void;
  onDeleteZip: () => void;
  onPriceChange: (price: number) => void;
  actionLoading: {
    deleteOption: number | null;
    setDefault: number | null;
    uploadOptionGlb: number | null;
    uploadOptionDigitalFile: number | null;
    deleteOptionDigitalFile: number | null;
  };
}> = ({
  option,
  isDefault,
  currencySymbol,
  localPrice,
  onEdit,
  onDelete,
  onSetDefault,
  onUploadGlb,
  onUploadZip,
  onDeleteZip,
  onPriceChange,
  actionLoading,
}) => {
  const glbInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const isDeleting = actionLoading.deleteOption === option.id;
  const isSettingDefault = actionLoading.setDefault === option.id;
  const isUploadingGlb = actionLoading.uploadOptionGlb === option.id;
  const isUploadingZip = actionLoading.uploadOptionDigitalFile === option.id;
  const isDeletingZip = actionLoading.deleteOptionDigitalFile === option.id;

  // Use local price if changed, otherwise use option price
  const displayPrice = localPrice !== undefined ? localPrice : option.priceModifier;
  const hasUnsavedPrice = localPrice !== undefined && localPrice !== option.priceModifier;

  return (
    <div className={`cfg-option-card ${isDefault ? 'is-default' : ''}`}>
      <div className="cfg-option-header">
        <div className="cfg-option-info">
          <span className="cfg-option-name">{option.displayName}</span>
          <span className="cfg-option-key">{option.optionKey}</span>
        </div>
        <div className="cfg-option-badges">
          <span className={`cfg-badge ${option.glbUrl ? 'cfg-badge-success' : 'cfg-badge-warning'}`}>
            {option.glbUrl ? <Check size={10} /> : <X size={10} />}
            GLB
          </span>
          <span className={`cfg-badge ${option.digitalFileUrl ? 'cfg-badge-success' : 'cfg-badge-muted'}`}>
            {option.digitalFileUrl ? <Check size={10} /> : <X size={10} />}
            ZIP
          </span>
        </div>
      </div>

      <div className="cfg-option-body">
        <div className="cfg-option-row">
          <label>3D Model (GLB)</label>
          <div className="cfg-option-file">
            {option.glbUrl ? (
              <>
                <a href={option.glbUrl} target="_blank" rel="noopener noreferrer" className="cfg-file-link">
                  {option.glbFileName || 'View'}
                </a>
                <button
                  className="cfg-file-action"
                  onClick={() => glbInputRef.current?.click()}
                  disabled={isUploadingGlb}
                >
                  {isUploadingGlb ? '...' : 'Replace'}
                </button>
              </>
            ) : (
              <button
                className="btn btn-sm btn-warning"
                onClick={() => glbInputRef.current?.click()}
                disabled={isUploadingGlb}
              >
                {isUploadingGlb ? 'Uploading...' : 'Upload GLB'}
              </button>
            )}
            <input
              ref={glbInputRef}
              type="file"
              accept=".glb"
              onChange={(e) => e.target.files?.[0] && onUploadGlb(e.target.files[0])}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div className="cfg-option-row">
          <label>Digital File (ZIP)</label>
          <div className="cfg-option-file">
            {option.digitalFileUrl ? (
              <>
                <a href={option.digitalFileUrl} target="_blank" rel="noopener noreferrer" className="cfg-file-link" title={option.digitalFileName || 'Download'}>
                  {option.digitalFileName || 'Download'}
                </a>
                <button
                  className="cfg-file-action"
                  onClick={() => zipInputRef.current?.click()}
                  disabled={isUploadingZip}
                >
                  Replace
                </button>
                <button
                  className="cfg-file-action cfg-file-delete"
                  onClick={onDeleteZip}
                  disabled={isDeletingZip}
                >
                  {isDeletingZip ? '...' : <X size={12} />}
                </button>
              </>
            ) : (
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => zipInputRef.current?.click()}
                disabled={isUploadingZip}
              >
                {isUploadingZip ? 'Uploading...' : 'Upload ZIP'}
              </button>
            )}
            <input
              ref={zipInputRef}
              type="file"
              accept=".zip"
              onChange={(e) => e.target.files?.[0] && onUploadZip(e.target.files[0])}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div className="cfg-option-row">
          <label>
            Price Modifier
            {hasUnsavedPrice && <span className="cfg-unsaved-dot" title="Unsaved change" />}
          </label>
          <div className="cfg-option-price">
            <span className="cfg-price-currency">{currencySymbol}</span>
            <input
              type="number"
              step="0.01"
              value={displayPrice}
              onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
              className={`cfg-price-input ${hasUnsavedPrice ? 'has-unsaved' : ''}`}
            />
          </div>
        </div>
      </div>

      <div className="cfg-option-footer">
        <div className="cfg-option-default">
          <input
            type="radio"
            checked={isDefault}
            onChange={onSetDefault}
            disabled={isSettingDefault}
            id={`default-${option.id}`}
          />
          <label htmlFor={`default-${option.id}`}>
            {isSettingDefault ? 'Setting...' : 'Default'}
          </label>
        </div>
        <div className="cfg-option-actions">
          <button className="btn btn-sm btn-secondary" onClick={onEdit}>
            <Edit2 size={14} />
          </button>
          <button
            className={`btn btn-sm btn-outline-danger ${isDeleting ? 'btn-loading' : ''}`}
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? '...' : <Trash2 size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Slot Card Component
 */
const SlotCard: React.FC<{
  slot: ConfiguratorSlot;
  currencySymbol: string;
  onEditSlot: () => void;
  onDeleteSlot: () => void;
  onAddOption: () => void;
  onEditOption: (option: ConfiguratorOption) => void;
  onDeleteOption: (optionId: number) => void;
  onSetDefaultOption: (optionId: number) => void;
  onUploadOptionGlb: (optionId: number, file: File) => void;
  onUploadOptionZip: (optionId: number, file: File) => void;
  onDeleteOptionZip: (optionId: number) => void;
  onOptionPriceChange: (optionId: number, price: number) => void;
  pendingPriceChanges: Record<number, number>;
  actionLoading: {
    deleteSlot: number | null;
    deleteOption: number | null;
    setDefault: number | null;
    uploadOptionGlb: number | null;
    uploadOptionDigitalFile: number | null;
    deleteOptionDigitalFile: number | null;
  };
}> = ({
  slot,
  currencySymbol,
  onEditSlot,
  onDeleteSlot,
  onAddOption,
  onEditOption,
  onDeleteOption,
  onSetDefaultOption,
  onUploadOptionGlb,
  onUploadOptionZip,
  onDeleteOptionZip,
  onOptionPriceChange,
  pendingPriceChanges,
  actionLoading,
}) => {
  const [expanded, setExpanded] = useState(true);
  const isDeleting = actionLoading.deleteSlot === slot.id;
  const optionsWithGlb = slot.options.filter(o => o.glbUrl).length;

  return (
    <div className="cfg-slot-card">
      <div className="cfg-slot-header" onClick={() => setExpanded(!expanded)}>
        <div className="cfg-slot-info">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="cfg-slot-name">{slot.displayName}</span>
          <span className="cfg-slot-key">({slot.slotKey})</span>
          <span className="cfg-slot-stats">
            {slot.options.length} options
            {slot.options.length > 0 && (
              <span className={optionsWithGlb === slot.options.length ? 'text-success' : 'text-warning'}>
                ({optionsWithGlb}/{slot.options.length} GLB)
              </span>
            )}
          </span>
        </div>
        <div className="cfg-slot-actions" onClick={e => e.stopPropagation()}>
          <button className="btn btn-sm btn-secondary" onClick={onEditSlot}>
            <Edit2 size={14} />
          </button>
          <button
            className={`btn btn-sm btn-outline-danger ${isDeleting ? 'btn-loading' : ''}`}
            onClick={onDeleteSlot}
            disabled={isDeleting}
          >
            {isDeleting ? '...' : <Trash2 size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="cfg-slot-body">
          {slot.options.length === 0 ? (
            <div className="cfg-slot-empty">
              <p>No options defined for this slot.</p>
              <button className="btn btn-sm btn-primary" onClick={onAddOption}>
                <Plus size={14} /> Add First Option
              </button>
            </div>
          ) : (
            <>
              <div className="cfg-options-grid">
                {slot.options.map((option) => (
                  <OptionCard
                    key={option.id}
                    option={option}
                    isDefault={option.isDefault}
                    currencySymbol={currencySymbol}
                    localPrice={pendingPriceChanges[option.id]}
                    onEdit={() => onEditOption(option)}
                    onDelete={() => onDeleteOption(option.id)}
                    onSetDefault={() => onSetDefaultOption(option.id)}
                    onUploadGlb={(file) => onUploadOptionGlb(option.id, file)}
                    onUploadZip={(file) => onUploadOptionZip(option.id, file)}
                    onDeleteZip={() => onDeleteOptionZip(option.id)}
                    onPriceChange={(price) => onOptionPriceChange(option.id, price)}
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
              <button className="btn btn-sm btn-secondary cfg-add-option-btn" onClick={onAddOption}>
                <Plus size={14} /> Add Option
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Admin page for managing 3D product configurator
 */
const AdminProductConfigurator: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<BaseProduct | null>(null);
  const [configurator, setConfigurator] = useState<Configurator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
  });
  const [digitalFileUploadState, setDigitalFileUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
  });

  // Modal states
  const [showImportModal, setShowImportModal] = useState(false);
  const [showJsonEditModal, setShowJsonEditModal] = useState(false);
  const [importJson, setImportJson] = useState('');

  // Memoized parsed JSON for display
  const parsedConfigJson = useMemo(() => {
    if (!configurator?.configurationJson) return null;
    try {
      return JSON.parse(configurator.configurationJson);
    } catch {
      return null;
    }
  }, [configurator?.configurationJson]);

  const formattedConfigJson = useMemo(() => {
    if (!configurator?.configurationJson) return '';
    try {
      return JSON.stringify(JSON.parse(configurator.configurationJson), null, 2);
    } catch {
      return configurator.configurationJson;
    }
  }, [configurator?.configurationJson]);

  // Pending changes state (for manual save)
  const [pendingPriceChanges, setPendingPriceChanges] = useState<Record<number, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  const hasUnsavedChanges = Object.keys(pendingPriceChanges).length > 0;

  // Clear pending changes when configurator reloads
  useEffect(() => {
    setPendingPriceChanges({});
  }, [configurator?.id]);

  const [editingSlot, setEditingSlot] = useState<ConfiguratorSlot | null>(null);
  const [editingOption, setEditingOption] = useState<{ slotId: number; option: ConfiguratorOption | null } | null>(null);

  // Slot modal states
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [slotFormData, setSlotFormData] = useState({
    slotKey: '',
    displayName: '',
    description: '',
    icon: '',
    mountPointsJson: '[]',
  });

  // Option modal states
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [optionSlotId, setOptionSlotId] = useState<number | null>(null);
  const [optionFormData, setOptionFormData] = useState({
    optionKey: '',
    displayName: '',
    description: '',
    priceModifier: 0,
    isDefault: false,
  });

  // Loading states for async operations
  const [actionLoading, setActionLoading] = useState<{
    createConfigurator: boolean;
    toggleEnabled: boolean;
    deleteConfigurator: boolean;
    importJson: boolean;
    deleteBaseModel: boolean;
    deleteBaseDigitalFile: boolean;
    saveSlot: boolean;
    deleteSlot: number | null;
    saveOption: boolean;
    deleteOption: number | null;
    setDefault: number | null;
    uploadOptionGlb: number | null;
    uploadOptionDigitalFile: number | null;
    deleteOptionDigitalFile: number | null;
    saveJson: boolean;
  }>({
    createConfigurator: false,
    toggleEnabled: false,
    deleteConfigurator: false,
    importJson: false,
    deleteBaseModel: false,
    deleteBaseDigitalFile: false,
    saveSlot: false,
    deleteSlot: null,
    saveOption: false,
    deleteOption: null,
    setDefault: null,
    uploadOptionGlb: null,
    uploadOptionDigitalFile: null,
    deleteOptionDigitalFile: null,
    saveJson: false,
  });

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'danger',
    onConfirm: () => {},
    isLoading: false,
  });

  // Helper to show confirm modal
  const showConfirm = useCallback((options: Omit<ConfirmModalState, 'isOpen' | 'isLoading'>) => {
    setConfirmModal({
      ...options,
      isOpen: true,
      isLoading: false,
    });
  }, []);

  // Helper to close confirm modal
  const closeConfirm = useCallback(() => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [productData, configuratorData] = await Promise.all([
        adminProductsService.getProductById(id),
        configuratorService.getConfiguratorByProductId(Number(id)),
      ]);
      setProduct(productData);
      setConfigurator(configuratorData);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-hide success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Create configurator
  const handleCreateConfigurator = async () => {
    if (!id) return;
    setActionLoading(prev => ({ ...prev, createConfigurator: true }));
    try {
      const newConfigurator = await configuratorService.createConfigurator({
        masterProductId: Number(id),
        enabled: false,
      });
      setConfigurator(newConfigurator);
      setSuccessMessage('Configurator created successfully!');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create configurator';
      setError(msg);
    } finally {
      setActionLoading(prev => ({ ...prev, createConfigurator: false }));
    }
  };

  // Toggle enabled
  const handleToggleEnabled = async () => {
    if (!configurator) return;
    setActionLoading(prev => ({ ...prev, toggleEnabled: true }));
    try {
      const updated = await configuratorService.updateConfigurator(configurator.id, {
        enabled: !configurator.enabled,
      });
      setConfigurator(updated);
      setSuccessMessage(`Configurator ${updated.enabled ? 'enabled' : 'disabled'}!`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update configurator';
      setError(msg);
    } finally {
      setActionLoading(prev => ({ ...prev, toggleEnabled: false }));
    }
  };

  // Delete configurator
  const handleDeleteConfigurator = () => {
    if (!configurator) return;
    showConfirm({
      title: 'Delete Configurator',
      message: 'Are you sure you want to delete this configurator? All slots and options will be permanently deleted.',
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          await configuratorService.deleteConfigurator(configurator.id);
          setConfigurator(null);
          setSuccessMessage('Configurator deleted successfully!');
          closeConfirm();
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Failed to delete configurator';
          setError(msg);
          closeConfirm();
        }
      },
    });
  };

  // Maximum JSON size (1MB)
  const MAX_JSON_SIZE = 1024 * 1024;

  // Handle JSON input change with size limit
  const handleJsonInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length > MAX_JSON_SIZE) {
      setError('JSON input is too large (max 1MB)');
      return;
    }
    setImportJson(value);
  };

  // Close import modal and cleanup
  const handleCloseImportModal = () => {
    setShowImportModal(false);
    setImportJson('');
  };

  // Import JSON
  const handleImportJson = async () => {
    if (!id || !importJson.trim()) return;

    if (importJson.length > MAX_JSON_SIZE) {
      setError('JSON input is too large (max 1MB)');
      return;
    }

    try {
      JSON.parse(importJson);
    } catch {
      setError('Invalid JSON syntax');
      return;
    }

    setActionLoading(prev => ({ ...prev, importJson: true }));
    try {
      const updated = await configuratorService.importConfiguration({
        masterProductId: Number(id),
        configurationJson: importJson,
      });
      setConfigurator(updated);
      handleCloseImportModal();
      setSuccessMessage('Configuration imported successfully!');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to import configuration';
      setError(msg);
    } finally {
      setActionLoading(prev => ({ ...prev, importJson: false }));
    }
  };

  // Save edited JSON (update only the configurationJson field)
  const handleSaveJson = async () => {
    if (!configurator || !importJson.trim()) return;

    if (importJson.length > MAX_JSON_SIZE) {
      setError('JSON input is too large (max 1MB)');
      return;
    }

    try {
      JSON.parse(importJson);
    } catch {
      setError('Invalid JSON syntax');
      return;
    }

    setActionLoading(prev => ({ ...prev, saveJson: true }));
    try {
      const updated = await configuratorService.updateConfigurator(configurator.id, {
        configurationJson: importJson,
      });
      setConfigurator(updated);
      setShowJsonEditModal(false);
      setImportJson('');
      setSuccessMessage('Configuration JSON updated successfully!');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update configuration';
      setError(msg);
    } finally {
      setActionLoading(prev => ({ ...prev, saveJson: false }));
    }
  };

  // Upload base model
  const handleUploadBaseModel = async (file: File) => {
    if (!configurator) return;
    const validation = await configuratorService.validateGLBFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }
    setUploadState({ uploading: true, progress: 0, error: null });
    try {
      const updated = await configuratorService.uploadBaseModel(
        configurator.id,
        file,
        (progress) => setUploadState((prev) => ({ ...prev, progress }))
      );
      setConfigurator(updated);
      setSuccessMessage('Base model uploaded successfully!');
      setUploadState({ uploading: false, progress: 100, error: null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setUploadState({ uploading: false, progress: 0, error: msg });
      setError(msg);
    }
  };

  // Delete base model
  const handleDeleteBaseModel = () => {
    // Allow delete if there's either a URL (uploaded file) or fileName (from JSON import)
    if (!configurator || (!configurator.baseModelUrl && !configurator.baseModelFileName)) return;
    showConfirm({
      title: 'Delete Base Model',
      message: 'Are you sure you want to delete the base 3D model?',
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          // If there's an actual file on server, delete it via API
          if (configurator.baseModelUrl) {
            const updated = await configuratorService.deleteBaseModel(configurator.id);
            setConfigurator(updated);
          } else {
            // If only fileName exists (from JSON import), just clear local state
            setConfigurator(prev => prev ? {
              ...prev,
              baseModelFileName: undefined,
              baseModelUrl: undefined,
              baseModelSize: undefined,
            } : null);
          }
          setSuccessMessage('Base model deleted!');
          closeConfirm();
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Failed to delete base model';
          setError(msg);
          closeConfirm();
        }
      },
    });
  };

  // Upload base digital file
  const handleUploadBaseDigitalFile = async (file: File) => {
    if (!configurator) return;
    const validation = await configuratorService.validateZIPFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }
    setDigitalFileUploadState({ uploading: true, progress: 0, error: null });
    try {
      const updated = await configuratorService.uploadBaseDigitalFile(
        configurator.id,
        file,
        (progress) => setDigitalFileUploadState((prev) => ({ ...prev, progress }))
      );
      setConfigurator(updated);
      setSuccessMessage('Base digital file uploaded successfully!');
      setDigitalFileUploadState({ uploading: false, progress: 100, error: null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setDigitalFileUploadState({ uploading: false, progress: 0, error: msg });
      setError(msg);
    }
  };

  // Delete base digital file
  const handleDeleteBaseDigitalFile = () => {
    // Allow delete if there's either a URL (uploaded file) or fileName (from JSON import)
    if (!configurator || (!configurator.baseDigitalFileUrl && !configurator.baseDigitalFileName)) return;
    showConfirm({
      title: 'Delete Base Digital File',
      message: 'Are you sure you want to delete the base digital file (ZIP)?',
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          // If there's an actual file on server, delete it via API
          if (configurator.baseDigitalFileUrl) {
            const updated = await configuratorService.deleteBaseDigitalFile(configurator.id);
            setConfigurator(updated);
          } else {
            // If only fileName exists (from JSON import), just clear local state
            setConfigurator(prev => prev ? {
              ...prev,
              baseDigitalFileName: undefined,
              baseDigitalFileUrl: undefined,
              baseDigitalFileSize: undefined,
            } : null);
          }
          setSuccessMessage('Base digital file deleted!');
          closeConfirm();
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Failed to delete base digital file';
          setError(msg);
          closeConfirm();
        }
      },
    });
  };

  // Upload option digital file
  const handleUploadOptionDigitalFile = async (optionId: number, file: File) => {
    const validation = await configuratorService.validateZIPFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }
    setActionLoading(prev => ({ ...prev, uploadOptionDigitalFile: optionId }));
    try {
      await configuratorService.uploadOptionDigitalFile(optionId, file);
      await loadData();
      setSuccessMessage('Digital file uploaded!');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setError(msg);
    } finally {
      setActionLoading(prev => ({ ...prev, uploadOptionDigitalFile: null }));
    }
  };

  // Delete option digital file
  const handleDeleteOptionDigitalFile = (optionId: number) => {
    showConfirm({
      title: 'Delete Digital File',
      message: 'Are you sure you want to delete this digital file (ZIP)?',
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          await configuratorService.deleteOptionDigitalFile(optionId);
          await loadData();
          setSuccessMessage('Digital file deleted!');
          closeConfirm();
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Failed to delete digital file';
          setError(msg);
          closeConfirm();
        }
      },
    });
  };

  // Upload option GLB
  const handleUploadOptionGlb = async (optionId: number, file: File) => {
    const validation = await configuratorService.validateGLBFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }
    setActionLoading(prev => ({ ...prev, uploadOptionGlb: optionId }));
    try {
      await configuratorService.uploadOptionGlb(optionId, file);
      await loadData();
      setSuccessMessage('GLB file uploaded!');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setError(msg);
    } finally {
      setActionLoading(prev => ({ ...prev, uploadOptionGlb: null }));
    }
  };

  // Set default option
  const handleSetDefaultOption = async (optionId: number) => {
    setActionLoading(prev => ({ ...prev, setDefault: optionId }));
    try {
      await configuratorService.setOptionAsDefault(optionId);
      await loadData();
      setSuccessMessage('Default option updated!');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to set default';
      setError(msg);
    } finally {
      setActionLoading(prev => ({ ...prev, setDefault: null }));
    }
  };

  // Update option price - store locally until save
  const handlePriceChange = useCallback((optionId: number, priceModifier: number) => {
    setPendingPriceChanges(prev => ({
      ...prev,
      [optionId]: priceModifier,
    }));
  }, []);

  // Save all pending changes
  const handleSaveAllChanges = useCallback(async () => {
    if (!hasUnsavedChanges) return;

    setIsSaving(true);
    setError(null);

    try {
      // Save all pending price changes
      const updates = Object.entries(pendingPriceChanges).map(([optionId, priceModifier]) =>
        configuratorService.updateOption(Number(optionId), { priceModifier })
      );

      await Promise.all(updates);
      setPendingPriceChanges({});
      await loadData();
      setSuccessMessage(`Saved ${updates.length} change(s) successfully!`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save changes';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  }, [hasUnsavedChanges, pendingPriceChanges, loadData]);

  // Discard all pending changes
  const handleDiscardChanges = useCallback(() => {
    setPendingPriceChanges({});
  }, []);

  // Delete option
  const handleDeleteOption = (optionId: number) => {
    showConfirm({
      title: 'Delete Option',
      message: 'Are you sure you want to delete this option? This cannot be undone.',
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          await configuratorService.deleteOption(optionId);
          await loadData();
          setSuccessMessage('Option deleted!');
          closeConfirm();
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Failed to delete option';
          setError(msg);
          closeConfirm();
        }
      },
    });
  };

  // Slot CRUD handlers
  const openAddSlotModal = () => {
    setEditingSlot(null);
    setSlotFormData({
      slotKey: '',
      displayName: '',
      description: '',
      icon: '',
      mountPointsJson: '[]',
    });
    setShowSlotModal(true);
  };

  const openEditSlotModal = (slot: ConfiguratorSlot) => {
    setEditingSlot(slot);
    setSlotFormData({
      slotKey: slot.slotKey,
      displayName: slot.displayName,
      description: slot.description || '',
      icon: slot.icon || '',
      mountPointsJson: slot.mountPointsJson || '[]',
    });
    setShowSlotModal(true);
  };

  const handleSaveSlot = async () => {
    if (!configurator || !slotFormData.slotKey.trim() || !slotFormData.displayName.trim()) {
      setError('Slot key and display name are required');
      return;
    }

    if (slotFormData.mountPointsJson.trim()) {
      try {
        JSON.parse(slotFormData.mountPointsJson);
      } catch {
        setError('Mount Points JSON is not valid JSON');
        return;
      }
    }

    setActionLoading(prev => ({ ...prev, saveSlot: true }));
    try {
      if (editingSlot) {
        await configuratorService.updateSlot(editingSlot.id, {
          displayName: slotFormData.displayName,
          description: slotFormData.description || undefined,
          icon: slotFormData.icon || undefined,
          mountPointsJson: slotFormData.mountPointsJson,
        });
        setSuccessMessage('Slot updated!');
      } else {
        await configuratorService.createSlot(configurator.id, {
          slotKey: slotFormData.slotKey,
          displayName: slotFormData.displayName,
          description: slotFormData.description || undefined,
          icon: slotFormData.icon || undefined,
          mountPointsJson: slotFormData.mountPointsJson,
        });
        setSuccessMessage('Slot created!');
      }
      setShowSlotModal(false);
      await loadData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save slot';
      setError(msg);
    } finally {
      setActionLoading(prev => ({ ...prev, saveSlot: false }));
    }
  };

  const handleDeleteSlot = (slotId: number) => {
    showConfirm({
      title: 'Delete Slot',
      message: 'Are you sure you want to delete this slot? All options in this slot will be permanently deleted.',
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          await configuratorService.deleteSlot(slotId);
          await loadData();
          setSuccessMessage('Slot deleted!');
          closeConfirm();
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Failed to delete slot';
          setError(msg);
          closeConfirm();
        }
      },
    });
  };

  // Option CRUD handlers
  const openAddOptionModal = (slotId: number) => {
    setEditingOption(null);
    setOptionSlotId(slotId);
    setOptionFormData({
      optionKey: '',
      displayName: '',
      description: '',
      priceModifier: 0,
      isDefault: false,
    });
    setShowOptionModal(true);
  };

  const openEditOptionModal = (slotId: number, option: ConfiguratorOption) => {
    setEditingOption({ slotId, option });
    setOptionSlotId(slotId);
    setOptionFormData({
      optionKey: option.optionKey,
      displayName: option.displayName,
      description: option.description || '',
      priceModifier: option.priceModifier,
      isDefault: option.isDefault,
    });
    setShowOptionModal(true);
  };

  const handleSaveOption = async () => {
    if (!optionSlotId || !optionFormData.optionKey.trim() || !optionFormData.displayName.trim()) {
      setError('Option key and display name are required');
      return;
    }

    setActionLoading(prev => ({ ...prev, saveOption: true }));
    try {
      if (editingOption?.option) {
        await configuratorService.updateOption(editingOption.option.id, {
          displayName: optionFormData.displayName,
          description: optionFormData.description || undefined,
          priceModifier: optionFormData.priceModifier,
          isDefault: optionFormData.isDefault,
        });
        setSuccessMessage('Option updated!');
      } else {
        await configuratorService.createOption(optionSlotId, {
          optionKey: optionFormData.optionKey,
          displayName: optionFormData.displayName,
          description: optionFormData.description || undefined,
          priceModifier: optionFormData.priceModifier,
          isDefault: optionFormData.isDefault,
        });
        setSuccessMessage('Option created!');
      }
      setShowOptionModal(false);
      await loadData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save option';
      setError(msg);
    } finally {
      setActionLoading(prev => ({ ...prev, saveOption: false }));
    }
  };

  // Get currency symbol from product
  const currencySymbol = product?.currency === 'USD' ? '$' : '€';

  // Navigation tabs
  const navTabs = <ProductNavTabs productId={id!} activeTab="configurator" />;

  return (
    <AdminLayout title="Product Configurator" navTabs={navTabs}>
      <div className="admin-page">
        <div className="admin-container">
          {loading ? (
            <div className="cfg-loading-skeleton">
              <div className="cfg-skeleton-progress">
                <div className="cfg-skeleton-bar" />
                <div className="cfg-skeleton-steps">
                  <div className="cfg-skeleton-step" />
                  <div className="cfg-skeleton-step" />
                  <div className="cfg-skeleton-step" />
                  <div className="cfg-skeleton-step" />
                </div>
              </div>
              <div className="cfg-skeleton-section">
                <div className="cfg-skeleton-header" />
                <div className="cfg-skeleton-cards">
                  <div className="cfg-skeleton-card" />
                  <div className="cfg-skeleton-card" />
                </div>
              </div>
              <div className="cfg-skeleton-section">
                <div className="cfg-skeleton-header" />
                <div className="cfg-skeleton-slot" />
              </div>
            </div>
          ) : !product ? (
            <div className="admin-card">Product not found.</div>
          ) : (
            <>
              {/* Messages */}
              {successMessage && (
                <div className="cfg-toast cfg-toast-success">
                  <Check size={16} />
                  {successMessage}
                </div>
              )}
              {error && (
                <div className="cfg-toast cfg-toast-error">
                  <AlertTriangle size={16} />
                  {error}
                  <button onClick={() => setError(null)} className="cfg-toast-close">
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* No Configurator State */}
              {!configurator && (
                <div className="cfg-empty">
                  <Package size={48} />
                  <h3>No Configurator Setup</h3>
                  <p>Create a configurator to allow customers to customize this product with different components.</p>
                  <button
                    className={`btn btn-primary ${actionLoading.createConfigurator ? 'btn-loading' : ''}`}
                    onClick={handleCreateConfigurator}
                    disabled={actionLoading.createConfigurator}
                  >
                    {actionLoading.createConfigurator ? 'Creating...' : 'Create Configurator'}
                  </button>
                </div>
              )}

              {/* Configurator Exists */}
              {configurator && (
                <div className="cfg-container">
                  {/* Progress Stepper */}
                  {configurator.readiness && (
                    <ProgressStepper
                      readiness={configurator.readiness}
                      enabled={configurator.enabled}
                      onToggleEnabled={handleToggleEnabled}
                      toggleDisabled={actionLoading.toggleEnabled}
                    />
                  )}

                  {/* Unsaved Changes Bar */}
                  {hasUnsavedChanges && (
                    <div className="cfg-unsaved-bar">
                      <div className="cfg-unsaved-info">
                        <span className="cfg-unsaved-dot" />
                        <span>You have unsaved changes ({Object.keys(pendingPriceChanges).length} price modification{Object.keys(pendingPriceChanges).length > 1 ? 's' : ''})</span>
                      </div>
                      <div className="cfg-unsaved-actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={handleDiscardChanges}
                          disabled={isSaving}
                        >
                          Discard
                        </button>
                        <button
                          className={`btn btn-sm btn-primary ${isSaving ? 'btn-loading' : ''}`}
                          onClick={handleSaveAllChanges}
                          disabled={isSaving}
                        >
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Base Assets Section */}
                  <CollapsibleSection
                    title="Base Assets"
                    icon={<Box size={18} />}
                    defaultExpanded={true}
                  >
                    <div className="cfg-assets-grid">
                      <AssetCard
                        type="model"
                        title="3D Model (GLB)"
                        fileName={configurator.baseModelFileName}
                        fileSize={configurator.baseModelFileSize}
                        fileUrl={configurator.baseModelUrl}
                        onUpload={handleUploadBaseModel}
                        onDelete={handleDeleteBaseModel}
                        uploading={uploadState.uploading}
                        uploadProgress={uploadState.progress}
                        deleting={actionLoading.deleteBaseModel}
                        accept=".glb"
                        hint="GLB format, max 200MB"
                        previewElement={configurator.baseModelUrl ? (
                          React.createElement('model-viewer', {
                            src: configurator.baseModelUrl,
                            alt: 'Base model preview',
                            'auto-rotate': true,
                            'camera-controls': true,
                            className: 'cfg-model-preview',
                          })
                        ) : undefined}
                      />
                      <AssetCard
                        type="file"
                        title="Digital File (ZIP)"
                        fileName={configurator.baseDigitalFileName}
                        fileSize={configurator.baseDigitalFileSize}
                        fileUrl={configurator.baseDigitalFileUrl}
                        onUpload={handleUploadBaseDigitalFile}
                        onDelete={handleDeleteBaseDigitalFile}
                        uploading={digitalFileUploadState.uploading}
                        uploadProgress={digitalFileUploadState.progress}
                        deleting={actionLoading.deleteBaseDigitalFile}
                        accept=".zip"
                        hint="ZIP format, max 500MB - included in all downloads"
                      />
                    </div>
                  </CollapsibleSection>

                  {/* Configuration Slots Section */}
                  <CollapsibleSection
                    title="Configuration Slots"
                    icon={<Settings size={18} />}
                    badge={configurator.slots.length}
                    defaultExpanded={true}
                    actions={
                      <button className="btn btn-sm btn-primary" onClick={openAddSlotModal}>
                        <Plus size={14} /> Add Slot
                      </button>
                    }
                  >
                    {configurator.slots.length === 0 ? (
                      <div className="cfg-slots-empty">
                        <p>No slots defined. Add slots to allow customers to customize components.</p>
                        <button className="btn btn-primary" onClick={openAddSlotModal}>
                          <Plus size={14} /> Add First Slot
                        </button>
                        <span className="cfg-slots-or">or</span>
                        <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>
                          Import from JSON
                        </button>
                      </div>
                    ) : (
                      <div className="cfg-slots-list">
                        {configurator.slots.map((slot) => (
                          <SlotCard
                            key={slot.id}
                            slot={slot}
                            currencySymbol={currencySymbol}
                            onEditSlot={() => openEditSlotModal(slot)}
                            onDeleteSlot={() => handleDeleteSlot(slot.id)}
                            onAddOption={() => openAddOptionModal(slot.id)}
                            onEditOption={(option) => openEditOptionModal(slot.id, option)}
                            onDeleteOption={handleDeleteOption}
                            onSetDefaultOption={handleSetDefaultOption}
                            onUploadOptionGlb={handleUploadOptionGlb}
                            onUploadOptionZip={handleUploadOptionDigitalFile}
                            onDeleteOptionZip={handleDeleteOptionDigitalFile}
                            onOptionPriceChange={handlePriceChange}
                            pendingPriceChanges={pendingPriceChanges}
                            actionLoading={actionLoading}
                          />
                        ))}
                      </div>
                    )}
                  </CollapsibleSection>

                  {/* Mount Point Tool JSON Section */}
                  <CollapsibleSection
                    title="Mount Point Tool JSON"
                    icon={<FileJson size={18} />}
                    badge={configurator.configurationJson ? 'Loaded' : 'Empty'}
                    defaultExpanded={true}
                  >
                    <div className="cfg-json-section">
                      <p className="cfg-json-hint">
                        This JSON defines mount points and available options from the Mount Point Tool.
                        You can view, edit, or import new configuration here.
                      </p>

                      {configurator.configurationJson ? (
                        <div className="cfg-json-editor">
                          <div className="cfg-json-status">
                            <span className="cfg-badge cfg-badge-success">JSON Loaded</span>
                            <span className="cfg-json-size">
                              {(configurator.configurationJson.length / 1024).toFixed(1)} KB
                            </span>
                          </div>

                          <textarea
                            className="cfg-json-textarea"
                            value={formattedConfigJson}
                            readOnly
                          />

                          <div className="cfg-json-actions">
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => {
                                setImportJson(formattedConfigJson);
                                setShowJsonEditModal(true);
                              }}
                            >
                              <Edit2 size={14} /> Edit JSON
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => {
                                const blob = new Blob([configurator.configurationJson || ''], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `config-${configurator.masterProductId}.json`;
                                a.click();
                                URL.revokeObjectURL(url);
                              }}
                            >
                              <Download size={14} /> Export JSON
                            </button>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => {
                                setImportJson('');
                                setShowImportModal(true);
                              }}
                            >
                              <Upload size={14} /> Import New JSON
                            </button>
                          </div>

                          {/* JSON Preview - parsed structure */}
                          <div className="cfg-json-preview">
                            <h4>Structure Preview</h4>
                            {parsedConfigJson ? (
                              <div className="cfg-json-tree">
                                <div className="cfg-json-item">
                                  <strong>Base Model:</strong> {parsedConfigJson.baseModel || 'Not set'}
                                </div>
                                <div className="cfg-json-item">
                                  <strong>Slots:</strong>
                                  {parsedConfigJson.slots && Object.keys(parsedConfigJson.slots).length > 0 ? (
                                    <ul className="cfg-json-slots">
                                      {Object.entries(parsedConfigJson.slots).map(([slotKey, slotData]: [string, unknown]) => {
                                        const slot = slotData as { mountPoints?: unknown[]; options?: string[] };
                                        return (
                                          <li key={slotKey}>
                                            <strong>{slotKey}</strong>
                                            <span className="cfg-json-slot-info">
                                              {slot.mountPoints?.length || 0} mount point(s),
                                              {' '}{slot.options?.length || 0} option(s)
                                            </span>
                                            {slot.options && slot.options.length > 0 && (
                                              <ul className="cfg-json-options">
                                                {slot.options.map((opt: string) => (
                                                  <li key={opt}>{opt}</li>
                                                ))}
                                              </ul>
                                            )}
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  ) : (
                                    <span className="text-muted"> No slots defined</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p className="text-danger">Invalid JSON format</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="cfg-json-empty">
                          <FileJson size={48} className="cfg-json-empty-icon" />
                          <h4>No Configuration JSON</h4>
                          <p>Import JSON from Mount Point Tool to define mount points and available options.</p>
                          <button
                            className="btn btn-primary"
                            onClick={() => {
                              setImportJson('');
                              setShowImportModal(true);
                            }}
                          >
                            <Upload size={14} /> Import JSON
                          </button>
                        </div>
                      )}
                    </div>
                  </CollapsibleSection>

                  {/* Advanced / Danger Zone */}
                  <CollapsibleSection
                    title="Advanced Settings"
                    icon={<AlertTriangle size={18} />}
                    defaultExpanded={false}
                    variant="danger"
                  >
                    <div className="cfg-danger-zone">
                      <div className="cfg-danger-item">
                        <div>
                          <strong>Delete Configurator</strong>
                          <p>Permanently remove this configurator and all slots, options, and uploaded files</p>
                        </div>
                        <button
                          className={`btn btn-danger ${actionLoading.deleteConfigurator ? 'btn-loading' : ''}`}
                          onClick={handleDeleteConfigurator}
                          disabled={actionLoading.deleteConfigurator}
                        >
                          {actionLoading.deleteConfigurator ? 'Deleting...' : 'Delete Configurator'}
                        </button>
                      </div>
                    </div>
                  </CollapsibleSection>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Import JSON Modal */}
      {showImportModal && (
        <div
          className="cfg-modal-overlay"
          onClick={handleCloseImportModal}
          role="dialog"
          aria-modal="true"
        >
          <div className="cfg-modal cfg-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="cfg-modal-header">
              <h3>Import Configuration JSON</h3>
              <button className="cfg-modal-close" onClick={handleCloseImportModal}>
                <X size={20} />
              </button>
            </div>
            <div className="cfg-modal-body">
              <p className="cfg-modal-hint">
                Paste the JSON exported from Mount Point Tool. This will create/update slots and options.
              </p>
              <textarea
                value={importJson}
                onChange={handleJsonInputChange}
                placeholder='{"baseModel": "tank_base.glb", "slots": {"turret": {"mountPoints": [...], "options": ["turret_a.glb", "turret_b.glb"]}}}'
                maxLength={MAX_JSON_SIZE}
                className="cfg-modal-textarea cfg-modal-textarea-lg"
              />
              <div className="cfg-modal-size">
                {(importJson.length / 1024).toFixed(1)} KB / {(MAX_JSON_SIZE / 1024).toFixed(0)} KB
              </div>
            </div>
            <div className="cfg-modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseImportModal} disabled={actionLoading.importJson}>
                Cancel
              </button>
              <button
                className={`btn btn-primary ${actionLoading.importJson ? 'btn-loading' : ''}`}
                onClick={handleImportJson}
                disabled={!importJson.trim() || actionLoading.importJson}
              >
                {actionLoading.importJson ? 'Importing...' : 'Import & Create Slots'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit JSON Modal */}
      {showJsonEditModal && (
        <div
          className="cfg-modal-overlay"
          onClick={() => { setShowJsonEditModal(false); setImportJson(''); }}
          role="dialog"
          aria-modal="true"
        >
          <div className="cfg-modal cfg-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="cfg-modal-header">
              <h3>Edit Configuration JSON</h3>
              <button className="cfg-modal-close" onClick={() => { setShowJsonEditModal(false); setImportJson(''); }}>
                <X size={20} />
              </button>
            </div>
            <div className="cfg-modal-body">
              <p className="cfg-modal-hint">
                Edit the raw JSON configuration. Changes will update mount points and option references.
                <strong> Note:</strong> This only updates the JSON data, not the actual slots/options in the database.
              </p>
              <textarea
                value={importJson}
                onChange={handleJsonInputChange}
                maxLength={MAX_JSON_SIZE}
                className="cfg-modal-textarea cfg-modal-textarea-lg"
                spellCheck={false}
              />
              <div className="cfg-modal-size">
                {(importJson.length / 1024).toFixed(1)} KB / {(MAX_JSON_SIZE / 1024).toFixed(0)} KB
                {(() => {
                  try {
                    JSON.parse(importJson);
                    return <span className="cfg-json-valid"> - Valid JSON</span>;
                  } catch {
                    return <span className="cfg-json-invalid"> - Invalid JSON</span>;
                  }
                })()}
              </div>
            </div>
            <div className="cfg-modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => { setShowJsonEditModal(false); setImportJson(''); }}
                disabled={actionLoading.saveJson}
              >
                Cancel
              </button>
              <button
                className={`btn btn-primary ${actionLoading.saveJson ? 'btn-loading' : ''}`}
                onClick={handleSaveJson}
                disabled={!importJson.trim() || actionLoading.saveJson}
              >
                {actionLoading.saveJson ? 'Saving...' : 'Save JSON'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slot Modal */}
      {showSlotModal && (
        <div
          className="cfg-modal-overlay"
          onClick={() => setShowSlotModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="cfg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cfg-modal-header">
              <h3>{editingSlot ? 'Edit Slot' : 'Add New Slot'}</h3>
              <button className="cfg-modal-close" onClick={() => setShowSlotModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="cfg-modal-body">
              <div className="cfg-form-group">
                <label>Slot Key *</label>
                <input
                  type="text"
                  value={slotFormData.slotKey}
                  onChange={(e) => setSlotFormData({ ...slotFormData, slotKey: e.target.value })}
                  placeholder="e.g., turret, wheels, armor"
                  disabled={!!editingSlot}
                  className="cfg-form-input"
                />
                {editingSlot && <span className="cfg-form-hint">Slot key cannot be changed</span>}
              </div>

              <div className="cfg-form-group">
                <label>Display Name *</label>
                <input
                  type="text"
                  value={slotFormData.displayName}
                  onChange={(e) => setSlotFormData({ ...slotFormData, displayName: e.target.value })}
                  placeholder="e.g., Turret, Wheels, Armor"
                  className="cfg-form-input"
                />
              </div>

              <div className="cfg-form-group">
                <label>Description</label>
                <textarea
                  value={slotFormData.description}
                  onChange={(e) => setSlotFormData({ ...slotFormData, description: e.target.value })}
                  placeholder="Optional description for this slot"
                  className="cfg-form-textarea"
                />
              </div>

              <div className="cfg-form-group">
                <label>Mount Points JSON</label>
                <div className="cfg-mount-helpers">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      if (configurator?.configurationJson) {
                        try {
                          const config = JSON.parse(configurator.configurationJson);
                          const slotKey = slotFormData.slotKey.trim();
                          if (slotKey && config.slots && config.slots[slotKey]) {
                            const mountPoints = config.slots[slotKey].mountPoints || [];
                            setSlotFormData({
                              ...slotFormData,
                              mountPointsJson: JSON.stringify(mountPoints, null, 2)
                            });
                            setSuccessMessage(`Extracted ${mountPoints.length} mount point(s)`);
                          } else {
                            setError(`Slot "${slotKey}" not found in config`);
                          }
                        } catch {
                          setError('Failed to parse configuration JSON');
                        }
                      } else {
                        setError('No configuration JSON available');
                      }
                    }}
                    disabled={!slotFormData.slotKey.trim()}
                  >
                    Extract from Config
                  </button>
                </div>
                <textarea
                  value={slotFormData.mountPointsJson}
                  onChange={(e) => setSlotFormData({ ...slotFormData, mountPointsJson: e.target.value })}
                  placeholder='[{"name": "mount1", "position": [0, 0, 0], "rotation": [0, 0, 0]}]'
                  className="cfg-form-textarea cfg-form-mono"
                />
              </div>
            </div>
            <div className="cfg-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSlotModal(false)} disabled={actionLoading.saveSlot}>
                Cancel
              </button>
              <button
                className={`btn btn-primary ${actionLoading.saveSlot ? 'btn-loading' : ''}`}
                onClick={handleSaveSlot}
                disabled={!slotFormData.slotKey.trim() || !slotFormData.displayName.trim() || actionLoading.saveSlot}
              >
                {actionLoading.saveSlot ? 'Saving...' : (editingSlot ? 'Update Slot' : 'Create Slot')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Option Modal */}
      {showOptionModal && (
        <div
          className="cfg-modal-overlay"
          onClick={() => setShowOptionModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="cfg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cfg-modal-header">
              <h3>{editingOption?.option ? 'Edit Option' : 'Add New Option'}</h3>
              <button className="cfg-modal-close" onClick={() => setShowOptionModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="cfg-modal-body">
              <div className="cfg-form-group">
                <label>Option Key *</label>
                <input
                  type="text"
                  value={optionFormData.optionKey}
                  onChange={(e) => setOptionFormData({ ...optionFormData, optionKey: e.target.value })}
                  placeholder="e.g., turret_heavy, wheels_offroad"
                  disabled={!!editingOption?.option}
                  className="cfg-form-input"
                />
                {editingOption?.option && <span className="cfg-form-hint">Option key cannot be changed</span>}
              </div>

              <div className="cfg-form-group">
                <label>Display Name *</label>
                <input
                  type="text"
                  value={optionFormData.displayName}
                  onChange={(e) => setOptionFormData({ ...optionFormData, displayName: e.target.value })}
                  placeholder="e.g., Heavy Turret, Offroad Wheels"
                  className="cfg-form-input"
                />
              </div>

              <div className="cfg-form-group">
                <label>Description</label>
                <textarea
                  value={optionFormData.description}
                  onChange={(e) => setOptionFormData({ ...optionFormData, description: e.target.value })}
                  placeholder="Optional description for this option"
                  className="cfg-form-textarea"
                />
              </div>

              <div className="cfg-form-group">
                <label>Price Modifier ({currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  value={optionFormData.priceModifier}
                  onChange={(e) => setOptionFormData({ ...optionFormData, priceModifier: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="cfg-form-input"
                />
                <span className="cfg-form-hint">Positive values add to price, negative values subtract</span>
              </div>

              <div className="cfg-form-group">
                <label className="cfg-form-checkbox">
                  <input
                    type="checkbox"
                    checked={optionFormData.isDefault}
                    onChange={(e) => setOptionFormData({ ...optionFormData, isDefault: e.target.checked })}
                  />
                  <span>Set as default option for this slot</span>
                </label>
              </div>
            </div>
            <div className="cfg-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowOptionModal(false)} disabled={actionLoading.saveOption}>
                Cancel
              </button>
              <button
                className={`btn btn-primary ${actionLoading.saveOption ? 'btn-loading' : ''}`}
                onClick={handleSaveOption}
                disabled={!optionFormData.optionKey.trim() || !optionFormData.displayName.trim() || actionLoading.saveOption}
              >
                {actionLoading.saveOption ? 'Saving...' : (editingOption?.option ? 'Update Option' : 'Create Option')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText="Cancel"
        variant={confirmModal.variant}
        isLoading={confirmModal.isLoading}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
      />
    </AdminLayout>
  );
};

export default AdminProductConfigurator;
