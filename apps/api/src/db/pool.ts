import pg from "pg";
import { env } from "../config/env.js";

/**
 * Shared Postgres connection pool.
 * One pool for the whole process — do NOT create a pool per request.
 */
export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  console.error("Unexpected Postgres pool error:", err);
  process.exit(1);
});
