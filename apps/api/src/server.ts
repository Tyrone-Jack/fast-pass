import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./db/pool.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`🚀 FastPass API listening on http://localhost:${env.PORT}`);
  console.log(`   Environment: ${env.NODE_ENV}`);
});

/**
 * Graceful shutdown.
 * On SIGINT/SIGTERM: stop accepting new connections, wait for in-flight
 * requests to complete, close the DB pool, exit cleanly.
 */
async function shutdown(signal: string) {
  console.log(`\n${signal} received — shutting down...`);
  server.close(async () => {
    console.log("HTTP server closed.");
    await pool.end();
    console.log("Postgres pool closed.");
    process.exit(0);
  });

  // Safety net: force exit if graceful shutdown hangs.
  setTimeout(() => {
    console.error("Forced shutdown after 10s timeout.");
    process.exit(1);
  }, 10_000);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
