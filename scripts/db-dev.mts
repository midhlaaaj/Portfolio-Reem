/**
 * Local stand-in for Neon: an on-disk PGlite database exposed over the Postgres wire protocol.
 * Run `npm run db:dev`, then point DATABASE_URL at postgres://postgres:postgres@127.0.0.1:5433/postgres
 */
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

const port = Number(process.env.DB_DEV_PORT ?? 5433);
const db = await PGlite.create('./.data/pglite');
const server = new PGLiteSocketServer({ db, port, host: '127.0.0.1', maxConnections: 10 });
await server.start();
console.log(`PGlite listening on postgres://postgres:postgres@127.0.0.1:${port}/postgres`);
process.on('SIGINT', async () => {
  await server.stop();
  await db.close();
  process.exit(0);
});
