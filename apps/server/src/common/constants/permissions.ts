export const PERMISSIONS = {
  // Users & Access
  USERS_VIEW: 'users.view',
  USERS_MANAGE: 'users.manage', // Create/Update/Delete/Assign Roles
  ROLES_MANAGE: 'roles.manage',

  // Locations (Campus, Blocks, Rooms, Beds)
  LOCATIONS_VIEW: 'locations.view',
  LOCATIONS_MANAGE: 'locations.manage',

  // Students
  STUDENTS_VIEW: 'students.view',
  STUDENTS_CREATE: 'students.create',
  STUDENTS_UPDATE: 'students.update',

  // Bookings
  BOOKINGS_VIEW: 'bookings.view',
  BOOKINGS_CREATE: 'bookings.create',
  BOOKINGS_MANAGE: 'bookings.manage', // Cancel, Reject
  BOOKINGS_APPROVE_FINANCIAL: 'bookings.approve_financial',
  BOOKINGS_CHECK_IN: 'bookings.check_in',

  // Semesters
  SEMESTERS_VIEW: 'semesters.view',
  SEMESTERS_MANAGE: 'semesters.manage',

  // Reports / Audit
  AUDIT_VIEW: 'audit.view',
  REPORTS_VIEW: 'reports.view',
} as const;

export type PermissionType = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
