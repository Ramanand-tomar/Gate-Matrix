export type UserRole = 'LEARNER' | 'EDITOR' | 'FINANCE' | 'ADMIN';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string;
}

/**
 * Validates whether a user role has permission for a required role.
 */
export function hasRolePermission(userRole: UserRole, requiredRole: UserRole): boolean {
  if (userRole === 'ADMIN') return true; // ADMIN has full access
  if (requiredRole === 'LEARNER') return true; // Everyone is at least a learner
  if (requiredRole === 'EDITOR') return userRole === 'EDITOR';
  if (requiredRole === 'FINANCE') return userRole === 'FINANCE';
  return false;
}
