import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const DB_CONFIG: any = {};

if (process.env.DATABASE_URL) {
  DB_CONFIG.connectionString = process.env.DATABASE_URL;
} else {
  DB_CONFIG.user = process.env.DB_USER;
  DB_CONFIG.host = process.env.DB_HOST;
  DB_CONFIG.database = process.env.DB_NAME;
  DB_CONFIG.password = process.env.DB_PASSWORD;
  DB_CONFIG.port = parseInt(process.env.DB_PORT || '5432', 10);
}

async function reset() {
  const client = new Client(DB_CONFIG);

  try {
    console.log('Connecting to database to perform RESET...');
    await client.connect();

    console.log('Dropping schemas...');

    // Drop Audit Schema
    await client.query('DROP SCHEMA IF EXISTS audit CASCADE');
    console.log('Dropped schema: audit');

    // Drop Public Schema and recreate
    await client.query('DROP SCHEMA IF EXISTS public CASCADE');
    await client.query('CREATE SCHEMA public');
    await client.query('GRANT ALL ON SCHEMA public TO public'); // Restore default permissions
    console.log('Recreated schema: public');

    console.log('Database reset complete.');
  } catch (error) {
    console.error('Database reset failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

reset();
