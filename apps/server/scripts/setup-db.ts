import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import pino from 'pino';
import pretty from 'pino-pretty';

// Load environment variables
dotenv.config();

const logger = pino(
  pretty({
    colorize: true,
    singleLine: true,
    ignore: 'pid,hostname',
  }),
);

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
const DB_NAME = getEnv('DB_NAME');

async function run() {
  const client = new Client(DB_CONFIG);

  try {
    logger.info('Connecting to database...');
    await client.connect();

    const files = [
      '../../../packages/database/00_roles.sql',
      '../../../packages/database/01_infrastructure.sql',
      '../../../packages/database/02_domain_schema.sql',
      '../../../packages/database/03_triggers.sql',
      '../../../packages/database/04_apply_triggers.sql',
      '../../../packages/database/05_session_store.sql',
    ];

    for (const file of files) {
      const filePath = path.join(__dirname, file);
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
