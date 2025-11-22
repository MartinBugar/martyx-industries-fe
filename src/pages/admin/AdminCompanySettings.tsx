import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { adminCompanySettingsService } from '../../services/adminCompanySettingsService';
import type { CompanySettingsDto } from '../../types/invoice';
import './AdminCompanySettings.css';
import { logError } from '../../services/logger';

const AdminCompanySettings: React.FC = () => {
  const [settings, setSettings] = useState<Partial<CompanySettingsDto>>({
    company_name: '',
    company_id: '',
    tax_id: '',
    vat_id: '',
    is_vat_payer: true,
    vat_registration_paragraph: '',
    street: '',
    city: '',
    postal_code: '',
    country: 'Slovakia',
    country_code: 'SK',
    email: '',
    phone: '',
    website: '',
    bank_name: '',
    bank_account: '',
    iban: '',
    swift_bic: '',
    registration_court: '',
    registration_number: '',
    invoice_prefix: 'FAK-',
    invoice_footer_text: '',
    invoice_notes: '',
    is_active: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasExistingSettings, setHasExistingSettings] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await adminCompanySettingsService.getActiveSettings();
      setSettings(data);
      setHasExistingSettings(true);
    } catch (err) {
      logError('Failed to load company settings:', err);
      // If no settings exist yet, keep the defaults
      setHasExistingSettings(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CompanySettingsDto, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      if (hasExistingSettings && settings.id) {
        await adminCompanySettingsService.update(settings.id, settings);
      } else {
        await adminCompanySettingsService.create(settings);
        setHasExistingSettings(true);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await loadSettings(); // Reload to get updated data
    } catch (err: unknown) {
      logError('Failed to save company settings:', err);
      const message = err instanceof Error ? err.message : 'Failed to save settings. Please try again.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Company Settings">
      <div className="admin-company-settings">
        <div className="settings-header">
          <div>
            <h2>Company Settings</h2>
            <p className="settings-description">
              Configure your company information for invoices and legal compliance (Slovak law).
            </p>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="alert-close">×</button>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span className="alert-icon">✓</span>
            <span>Company settings saved successfully!</span>
          </div>
        )}

        {loading ? (
          <div className="settings-loading">
            <div className="spinner"></div>
            <p>Loading settings...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="settings-form">
            {/* Company Legal Information */}
            <div className="form-section">
              <h3 className="section-title">Company Legal Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="company_name" className="required">Company Name</label>
                  <input
                    id="company_name"
                    type="text"
                    value={settings.company_name || ''}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    required
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="company_id" className="required">IČO (Company ID)</label>
                  <input
                    id="company_id"
                    type="text"
                    value={settings.company_id || ''}
                    onChange={(e) => handleInputChange('company_id', e.target.value)}
                    required
                    className="form-control"
                    placeholder="12345678"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="tax_id" className="required">DIČ (Tax ID)</label>
                  <input
                    id="tax_id"
                    type="text"
                    value={settings.tax_id || ''}
                    onChange={(e) => handleInputChange('tax_id', e.target.value)}
                    required
                    className="form-control"
                    placeholder="2023456789"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="vat_id">IČ DPH (VAT ID)</label>
                  <input
                    id="vat_id"
                    type="text"
                    value={settings.vat_id || ''}
                    onChange={(e) => handleInputChange('vat_id', e.target.value)}
                    className="form-control"
                    placeholder="SK2023456789"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.is_vat_payer || false}
                      onChange={(e) => handleInputChange('is_vat_payer', e.target.checked)}
                    />
                    <span>VAT Payer</span>
                  </label>
                </div>

                <div className="form-group">
                  <label htmlFor="vat_registration_paragraph">VAT Registration Paragraph</label>
                  <input
                    id="vat_registration_paragraph"
                    type="text"
                    value={settings.vat_registration_paragraph || ''}
                    onChange={(e) => handleInputChange('vat_registration_paragraph', e.target.value)}
                    className="form-control"
                    placeholder="§4"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="form-section">
              <h3 className="section-title">Address</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="street" className="required">Street</label>
                  <input
                    id="street"
                    type="text"
                    value={settings.street || ''}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    required
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="city" className="required">City</label>
                  <input
                    id="city"
                    type="text"
                    value={settings.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    required
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="postal_code" className="required">Postal Code</label>
                  <input
                    id="postal_code"
                    type="text"
                    value={settings.postal_code || ''}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    required
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="country">Country</label>
                  <input
                    id="country"
                    type="text"
                    value={settings.country || ''}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="country_code">Country Code</label>
                  <input
                    id="country_code"
                    type="text"
                    value={settings.country_code || ''}
                    onChange={(e) => handleInputChange('country_code', e.target.value)}
                    className="form-control"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="form-section">
              <h3 className="section-title">Contact Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="email" className="required">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={settings.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    type="tel"
                    value={settings.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    type="url"
                    value={settings.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="form-section">
              <h3 className="section-title">Bank Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="bank_name">Bank Name</label>
                  <input
                    id="bank_name"
                    type="text"
                    value={settings.bank_name || ''}
                    onChange={(e) => handleInputChange('bank_name', e.target.value)}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bank_account">Bank Account</label>
                  <input
                    id="bank_account"
                    type="text"
                    value={settings.bank_account || ''}
                    onChange={(e) => handleInputChange('bank_account', e.target.value)}
                    className="form-control"
                    placeholder="1234567890/1100"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="iban">IBAN</label>
                  <input
                    id="iban"
                    type="text"
                    value={settings.iban || ''}
                    onChange={(e) => handleInputChange('iban', e.target.value)}
                    className="form-control"
                    placeholder="SK12 1100 0000 0012 3456 7890"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="swift_bic">SWIFT/BIC</label>
                  <input
                    id="swift_bic"
                    type="text"
                    value={settings.swift_bic || ''}
                    onChange={(e) => handleInputChange('swift_bic', e.target.value)}
                    className="form-control"
                    placeholder="TATRSKBX"
                  />
                </div>
              </div>
            </div>

            {/* Registration Details */}
            <div className="form-section">
              <h3 className="section-title">Registration Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="registration_court">Registration Court</label>
                  <input
                    id="registration_court"
                    type="text"
                    value={settings.registration_court || ''}
                    onChange={(e) => handleInputChange('registration_court', e.target.value)}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="registration_number">Registration Number</label>
                  <input
                    id="registration_number"
                    type="text"
                    value={settings.registration_number || ''}
                    onChange={(e) => handleInputChange('registration_number', e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            {/* Invoice Settings */}
            <div className="form-section">
              <h3 className="section-title">Invoice Settings</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="invoice_prefix">Invoice Prefix</label>
                  <input
                    id="invoice_prefix"
                    type="text"
                    value={settings.invoice_prefix || ''}
                    onChange={(e) => handleInputChange('invoice_prefix', e.target.value)}
                    className="form-control"
                    placeholder="FAK-"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="invoice_footer_text">Invoice Footer Text</label>
                  <textarea
                    id="invoice_footer_text"
                    value={settings.invoice_footer_text || ''}
                    onChange={(e) => handleInputChange('invoice_footer_text', e.target.value)}
                    className="form-control"
                    rows={2}
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="invoice_notes">Invoice Notes</label>
                  <textarea
                    id="invoice_notes"
                    value={settings.invoice_notes || ''}
                    onChange={(e) => handleInputChange('invoice_notes', e.target.value)}
                    className="form-control"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : hasExistingSettings ? 'Update Settings' : 'Create Settings'}
              </button>
            </div>
          </form>
        )}

        <div className="settings-footer">
          <p className="footer-note">
            💡 <strong>Note:</strong> These settings are used for invoice generation and must comply with Slovak law requirements.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCompanySettings;
