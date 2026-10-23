import 'server-only';
import { connect } from './connect';

const g = globalThis as unknown as { __db?: ReturnType<typeof connect> };
export const db = g.__db ?? (g.__db = connect());
export type DB = typeof db;
export * from './schema';
