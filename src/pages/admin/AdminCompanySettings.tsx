import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import GeneralSettingsTabs from './GeneralSettingsTabs';
import { adminCompanySettingsService } from '../../services/adminCompanySettingsService';
import type { CompanySettingsDto } from '../../types/invoice';
import { Button, SkeletonTable } from '../../components/ui';
import { Save, Building2, MapPin, Phone, Landmark, FileText, Scale } from 'lucide-react';
import './AdminUsers.css';
import './AdminButtonOverrides.css';
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
    invoice_issued_by_name: '',
    default_vat_rate_percent: 20,
    payment_terms_days: 0,
    default_payment_method: 'Online platba',
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
      await loadSettings();
    } catch (err: unknown) {
      logError('Failed to save company settings:', err);
      const message = err instanceof Error ? err.message : 'Failed to save settings. Please try again.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const FormSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="admin-card" style={{ marginBottom: '20px' }}>
      <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        {icon}
        {title}
      </h3>
      <div className="form-grid">
        {children}
      </div>
    </div>
  );

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
                <h2 className="section-title" style={{ marginBottom: '8px' }}>Company Settings</h2>
                <p style={{ margin: 0, color: 'var(--admin-secondary)', fontSize: '14px' }}>
                  Configure your company information for invoices and legal compliance (Slovak law).
                </p>
              </div>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={saving}
                loading={saving}
              >
                <Save size={16} />
                {hasExistingSettings ? 'Update Settings' : 'Create Settings'}
              </Button>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              <span>⚠️ {error}</span>
              <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>
          )}

          {success && (
            <div className="alert" style={{ background: 'var(--admin-success-bg)', color: '#065F46', border: '1px solid var(--admin-success)', marginBottom: '20px' }}>
              ✓ Company settings saved successfully!
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="admin-card">
              <SkeletonTable rows={6} columns={2} />
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Company Legal Information */}
              <FormSection title="Company Legal Information" icon={<Building2 size={20} style={{ color: 'var(--admin-accent)' }} />}>
                <div>
                  <label className="form-label">Company Name *</label>
                  <input
                    type="text"
                    value={settings.company_name || ''}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    required
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">IČO (Company ID) *</label>
                  <input
                    type="text"
                    value={settings.company_id || ''}
                    onChange={(e) => handleInputChange('company_id', e.target.value)}
                    required
                    className="form-input"
                    placeholder="12345678"
                  />
                </div>

                <div>
                  <label className="form-label">DIČ (Tax ID) *</label>
                  <input
                    type="text"
                    value={settings.tax_id || ''}
                    onChange={(e) => handleInputChange('tax_id', e.target.value)}
                    required
                    className="form-input"
                    placeholder="2023456789"
                  />
                </div>

                <div>
                  <label className="form-label">IČ DPH (VAT ID)</label>
                  <input
                    type="text"
                    value={settings.vat_id || ''}
                    onChange={(e) => handleInputChange('vat_id', e.target.value)}
                    className="form-input"
                    placeholder="SK2023456789"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={settings.is_vat_payer || false}
                      onChange={(e) => handleInputChange('is_vat_payer', e.target.checked)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    VAT Payer
                  </label>
                </div>

                <div>
                  <label className="form-label">VAT Registration Paragraph</label>
                  <input
                    type="text"
                    value={settings.vat_registration_paragraph || ''}
                    onChange={(e) => handleInputChange('vat_registration_paragraph', e.target.value)}
                    className="form-input"
                    placeholder="§4"
                  />
                </div>
              </FormSection>

              {/* Address */}
              <FormSection title="Address" icon={<MapPin size={20} style={{ color: 'var(--admin-accent)' }} />}>
                <div>
                  <label className="form-label">Street *</label>
                  <input
                    type="text"
                    value={settings.street || ''}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    required
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">City *</label>
                  <input
                    type="text"
                    value={settings.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    required
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Postal Code *</label>
                  <input
                    type="text"
                    value={settings.postal_code || ''}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    required
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    value={settings.country || ''}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Country Code</label>
                  <input
                    type="text"
                    value={settings.country_code || ''}
                    onChange={(e) => handleInputChange('country_code', e.target.value)}
                    className="form-input"
                    maxLength={2}
                  />
                </div>
              </FormSection>

              {/* Contact Information */}
              <FormSection title="Contact Information" icon={<Phone size={20} style={{ color: 'var(--admin-accent)' }} />}>
                <div>
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    value={settings.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    value={settings.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Website</label>
                  <input
                    type="url"
                    value={settings.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="form-input"
                  />
                </div>
              </FormSection>

              {/* Bank Details */}
              <FormSection title="Bank Details" icon={<Landmark size={20} style={{ color: 'var(--admin-accent)' }} />}>
                <div>
                  <label className="form-label">Bank Name</label>
                  <input
                    type="text"
                    value={settings.bank_name || ''}
                    onChange={(e) => handleInputChange('bank_name', e.target.value)}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Bank Account</label>
                  <input
                    type="text"
                    value={settings.bank_account || ''}
                    onChange={(e) => handleInputChange('bank_account', e.target.value)}
                    className="form-input"
                    placeholder="1234567890/1100"
                  />
                </div>

                <div>
                  <label className="form-label">IBAN</label>
                  <input
                    type="text"
                    value={settings.iban || ''}
                    onChange={(e) => handleInputChange('iban', e.target.value)}
                    className="form-input"
                    placeholder="SK12 1100 0000 0012 3456 7890"
                  />
                </div>

                <div>
                  <label className="form-label">SWIFT/BIC</label>
                  <input
                    type="text"
                    value={settings.swift_bic || ''}
                    onChange={(e) => handleInputChange('swift_bic', e.target.value)}
                    className="form-input"
                    placeholder="TATRSKBX"
                  />
                </div>
              </FormSection>

              {/* Registration Details */}
              <FormSection title="Registration Details" icon={<Scale size={20} style={{ color: 'var(--admin-accent)' }} />}>
                <div>
                  <label className="form-label">Registration Court</label>
                  <input
                    type="text"
                    value={settings.registration_court || ''}
                    onChange={(e) => handleInputChange('registration_court', e.target.value)}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Registration Number</label>
                  <input
                    type="text"
                    value={settings.registration_number || ''}
                    onChange={(e) => handleInputChange('registration_number', e.target.value)}
                    className="form-input"
                  />
                </div>
              </FormSection>

              {/* Invoice Settings */}
              <FormSection title="Invoice Settings" icon={<FileText size={20} style={{ color: 'var(--admin-accent)' }} />}>
                <div>
                  <label className="form-label">Invoice Prefix</label>
                  <input
                    type="text"
                    value={settings.invoice_prefix || ''}
                    onChange={(e) => handleInputChange('invoice_prefix', e.target.value)}
                    className="form-input"
                    placeholder="FAK-"
                  />
                </div>

                <div>
                  <label className="form-label">Issued By (Name)</label>
                  <input
                    type="text"
                    value={settings.invoice_issued_by_name || ''}
                    onChange={(e) => handleInputChange('invoice_issued_by_name', e.target.value)}
                    className="form-input"
                    placeholder="Ing. Martin Bugar"
                  />
                  <small style={{ color: 'var(--admin-secondary)', fontSize: '12px' }}>
                    Name shown on invoice as "Issued by"
                  </small>
                </div>

                <div>
                  <label className="form-label">Default VAT Rate (%)</label>
                  <input
                    type="number"
                    value={settings.default_vat_rate_percent || 20}
                    onChange={(e) => handleInputChange('default_vat_rate_percent', parseInt(e.target.value) || 20)}
                    className="form-input"
                    min={0}
                    max={100}
                  />
                  <small style={{ color: 'var(--admin-secondary)', fontSize: '12px' }}>
                    Used as fallback when order has no VAT data
                  </small>
                </div>

                <div>
                  <label className="form-label">Payment Terms (Days)</label>
                  <input
                    type="number"
                    value={settings.payment_terms_days || 0}
                    onChange={(e) => handleInputChange('payment_terms_days', parseInt(e.target.value) || 0)}
                    className="form-input"
                    min={0}
                  />
                  <small style={{ color: 'var(--admin-secondary)', fontSize: '12px' }}>
                    Number of days until payment is due (0 = immediate)
                  </small>
                </div>

                <div>
                  <label className="form-label">Default Payment Method</label>
                  <input
                    type="text"
                    value={settings.default_payment_method || ''}
                    onChange={(e) => handleInputChange('default_payment_method', e.target.value)}
                    className="form-input"
                    placeholder="Online platba"
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Invoice Footer Text</label>
                  <textarea
                    value={settings.invoice_footer_text || ''}
                    onChange={(e) => handleInputChange('invoice_footer_text', e.target.value)}
                    className="form-input"
                    rows={2}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Invoice Notes (VAT Note)</label>
                  <textarea
                    value={settings.invoice_notes || ''}
                    onChange={(e) => handleInputChange('invoice_notes', e.target.value)}
                    className="form-input"
                    rows={3}
                    placeholder="* VAT reverse charge. Tax is paid by the customer."
                  />
                  <small style={{ color: 'var(--admin-secondary)', fontSize: '12px' }}>
                    Shown on invoice as VAT note
                  </small>
                </div>
              </FormSection>

              {/* Footer Tip */}
              <div className="admin-card" style={{ background: 'var(--admin-accent-light)', borderColor: 'var(--admin-accent)' }}>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--admin-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  💡 <strong>Note:</strong> These settings are used for invoice generation and must comply with Slovak law requirements.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCompanySettings;
