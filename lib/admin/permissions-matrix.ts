// lib/admin/permissions-matrix.ts
// Phase 8: Pure Scoped Role-Permission Matrix and Access Helpers
// Zero external server dependencies to enable universal usage (Node, browser, edge, test runner).

export type AdminRole =
  | 'super_admin'
  | 'moderator'
  | 'vetting_reviewer'
  | 'finance'
  | 'support';

export type PlatformRole =
  | AdminRole
  | 'recruiter'
  | 'candidate'
  | 'PLATFORM_ADMIN' // Migration alias
  | 'admin'; // Migration alias

export type AdminAction =
  // Page access
  | 'page:overview'
  | 'page:roles'
  | 'page:reports'
  | 'page:sources'
  | 'page:users'
  | 'page:employers'
  | 'page:video_review'
  | 'page:money'
  | 'page:audit'
  | 'page:settings'
  // Granular actions
  | 'roles:read'
  | 'roles:verify'
  | 'roles:edit'
  | 'roles:delete'
  | 'reports:read'
  | 'reports:resolve'
  | 'sources:read'
  | 'sources:manage'
  | 'users:read'
  | 'users:manage_roles'
  | 'users:suspend'
  | 'employers:read'
  | 'employers:adjust_tokens'
  | 'video_review:read'
  | 'video_review:moderate'
  | 'money:read'
  | 'money:refund'
  | 'money:export'
  | 'audit:read'
  | 'settings:read'
  | 'settings:write'
  | 'impersonate';

/**
 * Hard Role-Permission Matrix.
 * Enforced uniformly across all route handlers, server actions, and UI navigation.
 */
export const ROLE_PERMISSIONS: Record<AdminRole, AdminAction[]> = {
  super_admin: [
    'page:overview',
    'page:roles',
    'page:reports',
    'page:sources',
    'page:users',
    'page:employers',
    'page:video_review',
    'page:money',
    'page:audit',
    'page:settings',
    'roles:read',
    'roles:verify',
    'roles:edit',
    'roles:delete',
    'reports:read',
    'reports:resolve',
    'sources:read',
    'sources:manage',
    'users:read',
    'users:manage_roles',
    'users:suspend',
    'employers:read',
    'employers:adjust_tokens',
    'video_review:read',
    'video_review:moderate',
    'money:read',
    'money:refund',
    'money:export',
    'audit:read',
    'settings:read',
    'settings:write',
    'impersonate',
  ],
  moderator: [
    'page:overview',
    'page:roles',
    'page:reports',
    'page:sources',
    'roles:read',
    'roles:verify',
    'roles:edit',
    'roles:delete',
    'reports:read',
    'reports:resolve',
    'sources:read',
    'sources:manage',
  ],
  vetting_reviewer: [
    'page:overview',
    'page:video_review',
    'video_review:read',
    'video_review:moderate',
  ],
  finance: [
    'page:overview',
    'page:employers',
    'page:money',
    'employers:read',
    'money:read',
    'money:refund',
    'money:export',
  ],
  support: [
    'page:overview',
    'page:roles',
    'page:reports',
    'page:users',
    'page:employers',
    'roles:read',
    'reports:read',
    'users:read',
    'employers:read',
    'impersonate',
  ],
};

/**
 * Normalizes any legacy or user role string to one of the 5 scoped admin roles.
 */
export function normalizeAdminRole(role?: string | null): AdminRole | null {
  if (!role) return null;
  const r = role.toLowerCase().trim().replace(/[-\s]/g, '_');
  if (r === 'super_admin' || r === 'platform_admin' || r === 'admin' || r === 'superadmin') {
    return 'super_admin';
  }
  if (r === 'moderator') return 'moderator';
  if (r === 'vetting_reviewer' || r === 'video_reviewer' || r === 'reviewer') {
    return 'vetting_reviewer';
  }
  if (r === 'finance') return 'finance';
  if (r === 'support') return 'support';
  return null;
}

/**
 * Universal Permission Checker: can(user, action)
 */
export function can(
  user: { role?: string | null } | string | null | undefined,
  action: AdminAction
): boolean {
  if (!user) return false;
  const roleStr = typeof user === 'string' ? user : user.role;
  const normalized = normalizeAdminRole(roleStr);
  if (!normalized) return false;
  const permissions = ROLE_PERMISSIONS[normalized];
  return permissions ? permissions.includes(action) : false;
}

/**
 * Display names: Plain English role titles (never raw enums)
 */
export function getRoleDisplayName(role?: string | null): string {
  if (!role) return 'Candidate';
  const r = role.toLowerCase().trim().replace(/[-\s]/g, '_');
  if (r === 'super_admin' || r === 'platform_admin' || r === 'admin') return 'Super admin';
  if (r === 'moderator') return 'Moderator';
  if (r === 'vetting_reviewer' || r === 'video_reviewer') return 'Vetting reviewer';
  if (r === 'finance') return 'Finance';
  if (r === 'support') return 'Support';
  if (r === 'recruiter') return 'Recruiter';
  if (r === 'candidate') return 'Candidate';
  return role;
}
