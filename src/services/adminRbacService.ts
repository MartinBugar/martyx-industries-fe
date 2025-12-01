import { API_BASE_URL, defaultHeaders, handleResponse, withAuthHeaders } from './apiUtils';
import { logInfo, logError } from './logger';

// ==================== TYPES ====================

export interface Permission {
  id: number;
  code: string;
  name: string;
  description: string | null;
  category: string;
  action: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRole {
  id: number;
  code: string;
  name: string;
  description: string | null;
  systemRole: boolean;
  sortOrder: number;
  active: boolean;
  color: string | null;
  icon: string | null;
  permissions?: Permission[];
  permissionCodes?: string[];
  staffCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StaffMember {
  id: number;
  userId: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  employeeId: string | null;
  department: string | null;
  jobTitle: string | null;
  active: boolean;
  notes: string | null;
  roles?: AdminRole[];
  roleCodes?: string[];
  permissionCodes?: string[];
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: number | null;
  updatedBy: number | null;
}

export interface AdminRoleRequest {
  code: string;
  name: string;
  description?: string;
  sortOrder?: number;
  active?: boolean;
  color?: string;
  icon?: string;
  permissionCodes?: string[];
}

export interface StaffMemberRequest {
  userId: number;
  employeeId?: string;
  department?: string;
  jobTitle?: string;
  active?: boolean;
  notes?: string;
  roleCodes?: string[];
}

// ==================== SERVICE ====================

class AdminRbacService {
  // ==================== PERMISSIONS ====================

  async getAllPermissions(): Promise<Permission[]> {
    const response = await fetch(`${API_BASE_URL}/api/admin/rbac/permissions`, withAuthHeaders({
      method: 'GET',
      headers: defaultHeaders,
    }));
    return handleResponse(response);
  }

  async getPermissionsByCategory(): Promise<Record<string, Permission[]>> {
    const response = await fetch(`${API_BASE_URL}/api/admin/rbac/permissions/by-category`, withAuthHeaders({
      method: 'GET',
      headers: defaultHeaders,
    }));
    return handleResponse(response);
  }

  async getPermissionCategories(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/api/admin/rbac/permissions/categories`, withAuthHeaders({
      method: 'GET',
      headers: defaultHeaders,
    }));
    return handleResponse(response);
  }

  // ==================== ADMIN ROLES ====================

  async getAllRoles(): Promise<AdminRole[]> {
    const response = await fetch(`${API_BASE_URL}/api/admin/rbac/roles`, withAuthHeaders({
      method: 'GET',
      headers: defaultHeaders,
    }));
    return handleResponse(response);
  }

  async getActiveRoles(): Promise<AdminRole[]> {
    const response = await fetch(`${API_BASE_URL}/api/admin/rbac/roles/active`, withAuthHeaders({
      method: 'GET',
      headers: defaultHeaders,
    }));
    return handleResponse(response);
  }

  async getRoleById(id: number): Promise<AdminRole> {
    const response = await fetch(`${API_BASE_URL}/api/admin/rbac/roles/${id}`, withAuthHeaders({
      method: 'GET',
      headers: defaultHeaders,
    }));
    return handleResponse(response);
  }

  async createRole(request: AdminRoleRequest): Promise<AdminRole> {
    logInfo('Creating admin role:', request.code);
    const response = await fetch(`${API_BASE_URL}/api/admin/rbac/roles`, withAuthHeaders({
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(request),
    }));
    return handleResponse(response);
  }

  async updateRole(id: number, request: AdminRoleRequest): Promise<AdminRole> {
    logInfo('Updating admin role:', id);
    const response = await fetch(`${API_BASE_URL}/api/admin/rbac/roles/${id}`, withAuthHeaders({
      method: 'PUT',
      headers: defaultHeaders,
      body: JSON.stringify(request),
    }));
    return handleResponse(response);
  }

  async deleteRole(id: number): Promise<void> {
    logInfo('Deleting admin role:', id);
    const response = await fetch(`${API_BASE_URL}/api/admin/rbac/roles/${id}`, withAuthHeaders({
      method: 'DELETE',
      headers: defaultHeaders,
    }));
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to delete role');
    }
  }

  async updateRolePermissions(roleId: number, permissionCodes: string[]): Promise<AdminRole> {
    logInfo('Updating role permissions:', roleId, permissionCodes.length);
    const response = await fetch(`${API_BASE_URL}/api/admin/rbac/roles/${roleId}/permissions`, withAuthHeaders({
      method: 'PUT',
      headers: defaultHeaders,
      body: JSON.stringify(permissionCodes),
    }));
    return handleResponse(response);
  }

  // ==================== STAFF MEMBERS ====================

  async getAllStaffMembers(): Promise<StaffMember[]> {
    const response = await fetch(`${API_BASE_URL}/api/admin/rbac/staff`, withAuthHeaders({
      method: 'GET',
      headers: defaultHeaders,
    }));
    return handleResponse(response);
  }

  async getStaffMemberById(id: number): Promise<StaffMember> {
    const response = await fetch(`${API_BASE_URL}/api/admin/rbac/staff/${id}`, withAuthHeaders({
      method: 'GET',
      headers: defaultHeaders,
    }));
    return handleResponse(response);
  }

  async getStaffMemberByUserId(userId: number): Promise<StaffMember | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/rbac/staff/user/${userId}`, withAuthHeaders({
        method: 'GET',
        headers: defaultHeaders,
      }));
      if (response.status === 404) return null;
      return handleResponse(response);
    } catch (error) {
      logError('Error getting staff member by user ID:', error);
      return null;
    }
  }

