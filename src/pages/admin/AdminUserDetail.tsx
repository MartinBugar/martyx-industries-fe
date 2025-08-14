import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import './AdminUsers.css';
import { adminUsersService, type AdminUser } from '../../services/adminUsersService';

const AdminUserDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<boolean>(false);
  const [form, setForm] = useState<Record<string, unknown> & { password?: string }>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [fieldTypes, setFieldTypes] = useState<Record<string, 'boolean' | 'number' | 'string' | 'object'>>({});

  const loadUser = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminUsersService.getUserById(id);
      setUser(data);
      // Initialize form with all editable fields (exclude id and hidden sensitive ones)
      const initialForm: Record<string, unknown> = {};
      const types: Record<string, 'boolean' | 'number' | 'string' | 'object'> = {};
      Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
        if (hiddenKeys.has(key)) return;
        if (key === 'id') return; // keep id read-only
        types[key] = Array.isArray(value) ? 'object' : (typeof value === 'object' && value !== null ? 'object' : (typeof value as 'boolean' | 'number' | 'string' | 'object'));
        if (types[key] === 'object') {
          try {
            initialForm[key] = JSON.stringify(value, null, 2);
          } catch {
            initialForm[key] = String(value);
          }
        } else {
          initialForm[key] = value as unknown;
        }
      });
      setForm(prev => ({ ...prev, ...initialForm }));
      setFieldTypes(types);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load user';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      // Build payload converting strings to proper types
      const payload: Record<string, unknown> = {};
      Object.entries(form).forEach(([key, rawVal]) => {
        if (key === 'password') return; // handle separately
        if (key === 'id') return;
        if (hiddenKeys.has(key)) return;
        const t = fieldTypes[key];
        if (!t) {
          payload[key] = rawVal;
          return;
        }
        if (t === 'boolean') {
          payload[key] = Boolean(rawVal);
        } else if (t === 'number') {
          const str = String(rawVal ?? '');
          if (str.trim() === '') {
            payload[key] = null; // treat empty as null
          } else {
            const num = Number(str);
            if (Number.isNaN(num)) {
              throw new Error(`Field "${key}" must be a valid number`);
            }
            payload[key] = num;
          }
        } else if (t === 'object') {
          if (typeof rawVal === 'string') {
            const txt = rawVal as string;
            if (txt.trim() === '') {
              payload[key] = null;
            } else {
              try {
                payload[key] = JSON.parse(txt);
              } catch {
                throw new Error(`Field "${key}" contains invalid JSON`);
              }
            }
          } else {
            payload[key] = rawVal;
          }
        } else {
          payload[key] = rawVal as unknown;
        }
      });
      if ((form as { password?: string }).password) {
        payload.password = (form as { password?: string }).password;
      }
      const updated = await adminUsersService.updateUser(id, payload as Partial<AdminUser> & { password?: string });
      setUser(updated);
      setEditing(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update user';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setError(null);
    try {
      await adminUsersService.deleteUser(id);
      navigate('/admin/users');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete user';
      setError(msg);
    }
  };

  // Helper definitions for rendering all fields
  const hiddenKeys = new Set(['password', 'passwordHash', 'salt']);

  const formatValue = (val: unknown): string => {
    if (val === null) return 'null';
    if (val === undefined) return '—';
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      return String(val);
    }
    try {
      return JSON.stringify(val, null, 2);
    } catch {
      return String(val);
    }
  };

  const getSortedEntries = (obj: Record<string, unknown>): [string, unknown][] => {
    const preferredOrder = ['id', 'email', 'firstName', 'lastName', 'name', 'phone', 'roles', 'authorities', 'enabled', 'status', 'createdAt', 'updatedAt'];
    const entries = Object.entries(obj).filter(([k]) => !hiddenKeys.has(k));
    return entries.sort(([a], [b]) => {
      const ia = preferredOrder.indexOf(a);
      const ib = preferredOrder.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
  };

  return (
    <AdminLayout title={`User Detail`}>
      <div className="admin-page">
        <div className="admin-container">
          <div className="admin-header">
            <div>
              <h2 className="admin-title">User Detail</h2>
              <p className="admin-subtitle">View and manage a single user.</p>
            </div>
            <div>
              <Link to="/admin/users" className="btn btn-outline">Back to Users</Link>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {loading ? (
            <div className="admin-card">Loading...</div>
          ) : !user ? (
            <div className="admin-card">User not found.</div>
          ) : (
            <div className="admin-card">
              {!editing ? (
                <div>
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Name:</strong> {user.firstName || ''} {user.lastName || ''}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <div className="form-actions">
                    <button className="btn btn-outline" onClick={() => setEditing(true)}>Edit</button>
                    <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <h3 className="section-title">All User Data</h3>
                    <div className="table-wrapper" style={{ marginTop: 8 }}>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th style={{ width: 240 }}>Field</th>
                            <th>Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getSortedEntries(user as unknown as Record<string, unknown>).map(([key, val]) => (
                            <tr key={key}>
                              <td style={{ verticalAlign: 'top' }}><code>{key}</code></td>
                              <td>
                                {typeof val === 'object' && val !== null ? (
                                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{formatValue(val)}</pre>
                                ) : (
                                  <span>{formatValue(val)}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ marginTop: 8 }}>
                    <h3 className="section-title">Edit All Fields</h3>
                    <div className="table-wrapper" style={{ marginTop: 8 }}>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th style={{ width: 240 }}>Field</th>
                            <th>Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getSortedEntries(user as unknown as Record<string, unknown>).map(([key]) => {
                            if (key === 'id' || hiddenKeys.has(key)) return null;
                            const t = fieldTypes[key] ?? 'string';
                            const val = (form as Record<string, unknown>)[key];
                            return (
                              <tr key={key}>
                                <td style={{ verticalAlign: 'top' }}><code>{key}</code></td>
                                <td>
                                  {t === 'boolean' ? (
                                    <input
                                      type="checkbox"
                                      checked={Boolean(val)}
                                      onChange={(e) => {
                                        const checked = e.currentTarget.checked;
                                        setForm(prev => ({ ...prev, [key]: checked }));
                                      }}
                                    />
                                  ) : t === 'number' ? (
                                    <input
                                      type="number"
                                      className="form-input"
                                      value={String(val ?? '')}
                                      onChange={(e) => {
                                        const v = e.currentTarget.value;
                                        setForm(prev => ({ ...prev, [key]: v }));
                                      }}
                                    />
                                  ) : t === 'object' ? (
                                    <textarea
                                      className="form-input"
                                      rows={4}
                                      value={String(val ?? '')}
                                      onChange={(e) => {
                                        const v = e.currentTarget.value;
                                        setForm(prev => ({ ...prev, [key]: v }));
                                      }}
                                    />
                                  ) : (
                                    <input
                                      className="form-input"
                                      type={key === 'email' ? 'email' : 'text'}
                                      value={String(val ?? '')}
                                      onChange={(e) => {
                                        const v = e.currentTarget.value;
                                        setForm(prev => ({ ...prev, [key]: v }));
                                      }}
                                    />
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          <tr>
                            <td><code>password</code> <span style={{ color: '#888' }}>(optional)</span></td>
                            <td>
                              <input
                                type="password"
                                className="form-input"
                                value={(form as { password?: string }).password ?? ''}
                                onChange={(e) => {
                                  const v = e.currentTarget.value;
                                  setForm(prev => ({ ...prev, password: v }));
                                }}
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button className="btn btn-outline" onClick={() => { setEditing(false); loadUser(); }} disabled={saving}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUserDetail;
