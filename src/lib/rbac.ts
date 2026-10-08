export type UserRole = 'LEARNER' | 'EDITOR' | 'FINANCE' | 'INSTRUCTOR' | 'ADMIN';

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
  if (requiredRole === 'EDITOR') return userRole === 'EDITOR' || userRole === 'INSTRUCTOR';
  if (requiredRole === 'FINANCE') return userRole === 'FINANCE';
  if (requiredRole === 'INSTRUCTOR') return userRole === 'INSTRUCTOR' || userRole === 'EDITOR';
  return false;
}

