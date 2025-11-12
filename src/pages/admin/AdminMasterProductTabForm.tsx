/**
 * Admin Master Product Tab Form Page - MULTI-LANGUAGE VERSION
 *
 * Allows editing product tabs in multiple languages (EN, SK, DE) simultaneously.
 * Users can switch between language tabs and fill content for each language.
 */

import React, { useState, useEffect } from 'react';
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
import {
  adminGetAttachmentsForMasterProduct
} from '../../services/productAttachmentService';
import { Button } from '../../components/ui';
import { apiClient } from '../../services/apiClient';
import LanguageTabs from '../../components/admin/LanguageTabs';
import './AdminUsers.css';

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
  const [availableAttachments, setAvailableAttachments] = useState<any[]>([]);
  const [tabAttachments, setTabAttachments] = useState<any[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

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
        console.error('Error loading templates:', err);
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

      console.log('✅ Loaded all language versions:', {
        en: newTabIds.en ? 'exists' : 'missing',
        sk: newTabIds.sk ? 'exists' : 'missing',
        de: newTabIds.de ? 'exists' : 'missing'
      });

    } catch (err) {
      console.error('Error loading tab:', err);
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
      console.error('Error loading attachments:', err);
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

      console.log(`✅ Saved ${savePromises.length} language versions`);

      // Clear cache so frontend sees new tabs immediately
      apiClient.clearCache();

      // Navigate back to tabs list
      navigate(`/admin/products/${productId}/tabs`);
    } catch (err: any) {
      console.error('Error saving tab:', err);

      // Parse validation errors from backend
      const errorData = err.errorData || err.response?.data || {};

      if (errorData.details && Array.isArray(errorData.details)) {
        const errors: Record<string, string> = {};
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
      console.error('Error adding attachment:', err);
      setError('Failed to add attachment to tab');
    }
  };

  const handleRemoveAttachment = async (attachmentId: number) => {
    if (!tabId) return;

    try {
      await adminRemoveAttachmentFromTab(Number(tabId), attachmentId);
      await loadAttachments();
    } catch (err) {
      console.error('Error removing attachment:', err);
      setError('Failed to remove attachment from tab');
    }
  };

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
            <div className="admin-card" style={{ textAlign: 'center', padding: '40px' }}>
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
              <h2 style={{ marginBottom: 8 }}>
                {isEditMode ? 'Edit Master Product Tab' : 'Create New Master Product Tab'}
              </h2>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                This tab will be shared by all variants unless overridden. Fill content for multiple languages.
              </p>
            </div>
            <div className="header-actions">
              <Link
                to={`/admin/products/${productId}/tabs`}
                className="btn btn-outline"
              >
                <ArrowLeft size={16} style={{ marginRight: 8 }} />
                Back to Tabs
              </Link>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 24 }}>
              <strong>{error}</strong>
              {Object.keys(fieldErrors).length > 0 && (
                <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
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
            <div className="admin-card" style={{ marginBottom: 24, background: '#f0f9ff', borderColor: '#bae6fd' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: 16, color: '#0c4a6e' }}>
                Start from Template
              </h4>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ color: '#0c4a6e' }}>
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
                  style={{ minWidth: 140 }}
                >
                  <Download size={16} style={{ marginRight: 8 }} />
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
              <h3 className="section-title" style={{ marginBottom: 24 }}>
                {isEditMode ? `Edit Tab - ${activeLanguage.toUpperCase()}` : `Create New Tab - ${activeLanguage.toUpperCase()}`}
              </h3>

              {/* Shared Fields Section */}
              <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16, color: '#374151' }}>
                  Shared Settings (applies to all languages)
                </h4>

                <div style={{ display: 'grid', gap: 20 }}>
                  <div className="form-group">
                    <label className="form-label">
                      Tab Key (slug) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
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
                      style={fieldErrors.tabKey ? { borderColor: '#ef4444' } : {}}
                    />
                    {isEditMode && (
                      <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                        ⚠️ Tab key cannot be changed after creation to maintain language version consistency
                      </p>
                    )}
                    {fieldErrors.tabKey && (
                      <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px', fontWeight: 500 }}>
                        ⚠ {fieldErrors.tabKey}
                      </div>
                    )}
                    <small style={{ color: '#6b7280', fontSize: '13px' }}>
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div className="form-group">
                      <label className="form-label">Display Order</label>
                      <input
                        type="number"
                        className="form-control"
                        value={sharedFields.displayOrder}
                        onChange={(e) => updateSharedField('displayOrder', parseInt(e.target.value) || 0)}
                        min="0"
                      />
                      <small style={{ color: '#6b7280', fontSize: '13px' }}>
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
              <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16, color: '#374151' }}>
                  Content for {activeLanguage.toUpperCase()}
                  {completedLanguages.includes(activeLanguage) && (
                    <span style={{ color: '#10b981', marginLeft: 8, fontSize: '14px' }}>✓ Completed</span>
                  )}
                </h4>

                <div style={{ display: 'grid', gap: 20 }}>
                  <div className="form-group">
                    <label className="form-label">
                      Tab Label (Display Name) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={currentLangData.tabLabel}
                      onChange={(e) => updateLanguageField('tabLabel', e.target.value)}
                      placeholder={`e.g., ${activeLanguage === 'en' ? 'Product Details' : activeLanguage === 'sk' ? 'Detaily produktu' : 'Produktdetails'}`}
                      required
                    />
                    <small style={{ color: '#6b7280', fontSize: '13px' }}>
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
                        className="form-control"
                        value={currentLangData.contentHtml}
                        onChange={(e) => updateLanguageField('contentHtml', e.target.value)}
                        rows={20}
                        placeholder="Enter HTML content in this language..."
                        style={{ fontFamily: 'monospace', fontSize: '13px' }}
                      />
                    </div>
                  )}

                  {sharedFields.contentType === 'MARKDOWN' && (
                    <div className="form-group">
                      <label className="form-label">Markdown Content ({activeLanguage.toUpperCase()})</label>
                      <textarea
                        className="form-control"
                        value={currentLangData.contentMarkdown}
                        onChange={(e) => updateLanguageField('contentMarkdown', e.target.value)}
                        rows={20}
                        placeholder="Enter Markdown content in this language..."
                        style={{ fontFamily: 'monospace', fontSize: '13px' }}
                      />
                    </div>
                  )}

                  {sharedFields.contentType === 'JSON' && (
                    <div className="form-group">
                      <label className="form-label">JSON Content (Shared)</label>
                      <textarea
                        className="form-control"
                        value={sharedFields.contentJson}
                        onChange={(e) => updateSharedField('contentJson', e.target.value)}
                        rows={20}
                        placeholder='{"key": "value"}'
                        style={{ fontFamily: 'monospace', fontSize: '13px' }}
                      />
                      <small style={{ color: '#6b7280', fontSize: '13px' }}>
                        JSON is shared across all languages.
                      </small>
                    </div>
                  )}
                </div>
              </div>

              {/* Attachments Management (only for ProductDownloads component in edit mode) */}
              {isEditMode &&
               sharedFields.contentType === 'COMPONENT' &&
               sharedFields.componentName === 'ProductDownloads' && (
                <div style={{ marginBottom: 32 }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16, color: '#374151' }}>
                    Attachments Management
                  </h4>

                  {loadingAttachments ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                      Loading attachments...
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 20 }}>
                      {/* Currently assigned attachments */}
                      <div>
                        <label className="form-label" style={{ marginBottom: 12, display: 'block' }}>
                          Assigned Attachments ({tabAttachments.length})
                        </label>
                        {tabAttachments.length === 0 ? (
                          <div style={{
                            padding: '16px',
                            border: '1px dashed #d1d5db',
                            borderRadius: '8px',
                            textAlign: 'center',
                            color: '#6b7280',
                            fontSize: '14px'
                          }}>
                            <FileText size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                            <div>No attachments assigned to this tab yet.</div>
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gap: 8 }}>
                            {tabAttachments.map((attachment: any) => (
                              <div
                                key={attachment.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 12,
                                  padding: '12px',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  background: '#f9fafb'
                                }}
                              >
                                <FileText size={20} style={{ color: '#3b82f6', flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                                    {attachment.displayLabel}
                                  </div>
                                  {attachment.description && (
                                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                                      {attachment.description}
                                    </div>
                                  )}
                                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                                    {attachment.fileName}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAttachment(attachment.id)}
                                  style={{
                                    padding: '6px',
                                    border: '1px solid #ef4444',
                                    borderRadius: '6px',
                                    background: '#fff',
                                    color: '#ef4444',
                                    cursor: 'pointer'
                                  }}
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
                        <label className="form-label" style={{ marginBottom: 12, display: 'block' }}>
                          Available Attachments
                        </label>
                        {availableAttachments.filter(
                          att => !tabAttachments.find(ta => ta.id === att.id)
                        ).length === 0 ? (
                          <div style={{
                            padding: '12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            textAlign: 'center',
                            color: '#6b7280',
                            fontSize: '13px'
                          }}>
                            All available attachments are already assigned.
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gap: 8 }}>
                            {availableAttachments
                              .filter(att => !tabAttachments.find(ta => ta.id === att.id))
                              .map((attachment: any) => (
                                <div
                                  key={attachment.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '12px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    background: '#fff'
                                  }}
                                >
                                  <FileText size={20} style={{ color: '#9ca3af', flexShrink: 0 }} />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                                      {attachment.displayLabel}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                                      {attachment.fileName}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleAddAttachment(attachment.id)}
                                    style={{
                                      padding: '6px 12px',
                                      border: '1px solid #3b82f6',
                                      borderRadius: '6px',
                                      background: '#fff',
                                      color: '#3b82f6',
                                      cursor: 'pointer',
                                      fontSize: '13px'
                                    }}
                                  >
                                    <Plus size={16} style={{ marginRight: 4 }} />
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
              <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16, color: '#374151' }}>
                  Advanced Settings
                </h4>

                <div style={{ display: 'grid', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 24 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={sharedFields.isActive}
                        onChange={(e) => updateSharedField('isActive', e.target.checked)}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px', color: '#374151' }}>Active</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={sharedFields.requiresAuthentication}
                        onChange={(e) => updateSharedField('requiresAuthentication', e.target.checked)}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px', color: '#374151' }}>Requires Authentication</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div style={{
                display: 'flex',
                gap: 12,
                paddingTop: 24,
                borderTop: '1px solid #e5e7eb'
              }}>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving}
                  style={{ minWidth: 120 }}
                >
                  {saving ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save size={16} style={{ marginRight: 8 }} />
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
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', fontSize: '14px' }}>
                    <span>Languages filled: {completedLanguages.length}/3</span>
                    <span>({completedLanguages.join(', ').toUpperCase()})</span>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMasterProductTabForm;
