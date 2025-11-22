import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { homePageSettingsService, type HomePageSetting } from '../../services/homePageSettingsService';
import './AdminHomeSettings.css';
import { logInfo, logWarn, logError } from '../../services/logger';

const AdminHomeSettings: React.FC = () => {
  const [settings, setSettings] = useState<HomePageSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await homePageSettingsService.getAllSettings();
      setSettings(data);
    } catch (err) {
      logError('Failed to load home page settings:', err);
      setError('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVisibilityToggle = async (id: number, currentValue: boolean) => {
    try {
      // Optimistic update
      setSettings(prev => prev.map(s =>
        s.id === id ? { ...s, isVisible: !currentValue } : s
      ));

      await homePageSettingsService.updateVisibility(id, !currentValue);
    } catch (err) {
      logError('Failed to update visibility:', err);
      // Revert on error
      setSettings(prev => prev.map(s =>
        s.id === id ? { ...s, isVisible: currentValue } : s
      ));
      setError('Failed to update visibility. Please try again.');
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      setError(null);

      await homePageSettingsService.bulkUpdateSettings(settings);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      logError('Failed to save settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getSettingSectionIcon = (sectionKey: string) => {
    switch (sectionKey) {
      case 'hero':
        return '🎯';
      case 'how_it_works':
        return '⚙️';
      case 'featured_products':
        return '⭐';
      case 'testimonials':
        return '💬';
      default:
        return '📄';
    }
  };

  return (
    <AdminLayout title="Home Page Settings">
      <div className="admin-home-settings">
        <div className="settings-header">
          <div>
            <h2>Configure Homepage Sections</h2>
            <p className="settings-description">
              Control which sections are visible on the homepage. Changes take effect immediately.
            </p>
          </div>
          <button
            className="btn-save-all"
            onClick={handleSaveAll}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="alert-close">×</button>
          </div>
        )}

        {saveSuccess && (
          <div className="alert alert-success">
            <span className="alert-icon">✓</span>
            <span>Settings saved successfully!</span>
          </div>
        )}

        {loading ? (
          <div className="settings-loading">
            <div className="spinner"></div>
            <p>Loading settings...</p>
          </div>
        ) : (
          <div className="settings-grid">
            {settings.map((setting) => (
              <div key={setting.id} className="setting-card">
                <div className="setting-header">
                  <div className="setting-icon">
                    {getSettingSectionIcon(setting.sectionKey)}
                  </div>
                  <div className="setting-info">
                    <h3 className="setting-name">{setting.sectionName}</h3>
                    <p className="setting-key">{setting.sectionKey}</p>
                  </div>
                </div>

                <div className="setting-controls">
                  <div className="setting-control-row">
                    <label className="toggle-label">
                      <span className="toggle-text">Visible</span>
                      <button
                        className={`toggle ${setting.isVisible ? 'active' : ''}`}
                        onClick={() => handleVisibilityToggle(setting.id, setting.isVisible)}
                        aria-label={`Toggle ${setting.sectionName} visibility`}
                        role="switch"
                        aria-checked={setting.isVisible}
                      >
                        <span className="toggle-slider"></span>
                      </button>
                    </label>
                  </div>

                  <div className="setting-meta">
                    <span className="meta-item">
                      <span className="meta-label">Order:</span>
                      <span className="meta-value">{setting.displayOrder}</span>
                    </span>
                    <span className={`status-badge ${setting.isVisible ? 'visible' : 'hidden'}`}>
                      {setting.isVisible ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="settings-footer">
          <p className="footer-note">
            💡 <strong>Tip:</strong> Disable sections that don't have content yet. You can re-enable them anytime.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminHomeSettings;
