import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Shield, Users, ChevronRight, Lock } from 'lucide-react';
import { adminRbacService } from '../../services/adminRbacService';
import type { AdminRole } from '../../services/adminRbacService';
import { logError } from '../../services/logger';
import toast from 'react-hot-toast';
import './AdminRoles.css';

/**
 * Admin Roles Management Page
 *
 * Displays all admin roles with their permissions and staff count.
 * Allows CRUD operations on roles.
 */
const AdminRoles: React.FC = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [expandedRole, setExpandedRole] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const loadRoles = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const data = await adminRbacService.getAllRoles();
      if (signal?.aborted) return;
      setRoles(data);
    } catch (error) {
      if (signal?.aborted) return;
      logError('Failed to load roles:', error);
      toast.error('Failed to load roles');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    loadRoles(abortController.signal);
    return () => abortController.abort();
  }, [loadRoles]);

  const handleDeleteRole = useCallback(async (id: number) => {
    try {
      setDeleting(true);
      setDeleteConfirm(null);
      await adminRbacService.deleteRole(id);
      toast.success('Role deleted');
      await loadRoles();
    } catch (error: any) {
      logError('Failed to delete role:', error);
      toast.error(error.message || 'Failed to delete role');
    } finally {
      setDeleting(false);
    }
  }, [loadRoles]);

  const toggleRole = (roleId: number) => {
    setExpandedRole(expandedRole === roleId ? null : roleId);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      products: 'Products',
      orders: 'Orders',
      customers: 'Customers',
      inventory: 'Inventory',
      marketing: 'Marketing',
      analytics: 'Analytics',
      settings: 'Settings',
      financial: 'Financial',
      users: 'Users',
      content: 'Content',
      tax: 'Tax',
      shipping: 'Shipping',
      gamification: 'Gamification'
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <div className="admin-roles">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-roles">
      <div className="page-header">
        <div className="header-content">
          <h1>Admin Roles</h1>
          <p>Manage roles and their permissions</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/admin/rbac/staff')}
          >
            <Users size={18} />
            Staff Members
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/admin/rbac/roles/new')}
          >
            <Plus size={18} />
            Add Role
          </button>
        </div>
      </div>

      <div className="roles-list">
        {roles.length === 0 ? (
          <div className="empty-state">
            <Shield size={48} />
            <h3>No Roles</h3>
            <p>Create your first admin role to start managing permissions.</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/admin/rbac/roles/new')}
            >
              Create Role
            </button>
          </div>
        ) : (
          roles.map((role) => (
            <div key={role.id} className={`role-card ${!role.active ? 'inactive' : ''}`}>
              <div
                className="role-header"
                onClick={() => toggleRole(role.id)}
              >
                <div className="role-info">
                  <ChevronRight
                    size={20}
                    className={`chevron ${expandedRole === role.id ? 'expanded' : ''}`}
                  />
                  <div
                    className="role-color"
                    style={{ backgroundColor: role.color || '#6B7280' }}
                  />
                  <div className="role-title">
                    <h3>{role.name}</h3>
                    <span className="role-code">{role.code}</span>
                  </div>
                  <div className="role-meta">
                    <span className={`status-badge ${role.active ? 'active' : 'inactive'}`}>
                      {role.active ? 'Active' : 'Inactive'}
                    </span>
                    {role.systemRole && (
                      <span className="badge system">
                        <Lock size={12} />
                        System
                      </span>
                    )}
                    <span className="staff-count">
                      <Users size={14} />
                      {role.staffCount || 0}
                    </span>
                  </div>
                </div>
                <div className="role-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn-icon"
                    onClick={() => navigate(`/admin/rbac/roles/${role.id}/edit`)}
                    title="Edit role"
                  >
                    <Edit size={16} />
                  </button>
                  {!role.systemRole && (
                    <button
                      className="btn-icon danger"
                      onClick={() => setDeleteConfirm(role.id)}
                      title="Delete role"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {role.description && (
                <p className="role-description">{role.description}</p>
              )}

              {expandedRole === role.id && (
                <div className="role-permissions">
                  <h4>Permissions ({role.permissionCodes?.length || 0})</h4>
                  {role.permissionCodes && role.permissionCodes.length > 0 ? (
                    <div className="permissions-grid">
                      {Object.entries(
                        role.permissionCodes.reduce((acc, code) => {
                          const [category] = code.split('.');
                          if (!acc[category]) acc[category] = [];
                          acc[category].push(code);
                          return acc;
                        }, {} as Record<string, string[]>)
                      ).map(([category, codes]) => (
                        <div key={category} className="permission-category">
                          <span className="category-name">{getCategoryLabel(category)}</span>
                          <div className="permission-codes">
                            {codes.map(code => (
                              <span key={code} className="permission-code">
                                {code.split('.')[1]}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-permissions">No permissions assigned</p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this role? This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                disabled={deleting}
                onClick={() => handleDeleteRole(deleteConfirm)}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoles;
