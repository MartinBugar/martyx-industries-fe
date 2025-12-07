import React, { useEffect, useState } from 'react';
import { emailTemplatesService, type EmailTemplate } from '../../services/emailTemplatesService';
import AdminLayout from './AdminLayout';
import { Button, Badge, SkeletonTable } from '../../components/ui';
import { Mail, Edit, Eye, Save, X, Send, Code, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { logError } from '../../services/logger';
import './AdminUsers.css';
import './AdminButtonOverrides.css';
import './AdminEmailTemplates.css';

const AdminEmailTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<EmailTemplate>>({
    templateName: '',
    subjectLine: '',
    htmlContent: '',
    description: '',
    isActive: true,
  });

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await emailTemplatesService.getAllTemplates();
      setTemplates(data);
    } catch (err: unknown) {
      logError('Failed to fetch templates:', err);
      const message = err instanceof Error ? err.message : 'Failed to fetch templates';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      templateName: template.templateName,
      subjectLine: template.subjectLine,
      htmlContent: template.htmlContent,
      description: template.description,
      isActive: template.isActive,
    });
    setIsEditing(false);
    setShowPreview(false);
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const updated = await emailTemplatesService.updateTemplate(selectedTemplate.id, {
        ...formData,
        templateCode: selectedTemplate.templateCode,
      });

      setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
      setSelectedTemplate(updated);
      setIsEditing(false);
      setSuccessMessage('Template updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      logError('Failed to update template:', err);
      const message = err instanceof Error ? err.message : 'Failed to update template';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedTemplate) return;
    try {
      setLoading(true);
      setError(null);
      const html = await emailTemplatesService.previewTemplate(selectedTemplate.templateCode);
      setPreviewHtml(html);
      setShowPreview(true);
    } catch (err: unknown) {
      logError('Failed to preview template:', err);
      const message = err instanceof Error ? err.message : 'Failed to generate preview';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!selectedTemplate || !testEmail) {
      setError('Please enter a valid email address');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      await emailTemplatesService.sendTestEmail(selectedTemplate.templateCode, {
        recipientEmail: testEmail,
      });

      setSuccessMessage(`Test email sent to ${testEmail}!`);
      setTestEmail('');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      logError('Failed to send test email:', err);
      const message = err instanceof Error ? err.message : 'Failed to send test email';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (template: EmailTemplate) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await emailTemplatesService.toggleActive(template.id, !template.isActive);
      setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
      if (selectedTemplate?.id === updated.id) {
        setSelectedTemplate(updated);
      }
    } catch (err: unknown) {
      logError('Failed to toggle status:', err);
      const message = err instanceof Error ? err.message : 'Failed to toggle status';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Email Templates">
      <div className="admin-page">
        <div className="admin-container admin-email-tpl-container">
          {/* Header */}
          <div className="admin-card admin-email-tpl-header-card">
            <div className="admin-email-tpl-header-flex">
              <div>
                <h2 className="section-title admin-email-tpl-title">
                  <Mail size={24} className="admin-email-tpl-title-icon" />
                  Email Templates
                </h2>
                <p className="admin-email-tpl-desc">
                  Manage and customize email templates for your application.
                </p>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert alert-error admin-email-tpl-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="admin-email-tpl-alert-close">×</button>
            </div>
          )}

          {successMessage && (
            <div className="alert admin-email-tpl-success-alert">
              <CheckCircle size={16} />
              {successMessage}
            </div>
          )}

          {/* Main Content - Two Column Layout */}
          <div className="admin-email-tpl-grid">
            {/* Templates Sidebar */}
            <div className="admin-card admin-email-tpl-sidebar">
              <div className="admin-email-tpl-sidebar-header">
                <h3 className="admin-email-tpl-sidebar-title">
                  Templates ({templates.length})
                </h3>
              </div>
              <div className="admin-email-tpl-sidebar-scroll">
                {loading && templates.length === 0 ? (
                  <div className="admin-email-tpl-sidebar-loading">
                    <SkeletonTable rows={5} columns={1} />
                  </div>
                ) : (
                  templates.map(template => (
                    <div
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className={`admin-email-tpl-item ${selectedTemplate?.id === template.id ? 'admin-email-tpl-item-selected' : ''}`}
                    >
                      <div className="admin-email-tpl-item-header">
                        <h4 className="admin-email-tpl-item-name">
                          {template.templateName}
                        </h4>
                        <Badge
                          variant={template.isActive ? 'success' : 'warning'}
                          size="sm"
                          onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleToggleActive(template); }}
                          className="admin-email-tpl-item-badge"
                        >
                          {template.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="admin-email-tpl-item-code">
                        {template.templateCode}
                      </p>
                      <p className="admin-email-tpl-item-desc">
                        {template.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Template Editor */}
            <div className="admin-card admin-email-tpl-editor">
              {selectedTemplate ? (
                <>
                  {/* Editor Header */}
                  <div className="admin-email-tpl-editor-header">
                    <h3 className="admin-email-tpl-editor-title">
                      {selectedTemplate.templateName}
                    </h3>
                    <div className="admin-email-tpl-editor-actions">
                      {!isEditing ? (
                        <>
                          <Button variant="primary" size="sm" onClick={() => setIsEditing(true)}>
                            <Edit size={14} />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={handlePreview} disabled={loading}>
                            <Eye size={14} />
                            Preview
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="primary" size="sm" onClick={handleUpdateTemplate} disabled={loading} loading={loading}>
                            <Save size={14} />
                            Save Changes
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); handleSelectTemplate(selectedTemplate); }} disabled={loading}>
                            <X size={14} />
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Editor Content */}
                  <div className="admin-email-tpl-editor-content">
                    <div className="form-grid admin-email-tpl-form-grid">
                      <div>
                        <label className="form-label">Template Code</label>
                        <input type="text" value={selectedTemplate.templateCode} disabled className="form-input admin-email-tpl-input-code" />
                      </div>
                      <div>
                        <label className="form-label">Template Name</label>
                        <input
                          type="text"
                          value={formData.templateName}
                          onChange={(e) => setFormData(prev => ({ ...prev, templateName: e.target.value }))}
                          disabled={!isEditing}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="admin-email-tpl-field">
                      <label className="form-label">Subject Line</label>
                      <input
                        type="text"
                        value={formData.subjectLine}
                        onChange={(e) => setFormData(prev => ({ ...prev, subjectLine: e.target.value }))}
                        disabled={!isEditing}
                        className="form-input"
                      />
                    </div>

                    <div className="admin-email-tpl-field">
                      <label className="form-label">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        disabled={!isEditing}
                        className="form-input"
                        rows={2}
                      />
                    </div>

                    <div className="admin-email-tpl-field">
                      <label className="form-label admin-email-tpl-label-icon">
                        <Code size={16} />
                        HTML Content
                      </label>
                      <textarea
                        value={formData.htmlContent}
                        onChange={(e) => setFormData(prev => ({ ...prev, htmlContent: e.target.value }))}
                        disabled={!isEditing}
                        className="form-input admin-email-tpl-textarea-code"
                        rows={15}
                      />
                      <p className="admin-email-tpl-help">
                        Use placeholders like {`{{userName}}`}, {`{{userEmail}}`}, etc.
                      </p>
                    </div>

                    {/* Placeholders */}
                    {selectedTemplate.placeholders && Object.keys(selectedTemplate.placeholders).length > 0 && (
                      <div className="admin-email-tpl-placeholders">
                        <h4 className="admin-email-tpl-placeholders-title">
                          <FileText size={16} />
                          Available Placeholders
                        </h4>
                        <div className="admin-email-tpl-placeholders-grid">
                          {Object.entries(selectedTemplate.placeholders).map(([key, description]) => (
                            <div key={key} className="admin-email-tpl-placeholder-item">
                              <code className="admin-email-tpl-placeholder-code">
                                {`{{${key}}}`}
                              </code>
                              <span className="admin-email-tpl-placeholder-desc">{description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Test Email */}
                    <div className="admin-email-tpl-test">
                      <h4 className="admin-email-tpl-test-title">
                        <Send size={16} />
                        Send Test Email
                      </h4>
                      <div className="admin-email-tpl-test-form">
                        <input
                          type="email"
                          placeholder="Enter email address"
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                          className="form-input admin-email-tpl-test-input"
                        />
                        <Button variant="primary" onClick={handleSendTestEmail} disabled={loading || !testEmail}>
                          <Send size={14} />
                          Send
                        </Button>
                      </div>
                      <p className="admin-email-tpl-help">
                        Test email will use sample data for placeholders.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="admin-email-tpl-empty">
                  <Mail size={48} className="admin-email-tpl-empty-icon" />
                  <p className="admin-email-tpl-empty-text">Select a template from the list to edit</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="admin-email-tpl-preview-overlay" onClick={() => setShowPreview(false)}>
          <div className="admin-card admin-email-tpl-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-email-tpl-preview-header">
              <h3 className="admin-email-tpl-preview-title">
                <Eye size={18} />
                Email Preview
              </h3>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                <X size={14} />
                Close
              </Button>
            </div>
            <div className="admin-email-tpl-preview-body">
              <iframe
                srcDoc={previewHtml}
                title="Email Preview"
                className="admin-email-tpl-preview-iframe"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminEmailTemplates;
