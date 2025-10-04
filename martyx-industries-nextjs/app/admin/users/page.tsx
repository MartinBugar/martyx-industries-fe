'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isTokenExpired } from '@/lib/services/apiUtils';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminUsersService, type AdminUser } from '@/lib/services/adminUsersService';
import './AdminUsers.css';

type UserTab = 'all' | 'create';

export default function AdminUsers() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<UserTab>('all');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'USER' | 'ADMIN'>('all');

  // Create user form
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'USER' as 'USER' | 'ADMIN'
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  // Check admin authentication
  useEffect(() => {
    const hasWindow = typeof window !== 'undefined';
    const adminFlag = hasWindow && window.localStorage.getItem('adminAuthed') === 'true';
    const token = hasWindow ? window.localStorage.getItem('token') : null;
    const validToken = !!token && !isTokenExpired(token);

    if (!adminFlag || !validToken) {
      router.replace('/admin');
      return;
    }

    if (activeTab === 'all') {
      loadUsers();
    }
  }, [router, activeTab]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminUsersService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = filterRole === 'all' || user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await adminUsersService.deleteUser(userId);
      await loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(false);

    if (!createForm.email || !createForm.password || !createForm.firstName || !createForm.lastName) {
      setCreateError('All fields are required');
      return;
    }

    setCreating(true);
    try {
      await adminUsersService.createUser(createForm);
      setCreateSuccess(true);
      setCreateForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'USER'
      });
      // Reload users if on all tab
      if (activeTab === 'all') {
        await loadUsers();
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      setCreateError('Failed to create user. Email may already exist.');
    } finally {
      setCreating(false);
    }
  };

  const navTabs = (
    <div className="admin-nav-tabs">
      <button
        className={`admin-nav-tab${activeTab === 'all' ? ' active' : ''}`}
        onClick={() => setActiveTab('all')}
      >
        👥 All Users
      </button>
      <button
        className={`admin-nav-tab${activeTab === 'create' ? ' active' : ''}`}
        onClick={() => setActiveTab('create')}
      >
        ➕ Create User
      </button>
    </div>
  );

  return (
    <AdminLayout title="User Management" navTabs={navTabs}>
      {/* All Users Tab */}
      {activeTab === 'all' && (
        <div className="users-section">
          {/* Filters */}
          <div className="filters-row">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-box">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as 'all' | 'USER' | 'ADMIN')}
                className="filter-select"
              >
                <option value="all">All Roles</option>
                <option value="USER">Users</option>
                <option value="ADMIN">Admins</option>
              </select>
            </div>

            <button className="refresh-btn" onClick={loadUsers}>
              🔄 Refresh
            </button>
          </div>

          {/* Summary Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-value">{users.length}</div>
              <div className="stat-label">Total Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{users.filter(u => u.enabled).length}</div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{users.filter(u => u.role === 'ADMIN').length}</div>
              <div className="stat-label">Administrators</div>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">Loading users...</div>
          ) : (
            <>
              {/* Users Table */}
              <div className="table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Created</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className={!user.enabled ? 'inactive-row' : ''}>
                        <td>{user.id}</td>
                        <td>
                          <div className="user-info">
                            <div className="user-avatar">
                              {user.firstName?.charAt(0) || 'U'}{user.lastName?.charAt(0) || ''}
                            </div>
                            <div className="user-name">
                              {user.firstName} {user.lastName}
                            </div>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge ${user.role.toLowerCase()}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>
                          <span className={`status-badge ${user.enabled ? 'active' : 'inactive'}`}>
                            {user.enabled ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => router.push(`/admin/users/${user.id}`)}
                              className="action-btn view-btn"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="action-btn delete-btn"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredUsers.length === 0 && (
                  <div className="empty-state">
                    <p>No users found matching your criteria.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Create User Tab */}
      {activeTab === 'create' && (
        <div className="create-section">
          <h2 className="section-title">Create New User</h2>

          <form onSubmit={handleCreateUser} className="create-form">
            {createError && (
              <div className="alert alert-error">{createError}</div>
            )}

            {createSuccess && (
              <div className="alert alert-success">User created successfully!</div>
            )}

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                  placeholder="John"
                  disabled={creating}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                  placeholder="Doe"
                  disabled={creating}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="john.doe@example.com"
                  disabled={creating}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="••••••••"
                  disabled={creating}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as 'USER' | 'ADMIN' })}
                  disabled={creating}
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={creating}>
                {creating ? 'Creating...' : 'Create User'}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setCreateForm({
                    email: '',
                    password: '',
                    firstName: '',
                    lastName: '',
                    role: 'USER'
                  });
                  setCreateError(null);
                  setCreateSuccess(false);
                }}
                disabled={creating}
              >
                Clear Form
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
