import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import pino from 'pino';

// Load environment variables
dotenv.config();

const logger = pino();

function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    logger.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value;
}

const DB_CONFIG: any = {};

// support for either a full Connection String OR individual parameters
// full connection means it's coming from the docker compose setup.
// individual parameters could be a local dev instance.
if (process.env.DATABASE_URL) {
  DB_CONFIG.connectionString = process.env.DATABASE_URL;
} else {
  logger.info('No DATABASE_URL found, checking for individual connection parameters...');
  DB_CONFIG.user = getEnv('DB_USER');
  DB_CONFIG.host = getEnv('DB_HOST');
  DB_CONFIG.database = getEnv('DB_NAME');
  DB_CONFIG.password = getEnv('DB_PASSWORD');
  DB_CONFIG.port = parseInt(getEnv('DB_PORT'), 10);
}

// secrets to inject into the sql files.
const APP_USER_PASSWORD = getEnv('APP_USER_PASSWORD');
const APP_USER = getEnv('APP_USER');

// DB_NAME is used for role creation in 00_roles.sql.
// In prod, it's part of DATABASE_URL.
let dbName = process.env.DB_NAME;
if (!dbName && process.env.DATABASE_URL) {
  // Extract db name from postgresql://user:pass@host:port/db_name
  const parts = process.env.DATABASE_URL.split('/');
  dbName = parts[parts.length - 1].split('?')[0];
}

if (!dbName) {
  logger.error(
    'Missing required environment variable: DB_NAME (and could not derive from DATABASE_URL)',
  );
  process.exit(1);
}

const DB_NAME = dbName as string;

async function run() {
  const client = new Client(DB_CONFIG);

  try {
    logger.info('Connecting to database...');
    await client.connect();

    // Use absolute paths relative to the project root in Docker/Prod
    const baseDir =
      process.env.NODE_ENV === 'production'
        ? '/app/packages/database'
        : path.join(__dirname, '../../../packages/database');

    const files = [
      '00_roles.sql',
      '01_infrastructure.sql',
      '02_domain_schema.sql',
      '03_triggers.sql',
      '04_apply_triggers.sql',
      '05_session_store.sql',
      '06_notifications.sql',
    ];

    for (const file of files) {
      const filePath = path.join(baseDir, file);
      logger.info(`Processing ${path.basename(filePath)}...`);

      let sql = fs.readFileSync(filePath, 'utf8');

      // INJECT SECRETS
      if (file.includes('00_roles.sql')) {
        sql = sql.replace(/\${APP_USER_PASSWORD}/g, APP_USER_PASSWORD);
        sql = sql.replace(/\${APP_USER}/g, APP_USER);
        sql = sql.replace(/\${DB_NAME}/g, DB_NAME);
      }

      await client.query(sql);
      logger.info(`Successfully Executed ${path.basename(filePath)}`);
    }

    logger.info('Database setup complete!');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
