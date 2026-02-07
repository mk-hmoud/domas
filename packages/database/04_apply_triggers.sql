-- =============================================
-- APPLY TRIGGERS
-- =============================================

-- =============================================
-- UPDATE TIMESTAMP TRIGGERS
-- =============================================

-- Locations
DROP TRIGGER IF EXISTS update_locations_modtime ON locations;
CREATE TRIGGER update_locations_modtime
BEFORE UPDATE ON locations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Semesters
DROP TRIGGER IF EXISTS update_semesters_modtime ON semesters;
CREATE TRIGGER update_semesters_modtime
BEFORE UPDATE ON semesters
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Beds
DROP TRIGGER IF EXISTS update_beds_modtime ON beds;
CREATE TRIGGER update_beds_modtime
BEFORE UPDATE ON beds
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Users
DROP TRIGGER IF EXISTS update_users_modtime ON users;
CREATE TRIGGER update_users_modtime
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Students
DROP TRIGGER IF EXISTS update_students_modtime ON students;
CREATE TRIGGER update_students_modtime
BEFORE UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Bookings
DROP TRIGGER IF EXISTS update_bookings_modtime ON bookings;
CREATE TRIGGER update_bookings_modtime
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Transactions
DROP TRIGGER IF EXISTS update_transactions_modtime ON transactions;
CREATE TRIGGER update_transactions_modtime
BEFORE UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inventory Catalog
DROP TRIGGER IF EXISTS update_inventory_catalog_modtime ON inventory_catalog;
CREATE TRIGGER update_inventory_catalog_modtime
BEFORE UPDATE ON inventory_catalog
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inventory Assignments
DROP TRIGGER IF EXISTS update_inventory_assignments_modtime ON inventory_assignments;
CREATE TRIGGER update_inventory_assignments_modtime
BEFORE UPDATE ON inventory_assignments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Booking Inventory Snapshots
DROP TRIGGER IF EXISTS update_booking_inventory_snapshots_modtime ON booking_inventory_snapshots;
CREATE TRIGGER update_booking_inventory_snapshots_modtime
BEFORE UPDATE ON booking_inventory_snapshots
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- AUDIT TRIGGERS
-- =============================================

-- Most tables have a stand 'id' column.
-- Some have a unique one which needs to be entered
-- as a parameter in the log_changefunction.

-- Users
DROP TRIGGER IF EXISTS audit_users_change ON users;
CREATE TRIGGER audit_users_change
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- Students
DROP TRIGGER IF EXISTS audit_students_change ON students;
CREATE TRIGGER audit_students_change
AFTER INSERT OR UPDATE OR DELETE ON students
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- Locations
DROP TRIGGER IF EXISTS audit_locations_change ON locations;
CREATE TRIGGER audit_locations_change
AFTER INSERT OR UPDATE OR DELETE ON locations
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- Beds
DROP TRIGGER IF EXISTS audit_beds_change ON beds;
CREATE TRIGGER audit_beds_change
AFTER INSERT OR UPDATE OR DELETE ON beds
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- Semesters
DROP TRIGGER IF EXISTS audit_semesters_change ON semesters;
CREATE TRIGGER audit_semesters_change
AFTER INSERT OR UPDATE OR DELETE ON semesters
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- Bookings
DROP TRIGGER IF EXISTS audit_bookings_change ON bookings;
CREATE TRIGGER audit_bookings_change
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- Transactions
DROP TRIGGER IF EXISTS audit_transactions_change ON transactions;
CREATE TRIGGER audit_transactions_change
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- Roles
DROP TRIGGER IF EXISTS audit_roles_change ON roles;
CREATE TRIGGER audit_roles_change
AFTER INSERT OR UPDATE OR DELETE ON roles
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- Permissions
DROP TRIGGER IF EXISTS audit_permissions_change ON permissions;
CREATE TRIGGER audit_permissions_change
AFTER INSERT OR UPDATE OR DELETE ON permissions
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- User Roles
DROP TRIGGER IF EXISTS audit_user_roles_change ON user_roles;
CREATE TRIGGER audit_user_roles_change
AFTER INSERT OR UPDATE OR DELETE ON user_roles
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- Role Permissions
DROP TRIGGER IF EXISTS audit_role_permissions_change ON role_permissions;
CREATE TRIGGER audit_role_permissions_change
AFTER INSERT OR UPDATE OR DELETE ON role_permissions
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- Inventory Catalog
DROP TRIGGER IF EXISTS audit_inventory_catalog_change ON inventory_catalog;
CREATE TRIGGER audit_inventory_catalog_change
AFTER INSERT OR UPDATE OR DELETE ON inventory_catalog
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- Inventory Assignments
DROP TRIGGER IF EXISTS audit_inventory_assignments_change ON inventory_assignments;
CREATE TRIGGER audit_inventory_assignments_change
AFTER INSERT OR UPDATE OR DELETE ON inventory_assignments
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- Booking Inventory Snapshots
DROP TRIGGER IF EXISTS audit_booking_inventory_snapshots_change ON booking_inventory_snapshots;
CREATE TRIGGER audit_booking_inventory_snapshots_change
AFTER INSERT OR UPDATE OR DELETE ON booking_inventory_snapshots
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- =============================================
-- BUSINESS LOGIC TRIGGERS
-- =============================================

-- Validates booking dates to be within semester
DROP TRIGGER IF EXISTS validate_booking_dates_trigger ON bookings;
CREATE TRIGGER validate_booking_dates_trigger
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION validate_booking_dates();

-- Validates bed location is in a room
DROP TRIGGER IF EXISTS validate_bed_location_trigger ON beds;
CREATE TRIGGER validate_bed_location_trigger
BEFORE INSERT OR UPDATE ON beds
FOR EACH ROW EXECUTE FUNCTION validate_bed_location();
