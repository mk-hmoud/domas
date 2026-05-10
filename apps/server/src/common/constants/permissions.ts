export const PERMISSIONS = {
  // Users
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',

  // Access Control (Roles & Permissions)
  ROLES_VIEW: 'roles.view',
  ROLES_MANAGE: 'roles.manage', // Create/Update role definitions
  ROLES_ASSIGN: 'roles.assign', // Assign roles to users
  PERMISSIONS_VIEW: 'permissions.view',

  // Students
  STUDENTS_VIEW: 'students.view',
  STUDENTS_CREATE: 'students.create',
  STUDENTS_UPDATE: 'students.update',
  STUDENTS_DELETE: 'students.delete',
  STUDENTS_REVIEW_APPLICATIONS: 'students.review_applications',

  // Locations
  LOCATIONS_VIEW: 'locations.view',
  LOCATIONS_CREATE: 'locations.create',
  LOCATIONS_UPDATE: 'locations.update',
  LOCATIONS_DELETE: 'locations.delete',

  // Bookings
  BOOKINGS_VIEW: 'bookings.view',
  BOOKINGS_CREATE: 'bookings.create',
  BOOKINGS_UPDATE: 'bookings.update',
  BOOKINGS_CANCEL: 'bookings.cancel', // Explicit cancellation rights
  BOOKINGS_APPROVE_FINANCIAL: 'bookings.approve_financial',
  BOOKINGS_CHECK_IN: 'bookings.check_in',

  // Semesters
  SEMESTERS_VIEW: 'semesters.view',
  SEMESTERS_MANAGE: 'semesters.manage',

  // Inventory
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_MANAGE: 'inventory.manage',
  INVENTORY_ASSIGN: 'inventory.assign',

  // Access Cards
  ACCESS_CARDS_VIEW: 'access_cards.view',
  ACCESS_CARDS_MANAGE: 'access_cards.manage',

  // Damages
  DAMAGES_VIEW: 'damages.view',
  DAMAGES_REPORT: 'damages.report', // Creating reports
  DAMAGES_MANAGE: 'damages.manage', // Approving/Rejecting reports

  // Audit & Reports
  AUDIT_VIEW: 'audit.view',
  REPORTS_VIEW: 'reports.view',

  // Undo
  UNDO_ALL: 'undo.all',
  UNDO_OWN: 'undo.own',

  // Messaging
  MESSAGING_SEND: 'messaging.send',

  // Announcements
  ANNOUNCEMENTS_MANAGE: 'announcements.manage',

  // Guests
  GUESTS_MANAGE: 'guests.manage',

  // Room Changes
  ROOM_CHANGES_VIEW: 'room_changes.view',
  ROOM_CHANGES_MANAGE: 'room_changes.manage',
  ROOM_CHANGES_APPROVE_PAYMENT: 'room_changes.approve_payment',
} as const;

export type PermissionType = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