  async createStaffMember(request: StaffMemberRequest): Promise<StaffMember> {
    logInfo('Creating staff member for user:', request.userId);
    const response = await fetch(`${API_BASE_URL}/api/admin/rbac/staff`, withAuthHeaders({
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(request),
    }));
    return handleResponse(response);
  }

  async updateStaffMember(id: number, request: StaffMemberRequest): Promise<StaffMember> {
    logInfo('Updating staff member:', id);
    const response = await fetch(`${API_BASE_URL}/api/admin/rbac/staff/${id}`, withAuthHeaders({
      method: 'PUT',
      headers: defaultHeaders,
      body: JSON.stringify(request),
    }));
    return handleResponse(response);
  }

  async deleteStaffMember(id: number): Promise<void> {
    logInfo('Deleting staff member:', id);
    const response = await fetch(`${API_BASE_URL}/api/admin/rbac/staff/${id}`, withAuthHeaders({
      method: 'DELETE',
      headers: defaultHeaders,
    }));
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to delete staff member');
    }
  }

  async updateStaffMemberRoles(staffMemberId: number, roleCodes: string[]): Promise<StaffMember> {
    logInfo('Updating staff member roles:', staffMemberId, roleCodes.length);
    const response = await fetch(`${API_BASE_URL}/api/admin/rbac/staff/${staffMemberId}/roles`, withAuthHeaders({
      method: 'PUT',
      headers: defaultHeaders,
      body: JSON.stringify(roleCodes),
    }));
    return handleResponse(response);
  }

  async searchStaffMembers(query: string): Promise<StaffMember[]> {
    const response = await fetch(`${API_BASE_URL}/api/admin/rbac/staff/search?q=${encodeURIComponent(query)}`, withAuthHeaders({
      method: 'GET',
      headers: defaultHeaders,
    }));
    return handleResponse(response);
  }

  async getAllDepartments(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/api/admin/rbac/departments`, withAuthHeaders({
      method: 'GET',
      headers: defaultHeaders,
    }));
    return handleResponse(response);
  }

  // ==================== PERMISSION CHECKS ====================

  async checkPermission(permission: string): Promise<{ userId: number; permission: string; hasPermission: boolean }> {
    const response = await fetch(`${API_BASE_URL}/api/admin/rbac/check-permission?permission=${encodeURIComponent(permission)}`, withAuthHeaders({
      method: 'GET',
      headers: defaultHeaders,
    }));
    return handleResponse(response);
  }

  async getMyPermissions(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/api/admin/rbac/my-permissions`, withAuthHeaders({
      method: 'GET',
      headers: defaultHeaders,
    }));
    return handleResponse(response);
  }

  // ==================== STATISTICS ====================

  async getStaffCountByRole(): Promise<Record<string, number>> {
    const response = await fetch(`${API_BASE_URL}/api/admin/rbac/stats/staff-by-role`, withAuthHeaders({
      method: 'GET',
      headers: defaultHeaders,
    }));
    return handleResponse(response);
  }
}

export const adminRbacService = new AdminRbacService();
export default adminRbacService;
