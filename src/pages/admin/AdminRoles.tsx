import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Shield, Users, ChevronRight, ChevronDown, Lock } from 'lucide-react';
import { adminRbacService } from '../../services/adminRbacService';
import type { AdminRole } from '../../services/adminRbacService';
import { logError } from '../../services/logger';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { Button, Badge, SkeletonTable, ConfirmDialog, useConfirmDialog } from '../../components/ui';
import './AdminUsers.css';
import './AdminButtonOverrides.css';

const AdminRoles: React.FC = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRole, setExpandedRole] = useState<number | null>(null);

  const { confirm, dialogProps } = useConfirmDialog({
    title: 'Confirm Delete',
    variant: 'danger',
    confirmText: 'Delete',
    cancelText: 'Cancel',
  });

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

  const handleDeleteRole = async (id: number, roleName: string) => {
    const confirmed = await confirm({
      title: 'Delete Role',
      message: `Are you sure you want to delete "${roleName}"? This action cannot be undone.`,
    });
    if (!confirmed) return;

    try {
      await adminRbacService.deleteRole(id);
      toast.success('Role deleted');
      await loadRoles();
    } catch (error: any) {
      logError('Failed to delete role:', error);
      toast.error(error.message || 'Failed to delete role');
    }
  };

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

  return (
    <AdminLayout title="Roles & Permissions">
      <div className="admin-page">
        <div className="admin-container">
          {/* Header */}
          <div className="admin-card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 className="section-title" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Shield size={24} style={{ color: 'var(--admin-accent)' }} />
                  Admin Roles
                </h2>
                <p style={{ margin: 0, color: 'var(--admin-secondary)', fontSize: '14px' }}>
                  Manage roles and their permissions.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button variant="outline" onClick={() => navigate('/admin/rbac/staff')}>
                  <Users size={16} />
                  Staff Members
                </Button>
                <Button variant="primary" onClick={() => navigate('/admin/rbac/roles/new')}>
                  <Plus size={16} />
                  Add Role
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="admin-card">
              <SkeletonTable rows={4} columns={3} />
            </div>
          ) : roles.length === 0 ? (
            <div className="admin-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Shield size={48} style={{ color: 'var(--admin-secondary)', marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px', color: 'var(--admin-primary)' }}>No Roles</h3>
              <p style={{ margin: '0 0 20px', color: 'var(--admin-secondary)' }}>
                Create your first admin role to start managing permissions.
              </p>
              <Button variant="primary" onClick={() => navigate('/admin/rbac/roles/new')}>
                Create Role
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {roles.map((role) => (
                <div key={role.id} className="admin-card" style={{ padding: 0, overflow: 'hidden', opacity: role.active ? 1 : 0.7 }}>
                  {/* Role Header */}
                  <div
                    onClick={() => toggleRole(role.id)}
                    style={{
                      padding: '20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      background: expandedRole === role.id ? 'var(--admin-bg-secondary)' : 'transparent',
                      transition: 'background 0.2s',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      {expandedRole === role.id ? (
                        <ChevronDown size={20} style={{ color: 'var(--admin-accent)' }} />
                      ) : (
                        <ChevronRight size={20} style={{ color: 'var(--admin-secondary)' }} />
                      )}
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: role.color || '#6B7280',
                          flexShrink: 0
                        }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--admin-primary)' }}>
                            {role.name}
                          </h3>
                          <span style={{ fontSize: '12px', color: 'var(--admin-secondary)', fontFamily: 'monospace', background: 'var(--admin-bg-tertiary)', padding: '2px 8px', borderRadius: '4px' }}>
                            {role.code}
                          </span>
                          <Badge variant={role.active ? 'success' : 'warning'} size="sm">
                            {role.active ? 'Active' : 'Inactive'}
                          </Badge>
                          {role.systemRole && (
                            <Badge variant="info" size="sm">
                              <Lock size={10} style={{ marginRight: 4 }} />
                              System
                            </Badge>
                          )}
                        </div>
                        {role.description && (
                          <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--admin-secondary)' }}>
                            {role.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--admin-secondary)' }}>
                        <Users size={16} />
                        {role.staffCount || 0} staff
                      </span>
                      <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/admin/rbac/roles/${role.id}/edit`)} title="Edit role">
                          <Edit size={14} />
                        </Button>
                        {!role.systemRole && (
                          <Button variant="danger" size="sm" onClick={() => handleDeleteRole(role.id, role.name)} title="Delete role">
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content - Permissions */}
                  {expandedRole === role.id && (
                    <div style={{ padding: '20px', borderTop: '1px solid var(--admin-border)' }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: 'var(--admin-primary)' }}>
                        Permissions ({role.permissionCodes?.length || 0})
                      </h4>

                      {role.permissionCodes && role.permissionCodes.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                          {Object.entries(
                            role.permissionCodes.reduce((acc, code) => {
                              const [category] = code.split('.');
                              if (!acc[category]) acc[category] = [];
                              acc[category].push(code);
                              return acc;
                            }, {} as Record<string, string[]>)
                          ).map(([category, codes]) => (
                            <div key={category} style={{ padding: '12px', background: 'var(--admin-bg-secondary)', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--admin-accent)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                {getCategoryLabel(category)}
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {codes.map(code => (
                                  <Badge key={code} variant="neutral" size="sm">
                                    {code.split('.')[1]}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '30px', background: 'var(--admin-bg-secondary)', borderRadius: '8px' }}>
                          <Shield size={24} style={{ color: 'var(--admin-secondary)', marginBottom: '8px' }} />
                          <p style={{ margin: 0, color: 'var(--admin-secondary)', fontSize: '14px' }}>
                            No permissions assigned to this role.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog {...dialogProps} />
    </AdminLayout>
  );
};

export default AdminRoles;
