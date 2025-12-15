-- =============================================
-- ROLES & PERMISSIONS
-- =============================================

-- Create the Application User
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = '${APP_USER}') THEN

      CREATE ROLE ${APP_USER} WITH LOGIN PASSWORD '${APP_USER_PASSWORD}';
   END IF;
END
$do$;

-- Grant Standard Schema Usage
GRANT CONNECT ON DATABASE domas TO ${APP_USER};
GRANT USAGE ON SCHEMA public TO ${APP_USER};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${APP_USER};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${APP_USER};

-- Ensure future tables created by migrations also get these permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${APP_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${APP_USER};

-- Define audit_writer role
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'audit_writer') THEN

      CREATE ROLE audit_writer NOLOGIN;
   END IF;
END
$do$;

-- Grant the inheritance
GRANT audit_writer TO ${APP_USER};
