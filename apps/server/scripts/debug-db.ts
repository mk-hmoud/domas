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

async function debug() {
  const client = new Client(DB_CONFIG);
  await client.connect();

  try {
    const res = await client.query(`
      SELECT table_schema, table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'audit' 
      ORDER BY table_name, ordinal_position;
    `);

    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

debug();
