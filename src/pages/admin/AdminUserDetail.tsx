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
  const [form, setForm] = useState<Partial<AdminUser> & { password?: string }>({});
  const [saving, setSaving] = useState<boolean>(false);

  const loadUser = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminUsersService.getUserById(id);
      setUser(data);
      setForm({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
      });
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
      const updated = await adminUsersService.updateUser(id, form);
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
                </div>
              ) : (
                <div>
                  <div className="form-grid">
                    <div>
                      <label className="form-label">First Name</label>
                      <input
                        className="form-input"
                        value={form.firstName ?? ''}
                        onChange={(e) => setForm(prev => ({ ...prev, firstName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="form-label">Last Name</label>
                      <input
                        className="form-input"
                        value={form.lastName ?? ''}
                        onChange={(e) => setForm(prev => ({ ...prev, lastName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-input"
                        value={form.email ?? ''}
                        onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="form-label">New Password (optional)</label>
                      <input
                        type="password"
                        className="form-input"
                        value={form.password ?? ''}
                        onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                      />
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
