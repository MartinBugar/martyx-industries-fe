import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Globe, X } from 'lucide-react';
import { adminTaxService, TaxZone, TaxZoneRequest } from '../../services/adminTaxService';
import { logError } from '../../services/logger';
import toast from 'react-hot-toast';
import './AdminTaxZoneForm.css';

// Country data (ISO 3166-1 alpha-2)
const COUNTRIES: { code: string; name: string }[] = [
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'GR', name: 'Greece' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MT', name: 'Malta' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  // Non-EU European
  { code: 'CH', name: 'Switzerland' },
  { code: 'NO', name: 'Norway' },
  { code: 'GB', name: 'United Kingdom' },
  // Major worldwide
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
].sort((a, b) => a.name.localeCompare(b.name));

const EU_COUNTRY_CODES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
];

/**
 * Admin Tax Zone Form - Create/Edit tax zones
 */
const AdminTaxZoneForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TaxZoneRequest>({
    name: '',
    code: '',
    description: '',
    countryCodes: [],
    priority: 0,
    active: true,
    reverseChargeEligible: false,
  });

  const [countrySearch, setCountrySearch] = useState('');

  // Load existing zone if editing
  useEffect(() => {
    if (isEdit) {
      loadZone();
    }
  }, [id]);

  const loadZone = async () => {
    try {
      setLoading(true);
      const zone = await adminTaxService.getTaxZoneById(parseInt(id!));
      setForm({
        name: zone.name,
        code: zone.code || '',
        description: zone.description || '',
        countryCodes: zone.countryCodes || [],
        priority: zone.priority,
        active: zone.active,
        reverseChargeEligible: zone.reverseChargeEligible,
      });
    } catch (error) {
      logError('Failed to load tax zone:', error);
      toast.error('Failed to load tax zone');
      navigate('/admin/tax/zones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      setSaving(true);

      if (isEdit) {
        await adminTaxService.updateTaxZone(parseInt(id!), form);
        toast.success('Tax zone updated');
      } else {
        await adminTaxService.createTaxZone(form);
        toast.success('Tax zone created');
      }

      navigate('/admin/tax/zones');
    } catch (error: any) {
      logError('Failed to save tax zone:', error);
      toast.error(error.message || 'Failed to save tax zone');
    } finally {
      setSaving(false);
    }
  };

  const toggleCountry = (code: string) => {
    const current = form.countryCodes || [];
    if (current.includes(code)) {
      setForm({ ...form, countryCodes: current.filter(c => c !== code) });
    } else {
      setForm({ ...form, countryCodes: [...current, code] });
    }
  };

  const selectAllEU = () => {
    setForm({ ...form, countryCodes: [...EU_COUNTRY_CODES] });
  };

  const clearAllCountries = () => {
    setForm({ ...form, countryCodes: [] });
  };

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="admin-tax-zone-form">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-tax-zone-form">
      <div className="page-header">
        <button
          className="btn-back"
          onClick={() => navigate('/admin/tax/zones')}
        >
          <ArrowLeft size={18} />
          Back to Tax Zones
        </button>
        <h1>{isEdit ? 'Edit Tax Zone' : 'Create Tax Zone'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-section">
          <h2>Basic Information</h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Zone Name *</label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., European Union"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="code">Zone Code</label>
              <input
                id="code"
                type="text"
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g., EU"
                maxLength={50}
              />
              <span className="help-text">Unique identifier for the zone</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description of this tax zone..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <input
                id="priority"
                type="number"
                value={form.priority}
                onChange={e => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                min={0}
                max={100}
              />
              <span className="help-text">Higher priority zones are matched first (0-100)</span>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={e => setForm({ ...form, active: e.target.checked })}
                />
                <span>Active</span>
              </label>
              <span className="help-text">Only active zones are used for tax calculation</span>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.reverseChargeEligible}
                  onChange={e => setForm({ ...form, reverseChargeEligible: e.target.checked })}
                />
                <span>Reverse Charge Eligible</span>
              </label>
              <span className="help-text">B2B transactions can use VAT reverse charge</span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h2>
              <Globe size={20} />
              Countries
            </h2>
            <div className="country-actions">
              <button type="button" className="btn btn-sm" onClick={selectAllEU}>
                Select All EU
              </button>
              <button type="button" className="btn btn-sm" onClick={clearAllCountries}>
                Clear All
              </button>
            </div>
          </div>

          <div className="country-search">
            <input
              type="text"
              value={countrySearch}
              onChange={e => setCountrySearch(e.target.value)}
              placeholder="Search countries..."
            />
          </div>

          <div className="selected-countries">
            {(form.countryCodes || []).length > 0 ? (
              <>
                <span className="selected-label">
                  {form.countryCodes?.length} selected:
                </span>
                {form.countryCodes?.map(code => {
                  const country = COUNTRIES.find(c => c.code === code);
                  return (
                    <span key={code} className="country-tag">
                      {country?.name || code}
                      <button
                        type="button"
                        onClick={() => toggleCountry(code)}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
              </>
            ) : (
              <span className="no-selection">
                No countries selected (applies to all unassigned countries)
              </span>
            )}
          </div>

          <div className="country-grid">
            {filteredCountries.map(country => (
              <label
                key={country.code}
                className={`country-item ${form.countryCodes?.includes(country.code) ? 'selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={form.countryCodes?.includes(country.code) || false}
                  onChange={() => toggleCountry(country.code)}
                />
                <span className="country-code">{country.code}</span>
                <span className="country-name">{country.name}</span>
                {EU_COUNTRY_CODES.includes(country.code) && (
                  <span className="eu-badge">EU</span>
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/admin/tax/zones')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save size={18} />
                {isEdit ? 'Update Zone' : 'Create Zone'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminTaxZoneForm;
