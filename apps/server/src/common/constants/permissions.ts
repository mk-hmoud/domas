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

  // Staff <-> Location scoping
  STAFF_LOCATIONS_VIEW: 'staff_locations.view',
  STAFF_LOCATIONS_MANAGE: 'staff_locations.manage',

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

  // Messaging (bulk contact resolution for an external SMS/WhatsApp/email tool)
  MESSAGING_SEND: 'messaging.send',

  // Messages (in-app admin <-> student support inbox — distinct from MESSAGING_SEND above)
  MESSAGES_VIEW: 'messages.view',
  MESSAGES_MANAGE: 'messages.manage',

  // Announcements
  ANNOUNCEMENTS_MANAGE: 'announcements.manage',

  // Guests
  GUESTS_MANAGE: 'guests.manage',

  // Room Changes
  ROOM_CHANGES_VIEW: 'room_changes.view',
  ROOM_CHANGES_MANAGE: 'room_changes.manage',
  ROOM_CHANGES_APPROVE_PAYMENT: 'room_changes.approve_payment',

  // Pre-Reservations
  PRE_RESERVATIONS_VIEW: 'pre_reservations.view',
  PRE_RESERVATIONS_MANAGE: 'pre_reservations.manage',

  // Dorm Certificates
  DORM_CERTIFICATES_VIEW: 'dorm_certificates.view',
  DORM_CERTIFICATES_MANAGE: 'dorm_certificates.manage',

  // Work Orders (Technician repair/replacement jobs)
  WORK_ORDERS_VIEW: 'work_orders.view',
  WORK_ORDERS_MANAGE: 'work_orders.manage', // Create, assign/reassign, edit, cancel (Technician Manager)
  WORK_ORDERS_UPDATE: 'work_orders.update', // Update status/notes on assigned work orders (Technician Staff)

  // Tickets (Student-reported issues, triaged by dorm staff)
  TICKETS_VIEW: 'tickets.view',
  TICKETS_TRIAGE: 'tickets.triage', // Reject / resolve directly / escalate to a technician

  // Document Templates (admin-editable format of contracts/certificates)
  DOCUMENT_TEMPLATES_VIEW: 'document_templates.view',
  DOCUMENT_TEMPLATES_MANAGE: 'document_templates.manage',

  // Lookups (admin-editable Countries & Departments lists - read is public, see controllers)
  LOOKUPS_MANAGE: 'lookups.manage',
} as const;

export type PermissionType = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
