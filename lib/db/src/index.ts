import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let _pool: pg.Pool | undefined;
let _db: NodePgDatabase<typeof schema> | undefined;

function getPool(): pg.Pool {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?",
      );
    }
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return _pool;
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}

export { getPool as pool };

export * from "./schema";
