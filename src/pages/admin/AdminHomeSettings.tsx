import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import GeneralSettingsTabs from './GeneralSettingsTabs';
import { homePageSettingsService, type HomePageSetting } from '../../services/homePageSettingsService';
import { Button, Badge, SkeletonTable } from '../../components/ui';
import { Save, Eye, EyeOff } from 'lucide-react';
import './AdminUsers.css';
import './AdminButtonOverrides.css';
import { logError } from '../../services/logger';

const AdminHomeSettings: React.FC = () => {
  const [settings, setSettings] = useState<HomePageSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
      setSettings(prev => prev.map(s =>
        s.id === id ? { ...s, isVisible: !currentValue } : s
      ));
      await homePageSettingsService.updateVisibility(id, !currentValue);
    } catch (err) {
      logError('Failed to update visibility:', err);
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
      case 'hero': return '🎯';
      case 'how_it_works': return '⚙️';
      case 'featured_products': return '⭐';
      case 'testimonials': return '💬';
      default: return '📄';
    }
  };

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
                <h2 className="section-title" style={{ marginBottom: '8px' }}>Configure Homepage Sections</h2>
                <p style={{ margin: 0, color: 'var(--admin-secondary)', fontSize: '14px' }}>
                  Control which sections are visible on the homepage. Changes take effect immediately.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={handleSaveAll}
                disabled={saving}
                loading={saving}
              >
                <Save size={16} />
                Save All Changes
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

          {saveSuccess && (
            <div className="alert" style={{ background: 'var(--admin-success-bg)', color: '#065F46', border: '1px solid var(--admin-success)', marginBottom: '20px' }}>
              ✓ Settings saved successfully!
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="admin-card">
              <SkeletonTable rows={4} columns={3} />
            </div>
          ) : (
            <>
              {/* Settings Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                {settings.map((setting) => (
                  <div key={setting.id} className="admin-card" style={{ padding: '20px' }}>
                    {/* Card Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        background: 'var(--admin-bg-secondary)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        flexShrink: 0
                      }}>
                        {getSettingSectionIcon(setting.sectionKey)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--admin-primary)' }}>
                          {setting.sectionName}
                        </h3>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--admin-secondary)', fontFamily: 'monospace' }}>
                          {setting.sectionKey}
                        </p>
                      </div>
                    </div>

                    {/* Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--admin-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--admin-secondary)' }}>Visible</span>
                        <label className="toggle-label" style={{ margin: 0 }}>
                          <input
                            type="checkbox"
                            className="toggle-checkbox"
                            checked={setting.isVisible}
                            onChange={() => handleVisibilityToggle(setting.id, setting.isVisible)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--admin-secondary)' }}>
                          Order: <strong style={{ color: 'var(--admin-accent)' }}>{setting.displayOrder}</strong>
                        </span>
                        <Badge variant={setting.isVisible ? 'success' : 'secondary'} size="sm">
                          {setting.isVisible ? (
                            <><Eye size={12} style={{ marginRight: 4 }} /> Visible</>
                          ) : (
                            <><EyeOff size={12} style={{ marginRight: 4 }} /> Hidden</>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Tip */}
              <div className="admin-card" style={{ background: 'var(--admin-accent-light)', borderColor: 'var(--admin-accent)' }}>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--admin-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  💡 <strong>Tip:</strong> Disable sections that don't have content yet. You can re-enable them anytime.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminHomeSettings;
