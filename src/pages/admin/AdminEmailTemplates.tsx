import React, { useEffect, useState } from 'react';
import './AdminEmailTemplates.css';
import { emailTemplatesService, type EmailTemplate } from '../../services/emailTemplatesService';
import AdminLayout from './AdminLayout';
import { logError } from '../../services/logger';

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

  // Form state
  const [formData, setFormData] = useState<Partial<EmailTemplate>>({
    templateName: '',
    subjectLine: '',
    htmlContent: '',
    description: '',
    isActive: true,
  });

  // Fetch all templates
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

  // Select template for editing
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

  // Update template
  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const updated = await emailTemplatesService.updateTemplate(selectedTemplate.id, {
        ...formData,
        templateCode: selectedTemplate.templateCode, // Keep original code
      });

      // Update templates list
      setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
      setSelectedTemplate(updated);
      setIsEditing(false);
      setSuccessMessage('Template updated successfully!');

      // Auto-hide success message
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      logError('Failed to update template:', err);
      const message = err instanceof Error ? err.message : 'Failed to update template';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Preview template
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

  // Send test email
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

      // Auto-hide success message
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      logError('Failed to send test email:', err);
      const message = err instanceof Error ? err.message : 'Failed to send test email';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle active status
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
      <div className="admin-email-templates">
      {error && (
        <div className="alert alert-error">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          <span>✅ {successMessage}</span>
          <button onClick={() => setSuccessMessage(null)}>✕</button>
        </div>
      )}

      <div className="email-templates-layout">
        {/* Templates List */}
        <div className="templates-sidebar">
          <h2>Templates ({templates.length})</h2>
          <div className="templates-list">
            {templates.map(template => (
              <div
                key={template.id}
                className={`template-item ${selectedTemplate?.id === template.id ? 'active' : ''}`}
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="template-item-header">
                  <h3>{template.templateName}</h3>
                  <button
                    className={`status-badge ${template.isActive ? 'active' : 'inactive'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleActive(template);
                    }}
                    disabled={loading}
                  >
                    {template.isActive ? '✓ Active' : '✕ Inactive'}
                  </button>
                </div>
                <p className="template-code">{template.templateCode}</p>
                <p className="template-description">{template.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Template Editor */}
        <div className="template-editor">
          {selectedTemplate ? (
            <>
              <div className="editor-header">
                <h2>{selectedTemplate.templateName}</h2>
                <div className="editor-actions">
                  {!isEditing ? (
                    <>
                      <button onClick={() => setIsEditing(true)} className="btn btn-primary">
                        ✏️ Edit
                      </button>
                      <button onClick={handlePreview} className="btn btn-secondary" disabled={loading}>
                        👁️ Preview
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={handleUpdateTemplate} className="btn btn-success" disabled={loading}>
                        💾 Save Changes
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            templateName: selectedTemplate.templateName,
                            subjectLine: selectedTemplate.subjectLine,
                            htmlContent: selectedTemplate.htmlContent,
                            description: selectedTemplate.description,
                            isActive: selectedTemplate.isActive,
                          });
                        }}
                        className="btn btn-secondary"
                        disabled={loading}
                      >
                        ✕ Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="editor-content">
                {/* Template Info */}
                <div className="form-group">
                  <label>Template Code (Read-only)</label>
                  <input
                    type="text"
                    value={selectedTemplate.templateCode}
                    disabled
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>Template Name</label>
                  <input
                    type="text"
                    value={formData.templateName}
                    onChange={(e) => setFormData(prev => ({ ...prev, templateName: e.target.value }))}
                    disabled={!isEditing}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>Subject Line</label>
                  <input
                    type="text"
                    value={formData.subjectLine}
                    onChange={(e) => setFormData(prev => ({ ...prev, subjectLine: e.target.value }))}
                    disabled={!isEditing}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    disabled={!isEditing}
                    className="form-control"
                    rows={2}
                  />
                </div>

                {/* HTML Editor */}
                <div className="form-group">
                  <label>HTML Content</label>
                  <textarea
                    value={formData.htmlContent}
                    onChange={(e) => setFormData(prev => ({ ...prev, htmlContent: e.target.value }))}
                    disabled={!isEditing}
                    className="form-control html-editor"
                    rows={20}
                    spellCheck={false}
                    placeholder="Enter HTML content here..."
                  />
                  <p className="help-text">Edit the HTML template directly. Use placeholders like {`{{userName}}`}, {`{{userEmail}}`}, etc.</p>
                </div>

                {/* Placeholders Info */}
                {selectedTemplate.placeholders && Object.keys(selectedTemplate.placeholders).length > 0 && (
                  <div className="placeholders-info">
                    <h3>Available Placeholders</h3>
                    <div className="placeholders-list">
                      {Object.entries(selectedTemplate.placeholders).map(([key, description]) => (
                        <div key={key} className="placeholder-item">
                          <code>{`{{${key}}}`}</code>
                          <span>{description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Test Email Section */}
                <div className="test-email-section">
                  <h3>🧪 Send Test Email</h3>
                  <div className="test-email-form">
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="form-control"
                    />
                    <button
                      onClick={handleSendTestEmail}
                      className="btn btn-primary"
                      disabled={loading || !testEmail}
                    >
                      📤 Send Test
                    </button>
                  </div>
                  <p className="help-text">Test email will use sample data for placeholders</p>
                </div>
              </div>
            </>
          ) : (
            <div className="no-template-selected">
              <p>👈 Select a template from the list to edit</p>
            </div>
          )}
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <div className="preview-modal" onClick={() => setShowPreview(false)}>
            <div className="preview-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="preview-modal-header">
                <h2>📧 Email Preview</h2>
                <button onClick={() => setShowPreview(false)} className="close-btn">✕</button>
              </div>
              <div className="preview-modal-body">
                <iframe
                  srcDoc={previewHtml}
                  title="Email Preview"
                  className="preview-iframe"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </AdminLayout>
  );
};

export default AdminEmailTemplates;
