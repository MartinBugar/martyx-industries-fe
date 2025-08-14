import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import './AdminUsers.css';
import { adminUsersService, type AdminUser, type AdminSignupRequest } from '../../services/adminUsersService';

const initialCreate: AdminSignupRequest & { confirmPassword?: string } = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  confirmPassword: '',
};

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [createData, setCreateData] = useState<typeof initialCreate>({ ...initialCreate });
  const [creating, setCreating] = useState<boolean>(false);

  // Edit row state
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editData, setEditData] = useState<Partial<AdminUser> & { password?: string }>({});
  const [saving, setSaving] = useState<boolean>(false);

  // Search/filter (optional minimal UX)
  const [query, setQuery] = useState<string>('');

  const filteredUsers = useMemo(() => {
    if (!query.trim()) return users;
    const q = query.toLowerCase();
    return users.filter(u => `${u.firstName ?? ''} ${u.lastName ?? ''} ${u.name ?? ''} ${u.email ?? ''}`.toLowerCase().includes(q));
  }, [users, query]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminUsersService.getAllUsers();
      setUsers(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load users';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!createData.email?.trim() || !createData.password?.trim()) {
      setError('Email and password are required');
      return;
    }
    if (createData.confirmPassword !== createData.password) {
      setError('Passwords do not match');
      return;
    }

    setCreating(true);
    try {
      const payload: AdminSignupRequest = {
        email: createData.email.trim(),
        password: createData.password,
        firstName: createData.firstName?.trim() || undefined,
        lastName: createData.lastName?.trim() || undefined,
      };
      const created = await adminUsersService.createUser(payload);
      setUsers(prev => [created, ...prev]);
      setCreateData({ ...initialCreate });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create user';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (user: AdminUser) => {
    setEditingId(user.id);
    setEditData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    if (editingId == null) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await adminUsersService.updateUser(editingId, editData);
      setUsers(prev => prev.map(u => (u.id === editingId ? updated : u)));
      cancelEdit();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update user';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setError(null);
    try {
      await adminUsersService.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete user';
      setError(msg);
    }
  };

  return (
    <AdminLayout title="Users">
      <div className="admin-page">
        <div className="admin-container">
          <div className="admin-header">
            <div>
              <h2 className="admin-title">User Management</h2>
              <p className="admin-subtitle">Manage application users. Create, edit, view and delete.</p>
            </div>
            <div>
              <input
                type="text"
                className="form-input"
                placeholder="Search users..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Create User */}
          <div className="admin-card">
            <h3 className="section-title">Create New User</h3>
            <form onSubmit={handleCreate} className="form-grid">
              <div>
                <label className="form-label">First Name</label>
                <input
                  className="form-input"
                  value={createData.firstName}
                  onChange={(e) => setCreateData({ ...createData, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div>
                <label className="form-label">Last Name</label>
                <input
                  className="form-input"
                  value={createData.lastName}
                  onChange={(e) => setCreateData({ ...createData, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={createData.email}
                  onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                  placeholder="john.doe@example.com"
                  required
                />
              </div>
              <div>
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={createData.password}
                  onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div>
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={createData.confirmPassword}
                  onChange={(e) => setCreateData({ ...createData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create User'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setCreateData({ ...initialCreate })} disabled={creating}>Clear</button>
              </div>
            </form>
          </div>

          {/* Users Table */}
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 70 }}>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th style={{ width: 240 }} className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="table-empty">Loading users...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={4} className="table-empty">No users found.</td></tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>
                        {editingId === user.id ? (
                          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                            <input
                              className="form-input"
                              placeholder="First name"
                              value={editData.firstName ?? ''}
                              onChange={(e) => setEditData(prev => ({ ...prev, firstName: e.target.value }))}
                            />
                            <input
                              className="form-input"
                              placeholder="Last name"
                              value={editData.lastName ?? ''}
                              onChange={(e) => setEditData(prev => ({ ...prev, lastName: e.target.value }))}
                            />
                          </div>
                        ) : (
                          <>
                            {user.name || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || '-'}
                          </>
                        )}
                      </td>
                      <td>
                        {editingId === user.id ? (
                          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <input
                              className="form-input"
                              type="email"
                              placeholder="Email"
                              value={editData.email ?? ''}
                              onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                            />
                            <input
                              className="form-input"
                              type="password"
                              placeholder="New Password (optional)"
                              value={editData.password ?? ''}
                              onChange={(e) => setEditData(prev => ({ ...prev, password: e.target.value }))}
                            />
                          </div>
                        ) : (
                          user.email
                        )}
                      </td>
                      <td className="text-right">
                        {editingId === user.id ? (
                          <>
                            <button className="btn btn-primary btn-sm mr-8" onClick={saveEdit} disabled={saving}>
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button className="btn btn-outline btn-sm mr-8" onClick={cancelEdit} disabled={saving}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <Link to={`/admin/users/${user.id}`} className="btn btn-outline btn-sm mr-8">View</Link>
                            <button className="btn btn-outline btn-sm mr-8" onClick={() => startEdit(user)}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(user.id)}>Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
