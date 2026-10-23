import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool as NeonPool } from '@neondatabase/serverless';
import { Pool as PgPool } from 'pg';
import * as schema from './schema';

/**
 * Production talks to Neon over its serverless (WebSocket) driver. For local work, DATABASE_URL points at the
 * PGlite socket server (`npm run db:dev`), which speaks plain Postgres, so the node-postgres driver is used.
 * Both drivers expose the same query API, so callers see one type.
 */
export function connect(url: string | undefined = process.env.DATABASE_URL): NodePgDatabase<typeof schema> {
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Add your Neon connection string, or run `npm run db:dev` for local work.',
    );
  }
  if (/neon\.(tech|build)/.test(url)) {
    return drizzleNeon(new NeonPool({ connectionString: url }), { schema }) as unknown as NodePgDatabase<typeof schema>;
  }
  // The local PGlite stand-in is a single-connection database, so queries are serialized through one connection.
  const local = /(127\.0\.0\.1|localhost)/.test(url);
  const max = Number(process.env.DB_POOL_MAX ?? (local ? 1 : 10));
  return drizzlePg(new PgPool({ connectionString: url, max }), { schema });
}
