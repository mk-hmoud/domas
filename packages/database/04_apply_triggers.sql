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

-- Student Profiles
DROP TRIGGER IF EXISTS update_student_profiles_modtime ON student_profiles;
CREATE TRIGGER update_student_profiles_modtime
BEFORE UPDATE ON student_profiles
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

-- Student Profiles (PK: 'user_id')
DROP TRIGGER IF EXISTS audit_profiles_change ON student_profiles;
CREATE TRIGGER audit_profiles_change
AFTER INSERT OR UPDATE OR DELETE ON student_profiles
FOR EACH ROW EXECUTE FUNCTION audit.log_change('user_id');

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
