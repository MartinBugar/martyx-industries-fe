/**
 * Admin Master Product Tab Form Page - MULTI-LANGUAGE VERSION
 *
 * Allows editing product tabs in multiple languages (EN, SK, DE) simultaneously.
 * Users can switch between language tabs and fill content for each language.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ConfirmDialog, useConfirmDialog } from '../../components/ui';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Download, Plus, X, FileText } from 'lucide-react';
import AdminLayout from './AdminLayout';
import type { ProductTabCreateRequest, ProductTabTemplate } from '../../types/api';
import {
  adminGetTabById,
  adminCreateTab,
  adminUpdateTab,
  adminGetTabTemplates,
  adminGetTabAttachments,
  adminAddAttachmentToTab,
  adminRemoveAttachmentFromTab,
  adminGetTabsByKey,
  type SupportedLocale
} from '../../services/productTabService';
import { productService } from '../../services/productService';
import type { BuildInfoDto } from '../../types/api';
import {
  adminGetAttachmentsForMasterProduct
} from '../../services/productAttachmentService';
import { Button } from '../../components/ui';
import { apiClient } from '../../services/apiClient';
import LanguageTabs from '../../components/admin/LanguageTabs';
import './AdminUsers.css';
import './AdminMasterProductTabForm.css';
import { logInfo, logError } from '../../services/logger';

// Language-specific fields that can be translated
interface TranslatableFields {
  tabLabel: string;
  contentHtml: string;
  contentMarkdown: string;
  description: string;
}

// Shared fields across all languages
interface SharedFields {
  tabKey: string;
  contentType: 'HTML' | 'MARKDOWN' | 'JSON' | 'COMPONENT';
  contentJson: string;
  componentName: string;
  displayOrder: number;
  iconName: string;
  isActive: boolean;
  showForVariantType: string;
  requiresAuthentication: boolean;
  cssClass: string;
}

const AdminMasterProductTabForm: React.FC = () => {
  const { productId, tabId } = useParams<{
    productId: string;
    tabId?: string;
  }>();
  const navigate = useNavigate();
  const isEditMode = !!tabId && tabId !== 'new';

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [templates, setTemplates] = useState<ProductTabTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  // Multi-language state
  const [activeLanguage, setActiveLanguage] = useState<SupportedLocale>('en');
  const [languageData, setLanguageData] = useState<Record<SupportedLocale, TranslatableFields>>({
    en: { tabLabel: '', contentHtml: '', contentMarkdown: '', description: '' },
    sk: { tabLabel: '', contentHtml: '', contentMarkdown: '', description: '' },
    de: { tabLabel: '', contentHtml: '', contentMarkdown: '', description: '' }
  });
  const [existingTabIds, setExistingTabIds] = useState<Record<SupportedLocale, number | null>>({
    en: null,
    sk: null,
    de: null
  });

  // Shared fields (same across all languages)
  const [sharedFields, setSharedFields] = useState<SharedFields>({
    tabKey: '',
    contentType: 'HTML',
    contentJson: '',
    componentName: '',
    displayOrder: 0,
    iconName: '',
    isActive: true,
    showForVariantType: '',
    requiresAuthentication: false,
    cssClass: ''
  });

  // Attachments state
  const [availableAttachments, setAvailableAttachments] = useState<Array<{ id: number; displayLabel: string; fileName: string; description?: string | null }>>([]);
  const [tabAttachments, setTabAttachments] = useState<Array<{ id: number; displayLabel: string; fileName: string; description?: string | null }>>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  // Build Info state (for BuildInfoTab component)
  const [buildInfo, setBuildInfo] = useState<BuildInfoDto>({
    partsCount: 0,
    screwsCount: 0,
    filamentGrams: 0,
    filamentType: '',
    printTimeHours: 0,
    assemblyTimeHours: 0,
    requiredTools: [],
    skillsRequired: [],
    estimatedTotalHours: 0
  });
  const [difficultyLevel, setDifficultyLevel] = useState<string>('BEGINNER');
  const [buildInfoLoading, setBuildInfoLoading] = useState(false);

  // Confirm dialog
  const { confirm, dialogProps } = useConfirmDialog({
    title: 'Remove Attachment',
    message: 'Are you sure you want to remove this attachment from the tab?',
    variant: 'warning',
    confirmText: 'Remove',
    cancelText: 'Cancel'
  });

  // Helper function to check if a language is complete
  const isLanguageComplete = (lang: SupportedLocale): boolean => {
    const data = languageData[lang];

    // Tab label is always required
    if (!data.tabLabel.trim()) {
      return false;
    }

    // Check appropriate content field based on content type
    if (sharedFields.contentType === 'HTML' && !data.contentHtml.trim()) {
      return false;
    }

    if (sharedFields.contentType === 'MARKDOWN' && !data.contentMarkdown.trim()) {
      return false;
    }

    return true;
  };

  // Determine which languages have been filled out
  const completedLanguages: SupportedLocale[] = (['en', 'sk', 'de'] as SupportedLocale[])
    .filter(lang => isLanguageComplete(lang));

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const loadedTemplates = await adminGetTabTemplates();
        setTemplates(loadedTemplates);
      } catch (err) {
        logError('Error loading templates:', err);
      }
    };
    loadTemplates();
  }, []);

  // Load existing tab data if editing
  useEffect(() => {
    if (isEditMode && tabId) {
      loadAllLanguageVersions(Number(tabId));
    }
  }, [tabId, isEditMode]);

  // Load attachments when editing a ProductDownloads tab
  useEffect(() => {
    if (isEditMode && tabId && productId &&
        sharedFields.contentType === 'COMPONENT' &&
        sharedFields.componentName === 'ProductDownloads') {
      loadAttachments();
    }
  }, [isEditMode, tabId, productId, sharedFields.contentType, sharedFields.componentName]);

  // Load build info when editing a BuildInfoTab
  useEffect(() => {
    const loadBuildInfo = async () => {
      if (!productId || sharedFields.componentName !== 'BuildInfoTab') return;

      try {
        setBuildInfoLoading(true);
        const masterProduct = await productService.adminGetMasterProduct(Number(productId));

        if (masterProduct.buildInfo) {
          setBuildInfo(masterProduct.buildInfo);
        }
        if (masterProduct.difficultyLevel) {
          setDifficultyLevel(masterProduct.difficultyLevel);
        }
      } catch (err) {
        logError('Error loading build info:', err);
        setError('Failed to load build information');
      } finally {
        setBuildInfoLoading(false);
      }
    };

    loadBuildInfo();
  }, [productId, sharedFields.componentName]);

  const loadAllLanguageVersions = async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      // Load the primary tab to get the tabKey
      const primaryTab = await adminGetTabById(id);

      // Load all language versions by tabKey
      const allVersions = await adminGetTabsByKey(
        primaryTab.tabKey,
        Number(productId),
        null
      );

      // Populate shared fields (from primary tab)
      setSharedFields({
        tabKey: primaryTab.tabKey,
        contentType: primaryTab.contentType,
        contentJson: primaryTab.contentJson || '',
        componentName: primaryTab.componentName || '',
        displayOrder: primaryTab.displayOrder,
        iconName: primaryTab.iconName || '',
        isActive: primaryTab.isActive,
        showForVariantType: primaryTab.showForVariantType || '',
        requiresAuthentication: primaryTab.requiresAuthentication,
        cssClass: primaryTab.cssClass || ''
      });

      // Populate language-specific data and IDs
      const newLanguageData: Record<SupportedLocale, TranslatableFields> = {
        en: { tabLabel: '', contentHtml: '', contentMarkdown: '', description: '' },
        sk: { tabLabel: '', contentHtml: '', contentMarkdown: '', description: '' },
        de: { tabLabel: '', contentHtml: '', contentMarkdown: '', description: '' }
      };
      const newTabIds: Record<SupportedLocale, number | null> = {
        en: null,
        sk: null,
        de: null
      };

      (['en', 'sk', 'de'] as SupportedLocale[]).forEach((locale) => {
        const tab = allVersions[locale];
        if (tab) {
          newLanguageData[locale] = {
            tabLabel: tab.tabLabel,
            contentHtml: tab.contentHtml || '',
            contentMarkdown: tab.contentMarkdown || '',
            description: tab.description || ''
          };
          newTabIds[locale] = tab.id;
        }
      });

      setLanguageData(newLanguageData);
      setExistingTabIds(newTabIds);

      logInfo('✅ Loaded all language versions:', {
        en: newTabIds.en ? 'exists' : 'missing',
        sk: newTabIds.sk ? 'exists' : 'missing',
        de: newTabIds.de ? 'exists' : 'missing'
      });

    } catch (err) {
      logError('Error loading tab:', err);
      setError('Failed to load tab');
    } finally {
      setLoading(false);
    }
  };

  const loadAttachments = async () => {
    if (!tabId || !productId) return;

    try {
      setLoadingAttachments(true);

      // Load all available attachments for this master product
      const allAttachments = await adminGetAttachmentsForMasterProduct(Number(productId));
      setAvailableAttachments(allAttachments);

      // Load attachments already assigned to this tab
      const assigned = await adminGetTabAttachments(Number(tabId));
      setTabAttachments(assigned);
    } catch (err) {
      logError('Error loading attachments:', err);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setError(null);
    setFieldErrors({});

    // Client-side validation
    if (!sharedFields.tabKey) {
      setError('Tab Key is required');
      return;
    }

    // Check that at least one language has content
    if (completedLanguages.length === 0) {
      setError('Please fill out content for at least one language');
      return;
    }

    try {
      setSaving(true);

      // Save each language version
      const savePromises: Promise<any>[] = [];

      (['en', 'sk', 'de'] as SupportedLocale[]).forEach((locale) => {
        const data = languageData[locale];

        // Skip if this language has no content
        if (!data.tabLabel.trim()) {
          return;
        }

        const request: ProductTabCreateRequest = {
          masterProductId: Number(productId),
          variantId: null,
          tabKey: sharedFields.tabKey,
          tabLabel: data.tabLabel,
          contentType: sharedFields.contentType,
          contentHtml: data.contentHtml,
          contentMarkdown: data.contentMarkdown,
          contentJson: sharedFields.contentJson,
          componentName: sharedFields.componentName,
          displayOrder: sharedFields.displayOrder,
          iconName: sharedFields.iconName,
          isActive: sharedFields.isActive,
          showForVariantType: sharedFields.showForVariantType,
          requiresAuthentication: sharedFields.requiresAuthentication,
          locale: locale,
          description: data.description,
          cssClass: sharedFields.cssClass
        };

        // Update existing or create new
        const existingId = existingTabIds[locale];
        if (existingId) {
          savePromises.push(adminUpdateTab(existingId, request));
        } else {
          savePromises.push(adminCreateTab(request));
        }
      });

      // Execute all saves sequentially to avoid race conditions
      for (const savePromise of savePromises) {
        await savePromise;
      }

      logInfo(`✅ Saved ${savePromises.length} language versions`);

      // Save build info if this is a BuildInfoTab
      if (sharedFields.componentName === 'BuildInfoTab' && productId) {
        try {
          logInfo('💾 Saving build info to master product...');
          const masterProduct = await productService.adminGetMasterProduct(Number(productId));

          masterProduct.buildInfo = buildInfo;
          masterProduct.difficultyLevel = difficultyLevel;

          await productService.adminUpdateMasterProduct(Number(productId), masterProduct);
          logInfo('✅ Build info saved successfully');
        } catch (buildInfoErr) {
          logError('Error saving build info:', buildInfoErr);
          setError('Tab saved, but failed to save build information. Please try updating build info separately.');
        }
      }

      // Clear cache so frontend sees new tabs immediately
      apiClient.clearCache();

      // Navigate back to tabs list
      navigate(`/admin/products/${productId}/tabs`);
    } catch (err: unknown) {
      logError('Error saving tab:', err);

      // Parse validation errors from backend
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let errorData: any = {};
      if (err && typeof err === 'object') {
        errorData = ('errorData' in err ? err.errorData : undefined) ||
                    ('response' in err && err.response && typeof err.response === 'object' && 'data' in err.response ? err.response.data : {}) ||
                    {};
      }

      if (errorData.details && Array.isArray(errorData.details)) {
        const errors: Record<string, string> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        errorData.details.forEach((detail: any) => {
          if (detail.field && detail.message) {
            errors[detail.field] = detail.message;
          }
        });
        setFieldErrors(errors);
        setError('Please fix the validation errors below');
      } else if (errorData.message) {
        setError(errorData.message);
      } else {
        setError('Failed to save tab');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/admin/products/${productId}/tabs`);
  };

  const handleLoadTemplate = () => {
    if (!selectedTemplateId) return;

    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    // Update shared fields
    setSharedFields({
      ...sharedFields,
      tabKey: template.defaultTabKey,
      contentType: template.contentType,
      contentJson: template.defaultContentJson || '',
      componentName: template.defaultComponentName || '',
      displayOrder: template.defaultDisplayOrder,
      iconName: template.defaultIconName || ''
    });

    // Update current language data
    setLanguageData({
      ...languageData,
      [activeLanguage]: {
        ...languageData[activeLanguage],
        tabLabel: template.defaultTabLabel,
        contentHtml: template.defaultContentHtml || '',
        contentMarkdown: template.defaultContentMarkdown || '',
        description: template.description || ''
      }
    });

    setError(null);
    setFieldErrors({});
  };

  const handleAddAttachment = async (attachmentId: number) => {
    if (!tabId) return;

    try {
      await adminAddAttachmentToTab(Number(tabId), attachmentId, 0);
      await loadAttachments();
    } catch (err) {
      logError('Error adding attachment:', err);
      setError('Failed to add attachment to tab');
    }
  };

  const handleRemoveAttachment = useCallback(async (attachmentId: number) => {
    if (!tabId) return;

    const confirmed = await confirm({
      title: 'Remove Attachment',
      message: 'Are you sure you want to remove this attachment from the tab?',
      variant: 'warning',
      confirmText: 'Remove',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;

    try {
      await adminRemoveAttachmentFromTab(Number(tabId), attachmentId);
      await loadAttachments();
    } catch (err) {
      logError('Error removing attachment:', err);
      setError('Failed to remove attachment from tab');
    }
  }, [tabId, confirm, loadAttachments]);

  const handleLanguageChange = (lang: SupportedLocale) => {
    setActiveLanguage(lang);
  };

  const updateLanguageField = <K extends keyof TranslatableFields>(
    field: K,
    value: TranslatableFields[K]
  ) => {
    setLanguageData({
      ...languageData,
      [activeLanguage]: {
        ...languageData[activeLanguage],
        [field]: value
      }
    });
  };

  const updateSharedField = <K extends keyof SharedFields>(
    field: K,
    value: SharedFields[K]
  ) => {
    setSharedFields({
      ...sharedFields,
      [field]: value
    });
  };

  // Current language data shorthand
  const currentLangData = languageData[activeLanguage];

  if (loading) {
    return (
      <AdminLayout title={isEditMode ? 'Edit Tab' : 'Create Tab'}>
        <div className="admin-page">
          <div className="admin-container">
            <div className="admin-card admin-tab-form-loading">
              Loading tab data...
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEditMode ? 'Edit Master Product Tab' : 'Create New Master Product Tab'}>
      <div className="admin-page">
        <div className="admin-container">
          {/* Header */}
          <div className="admin-header">
            <div>
              <h2 className="admin-tab-form-header-title">
                {isEditMode ? 'Edit Master Product Tab' : 'Create New Master Product Tab'}
              </h2>
              <p className="admin-tab-form-header-desc">
                This tab will be shared by all variants unless overridden. Fill content for multiple languages.
              </p>
            </div>
            <div className="header-actions">
              <Link
                to={`/admin/products/${productId}/tabs`}
                className="btn btn-outline"
              >
                <ArrowLeft size={16} className="admin-tab-form-icon-mr" />
                Back to Tabs
              </Link>
            </div>
          </div>

          {error && (
            <div className="alert alert-error admin-tab-form-alert">
              <strong>{error}</strong>
              {Object.keys(fieldErrors).length > 0 && (
                <ul className="admin-tab-form-error-list">
                  {Object.entries(fieldErrors).map(([field, message]) => (
                    <li key={field}>
                      <strong>{field}:</strong> {message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Template Selector */}
          {!isEditMode && templates.length > 0 && (
            <div className="admin-card admin-tab-form-template-card">
              <h4 className="admin-tab-form-template-title">
                Start from Template
              </h4>
              <div className="admin-tab-form-template-row">
                <div className="admin-tab-form-template-select-wrap">
                  <label className="form-label admin-tab-form-template-label">
                    Choose a template to pre-fill the form
                  </label>
                  <select
                    className="form-control"
                    value={selectedTemplateId || ''}
                    onChange={(e) => setSelectedTemplateId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">-- Select Template --</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.templateName} - {template.defaultTabLabel}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  variant="info"
                  onClick={handleLoadTemplate}
                  disabled={!selectedTemplateId}
                  className="admin-tab-form-template-btn"
                >
                  <Download size={16} className="admin-tab-form-icon-mr" />
                  Load Template
                </Button>
              </div>
            </div>
          )}

          {/* Language Tabs */}
          <LanguageTabs
            activeLanguage={activeLanguage}
            onLanguageChange={handleLanguageChange}
            completedLanguages={completedLanguages}
          />

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="admin-card">
              <h3 className="section-title admin-tab-form-section-title">
                {isEditMode ? `Edit Tab - ${activeLanguage.toUpperCase()}` : `Create New Tab - ${activeLanguage.toUpperCase()}`}
              </h3>

              {/* Shared Fields Section */}
              <div className="admin-tab-form-section-block">
                <h4 className="admin-tab-form-section-heading">
                  Shared Settings (applies to all languages)
                </h4>

                <div className="admin-tab-form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      Tab Key (slug) <span className="admin-tab-form-required">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${fieldErrors.tabKey ? 'admin-tab-form-field-error' : ''}`}
                      value={sharedFields.tabKey}
                      onChange={(e) => {
                        updateSharedField('tabKey', e.target.value);
                        if (fieldErrors.tabKey) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.tabKey;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="e.g., details, features, reviews"
                      required
                      disabled={isEditMode}
                    />
                    {isEditMode && (
                      <p className="admin-tab-form-disabled-note">
                        ⚠️ Tab key cannot be changed after creation to maintain language version consistency
                      </p>
                    )}
                    {fieldErrors.tabKey && (
                      <div className="admin-tab-form-field-error-msg">
                        ⚠ {fieldErrors.tabKey}
                      </div>
                    )}
                    <small className="admin-tab-form-help-text">
                      Unique identifier for this tab. Same across all languages.
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Content Type</label>
                    <select
                      className="form-control"
                      value={sharedFields.contentType}
                      onChange={(e) => updateSharedField('contentType', e.target.value as 'HTML' | 'MARKDOWN' | 'JSON' | 'COMPONENT')}
                    >
                      <option value="HTML">HTML</option>
                      <option value="MARKDOWN">Markdown</option>
                      <option value="JSON">JSON</option>
                      <option value="COMPONENT">Component</option>
                    </select>
                  </div>

                  {sharedFields.contentType === 'COMPONENT' && (
                    <div className="form-group">
                      <label className="form-label">Component Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={sharedFields.componentName}
                        onChange={(e) => updateSharedField('componentName', e.target.value)}
                        placeholder="e.g., ProductDownloads, ReviewsTab"
                      />
                    </div>
                  )}

                  <div className="admin-tab-form-grid-2col">
                    <div className="form-group">
                      <label className="form-label">Display Order</label>
                      <input
                        type="number"
                        className="form-control"
                        value={sharedFields.displayOrder}
                        onChange={(e) => updateSharedField('displayOrder', parseInt(e.target.value) || 0)}
                        min="0"
                      />
                      <small className="admin-tab-form-help-text">
                        Lower numbers appear first.
                      </small>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Icon Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={sharedFields.iconName}
                        onChange={(e) => updateSharedField('iconName', e.target.value)}
                        placeholder="e.g., FileText, Star"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Language-Specific Fields Section */}
              <div className="admin-tab-form-section-block">
                <h4 className="admin-tab-form-section-heading">
                  Content for {activeLanguage.toUpperCase()}
                  {completedLanguages.includes(activeLanguage) && (
                    <span className="admin-tab-form-completed">✓ Completed</span>
                  )}
                </h4>

                <div className="admin-tab-form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      Tab Label (Display Name) <span className="admin-tab-form-required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={currentLangData.tabLabel}
                      onChange={(e) => updateLanguageField('tabLabel', e.target.value)}
                      placeholder={`e.g., ${activeLanguage === 'en' ? 'Product Details' : activeLanguage === 'sk' ? 'Detaily produktu' : 'Produktdetails'}`}
                      required
                    />
                    <small className="admin-tab-form-help-text">
                      The label shown to users in this language.
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <input
                      type="text"
                      className="form-control"
                      value={currentLangData.description}
                      onChange={(e) => updateLanguageField('description', e.target.value)}
                      placeholder="Brief description in this language"
                    />
                  </div>

                  {sharedFields.contentType === 'HTML' && (
                    <div className="form-group">
                      <label className="form-label">HTML Content ({activeLanguage.toUpperCase()})</label>
                      <textarea
                        className="form-control admin-tab-form-textarea-mono"
                        value={currentLangData.contentHtml}
                        onChange={(e) => updateLanguageField('contentHtml', e.target.value)}
                        rows={20}
                        placeholder="Enter HTML content in this language..."
                      />
                    </div>
                  )}

                  {sharedFields.contentType === 'MARKDOWN' && (
                    <div className="form-group">
                      <label className="form-label">Markdown Content ({activeLanguage.toUpperCase()})</label>
                      <textarea
                        className="form-control admin-tab-form-textarea-mono"
                        value={currentLangData.contentMarkdown}
                        onChange={(e) => updateLanguageField('contentMarkdown', e.target.value)}
                        rows={20}
                        placeholder="Enter Markdown content in this language..."
                      />
                    </div>
                  )}

                  {sharedFields.contentType === 'JSON' && (
                    <div className="form-group">
                      <label className="form-label">JSON Content (Shared)</label>
                      <textarea
                        className="form-control admin-tab-form-textarea-mono"
                        value={sharedFields.contentJson}
                        onChange={(e) => updateSharedField('contentJson', e.target.value)}
                        rows={20}
                        placeholder='{"key": "value"}'
                      />
                      <small className="admin-tab-form-help-text">
                        JSON is shared across all languages.
                      </small>
                    </div>
                  )}
                </div>
              </div>

              {/* Build Info Management (only for BuildInfoTab component) */}
              {sharedFields.contentType === 'COMPONENT' &&
               sharedFields.componentName === 'BuildInfoTab' && (
                <div className="admin-tab-form-section-block">
                  <h4 className="admin-tab-form-section-heading">
                    Build Information & Difficulty
                  </h4>

                  {buildInfoLoading ? (
                    <div className="admin-tab-form-centered-text">
                      Loading build information...
                    </div>
                  ) : (
                    <div className="admin-tab-form-grid">
                      {/* Difficulty Level */}
                      <div className="form-group">
                        <label className="form-label">
                          Difficulty Level
                        </label>
                        <select
                          className="form-control"
                          value={difficultyLevel}
                          onChange={(e) => setDifficultyLevel(e.target.value)}
                        >
                          <option value="BEGINNER">Beginner</option>
                          <option value="INTERMEDIATE">Intermediate</option>
                          <option value="ADVANCED">Advanced</option>
                          <option value="EXPERT">Expert</option>
                        </select>
                      </div>

                      {/* Parts Count */}
                      <div className="admin-tab-form-grid-2col">
                        <div className="form-group">
                          <label className="form-label">Parts Count</label>
                          <input
                            type="number"
                            className="form-control"
                            value={buildInfo.partsCount}
                            onChange={(e) => setBuildInfo({ ...buildInfo, partsCount: parseInt(e.target.value) || 0 })}
                            min="0"
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Screws Count</label>
                          <input
                            type="number"
                            className="form-control"
                            value={buildInfo.screwsCount}
                            onChange={(e) => setBuildInfo({ ...buildInfo, screwsCount: parseInt(e.target.value) || 0 })}
                            min="0"
                          />
                        </div>
                      </div>

                      {/* Filament */}
                      <div className="admin-tab-form-grid-2col">
                        <div className="form-group">
                          <label className="form-label">Filament (grams)</label>
                          <input
                            type="number"
                            className="form-control"
                            value={buildInfo.filamentGrams}
                            onChange={(e) => setBuildInfo({ ...buildInfo, filamentGrams: parseInt(e.target.value) || 0 })}
                            min="0"
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Filament Type</label>
                          <input
                            type="text"
                            className="form-control"
                            value={buildInfo.filamentType}
                            onChange={(e) => setBuildInfo({ ...buildInfo, filamentType: e.target.value })}
                            placeholder="e.g., PLA, ABS"
                          />
                        </div>
                      </div>

                      {/* Time */}
                      <div className="admin-tab-form-grid-3col">
                        <div className="form-group">
                          <label className="form-label">Print Time (hours)</label>
                          <input
                            type="number"
                            className="form-control"
                            value={buildInfo.printTimeHours}
                            onChange={(e) => setBuildInfo({ ...buildInfo, printTimeHours: parseFloat(e.target.value) || 0 })}
                            min="0"
                            step="0.5"
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Assembly Time (hours)</label>
                          <input
                            type="number"
                            className="form-control"
                            value={buildInfo.assemblyTimeHours}
                            onChange={(e) => setBuildInfo({ ...buildInfo, assemblyTimeHours: parseFloat(e.target.value) || 0 })}
                            min="0"
                            step="0.5"
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Total Time (hours)</label>
                          <input
                            type="number"
                            className="form-control"
                            value={buildInfo.estimatedTotalHours}
                            onChange={(e) => setBuildInfo({ ...buildInfo, estimatedTotalHours: parseFloat(e.target.value) || 0 })}
                            min="0"
                            step="0.5"
                          />
                        </div>
                      </div>

                      {/* Required Tools */}
                      <div className="form-group">
                        <label className="form-label">Required Tools (comma-separated)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={buildInfo.requiredTools.join(', ')}
                          onChange={(e) => setBuildInfo({
                            ...buildInfo,
                            requiredTools: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                          })}
                          placeholder="e.g., Screwdriver, Pliers, Soldering iron"
                        />
                      </div>

                      {/* Required Skills */}
                      <div className="form-group">
                        <label className="form-label">Required Skills (comma-separated)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={buildInfo.skillsRequired.join(', ')}
                          onChange={(e) => setBuildInfo({
                            ...buildInfo,
                            skillsRequired: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                          })}
                          placeholder="e.g., Basic soldering, 3D printing, Electronics assembly"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Attachments Management (only for ProductDownloads component in edit mode) */}
              {isEditMode &&
               sharedFields.contentType === 'COMPONENT' &&
               sharedFields.componentName === 'ProductDownloads' && (
                <div className="admin-tab-form-section-block">
                  <h4 className="admin-tab-form-section-heading">
                    Attachments Management
                  </h4>

                  {loadingAttachments ? (
                    <div className="admin-tab-form-centered-text">
                      Loading attachments...
                    </div>
                  ) : (
                    <div className="admin-tab-form-grid">
                      {/* Currently assigned attachments */}
                      <div>
                        <label className="form-label admin-tab-form-label-block">
                          Assigned Attachments ({tabAttachments.length})
                        </label>
                        {tabAttachments.length === 0 ? (
                          <div className="admin-tab-form-attachment-empty">
                            <FileText size={32} className="admin-tab-form-attachment-icon" />
                            <div>No attachments assigned to this tab yet.</div>
                          </div>
                        ) : (
                          <div className="admin-tab-form-attachment-list">
                            {tabAttachments.map(attachment => (
                              <div
                                key={attachment.id}
                                className="admin-tab-form-attachment-item"
                              >
                                <FileText size={20} className="admin-tab-form-attachment-icon-blue" />
                                <div className="admin-tab-form-attachment-content">
                                  <div className="admin-tab-form-attachment-label">
                                    {attachment.displayLabel}
                                  </div>
                                  {attachment.description && (
                                    <div className="admin-tab-form-attachment-desc">
                                      {attachment.description}
                                    </div>
                                  )}
                                  <div className="admin-tab-form-attachment-filename">
                                    {attachment.fileName}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAttachment(attachment.id)}
                                  className="admin-tab-form-btn-remove"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Available attachments to add */}
                      <div>
                        <label className="form-label admin-tab-form-label-block">
                          Available Attachments
                        </label>
                        {availableAttachments.filter(
                          att => !tabAttachments.find(ta => ta.id === att.id)
                        ).length === 0 ? (
                          <div className="admin-tab-form-available-empty">
                            All available attachments are already assigned.
                          </div>
                        ) : (
                          <div className="admin-tab-form-attachment-list">
                            {availableAttachments
                              .filter(att => !tabAttachments.find(ta => ta.id === att.id))
                              .map(attachment => (
                                <div
                                  key={attachment.id}
                                  className="admin-tab-form-attachment-item-available"
                                >
                                  <FileText size={20} className="admin-tab-form-attachment-icon-gray" />
                                  <div className="admin-tab-form-attachment-content">
                                    <div className="admin-tab-form-attachment-label">
                                      {attachment.displayLabel}
                                    </div>
                                    <div className="admin-tab-form-attachment-filename">
                                      {attachment.fileName}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleAddAttachment(attachment.id)}
                                    className="admin-tab-form-btn-add"
                                  >
                                    <Plus size={16} className="admin-tab-form-btn-add-icon" />
                                    Add
                                  </button>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Advanced Settings */}
              <div className="admin-tab-form-section-block">
                <h4 className="admin-tab-form-section-heading">
                  Advanced Settings
                </h4>

                <div className="admin-tab-form-advanced-grid">
                  <div className="admin-tab-form-checkbox-row">
                    <label className="admin-tab-form-checkbox-label">
                      <input
                        type="checkbox"
                        checked={sharedFields.isActive}
                        onChange={(e) => updateSharedField('isActive', e.target.checked)}
                        className="admin-tab-form-checkbox"
                      />
                      <span className="admin-tab-form-checkbox-text">Active</span>
                    </label>

                    <label className="admin-tab-form-checkbox-label">
                      <input
                        type="checkbox"
                        checked={sharedFields.requiresAuthentication}
                        onChange={(e) => updateSharedField('requiresAuthentication', e.target.checked)}
                        className="admin-tab-form-checkbox"
                      />
                      <span className="admin-tab-form-checkbox-text">Requires Authentication</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="admin-tab-form-actions">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving}
                  className="admin-tab-form-submit-btn"
                >
                  {saving ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save size={16} className="admin-tab-form-icon-mr" />
                      {isEditMode ? 'Update All Languages' : 'Create Tab'}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>

                {completedLanguages.length > 0 && (
                  <div className="admin-tab-form-languages-indicator">
                    <span>Languages filled: {completedLanguages.length}/3</span>
                    <span>({completedLanguages.join(', ').toUpperCase()})</span>
                  </div>
                )}
              </div>
            </div>
          </form>

          <ConfirmDialog {...dialogProps} />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMasterProductTabForm;
