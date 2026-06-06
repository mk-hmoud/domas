export enum UndoActionType {
  CREATE_LOCATION = 'create_location',
  UPDATE_LOCATION = 'update_location',
  DELETE_LOCATION = 'delete_location',
  UPDATE_GENDER_LOCK = 'update_gender_lock',
  UPDATE_GUEST_ZONE = 'update_guest_zone',
  UPDATE_TR_ONLY = 'update_tr_only',
  UPDATE_FOREIGNER_ONLY = 'update_foreigner_only',
  UPDATE_OWNERSHIP = 'update_ownership',
  CREATE_BED = 'create_bed',
  UPDATE_BED = 'update_bed',
  DELETE_BED = 'delete_bed',
  UPDATE_BED_TR_ONLY = 'update_bed_tr_only',
  UPDATE_BED_FOREIGNER_ONLY = 'update_bed_foreigner_only',
  UPDATE_BED_OWNERSHIP = 'update_bed_ownership',
  UPDATE_BED_GUEST_ZONE = 'update_bed_guest_zone',
  UPDATE_BED_STATUS = 'update_bed_status',
  DELETE_STUDENT = 'delete_student',
  UPDATE_STUDENT = 'update_student',
  DELETE_USER = 'delete_user',
  UPDATE_USER = 'update_user',
  CREATE_SEMESTER = 'create_semester',
  DELETE_SEMESTER = 'delete_semester',
  UPDATE_SEMESTER_STATUS = 'update_semester_status',
  CREATE_BOOKING = 'create_booking',
  CANCEL_BOOKING = 'cancel_booking',
  CHECK_IN_BOOKING = 'check_in_booking',
  CHECK_OUT_BOOKING = 'check_out_booking',
  APPROVE_BOOKING_FINANCIALS = 'approve_booking_financials',
  REJECT_BOOKING = 'reject_booking',
  ASSIGN_ROLE = 'assign_role',
  REVOKE_ROLE = 'revoke_role',
  UPDATE_SEMESTER = 'update_semester',
  UPDATE_BOOKING = 'update_booking',
  CREATE_INVENTORY_CATALOG = 'create_inventory_catalog',
  UPDATE_INVENTORY_CATALOG = 'update_inventory_catalog',
  DELETE_INVENTORY_CATALOG = 'delete_inventory_catalog',
  UPDATE_INVENTORY_TEMPLATE = 'update_inventory_template',
  DELETE_INVENTORY_TEMPLATE = 'delete_inventory_template',
  CREATE_INVENTORY_ASSIGNMENT = 'create_inventory_assignment',
  UPDATE_INVENTORY_ASSIGNMENT = 'update_inventory_assignment',
  DELETE_INVENTORY_ASSIGNMENT = 'delete_inventory_assignment',
  APPLY_INVENTORY_TEMPLATE = 'apply_inventory_template',

  // Access Cards
  CREATE_CARD_BATCH = 'create_card_batch',
  ISSUE_CARD = 'issue_card',
  RETURN_CARD = 'return_card',

  // Damages
  CREATE_DAMAGE_REPORT = 'create_damage_report',
  APPROVE_DAMAGE_REPORT = 'approve_damage_report',
  REJECT_DAMAGE_REPORT = 'reject_damage_report',

  // Bulk Import
  BULK_IMPORT_STUDENT = 'bulk_import_student',

  // Pre-Reservations
  ASSIGN_PRE_RESERVATION = 'assign_pre_reservation',
  REJECT_PRE_RESERVATION = 'reject_pre_reservation',

  // Room Changes
  RESOLVE_ROOM_CHANGE = 'resolve_room_change',
  APPROVE_ROOM_CHANGE_PAYMENT = 'approve_room_change_payment',
  STAFF_MOVE_BED = 'staff_move_bed',

  // Dorm Certificates
  APPROVE_DORM_CERT = 'approve_dorm_cert',
  REJECT_DORM_CERT = 'reject_dorm_cert',

  // Announcements
  CREATE_ANNOUNCEMENT = 'create_announcement',
  UPDATE_ANNOUNCEMENT = 'update_announcement',
  DELETE_ANNOUNCEMENT = 'delete_announcement',
  PUBLISH_ANNOUNCEMENT = 'publish_announcement',
  UNPUBLISH_ANNOUNCEMENT = 'unpublish_announcement',

  // Room Types
  CREATE_ROOM_TYPE = 'create_room_type',
  UPDATE_ROOM_TYPE = 'update_room_type',
  DELETE_ROOM_TYPE = 'delete_room_type',

  // Guest Stays
  CREATE_GUEST_STAY = 'create_guest_stay',
  CHECK_IN_GUEST_STAY = 'check_in_guest_stay',
  CHECK_OUT_GUEST_STAY = 'check_out_guest_stay',
  CANCEL_GUEST_STAY = 'cancel_guest_stay',
}
