import './env.mts';
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator';
import { migrate as migrateNeon } from 'drizzle-orm/neon-serverless/migrator';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { Pool as PgPool } from 'pg';
import { Pool as NeonPool } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

if (/neon\.(tech|build)/.test(url)) {
  const pool = new NeonPool({ connectionString: url });
  await migrateNeon(drizzleNeon(pool), { migrationsFolder: './drizzle' });
  await pool.end();
} else {
  const pool = new PgPool({ connectionString: url, max: 1 });
  await migratePg(drizzlePg(pool), { migrationsFolder: './drizzle' });
  await pool.end();
}
console.log('Migrations applied.');
