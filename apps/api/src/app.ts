import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error-handler.js";

export function createApp() {
  const app = express();

  // Security headers. Sensible defaults out of the box.
  app.use(helmet());

  // CORS. Only the web app origin can call the API.
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );

  // JSON body parser. Cap at 1mb to prevent abuse.
  app.use(express.json({ limit: "1mb" }));

  // Structured request logging.
  app.use(
    pinoHttp({
      level: env.LOG_LEVEL,
      // Silence health check logs to keep output clean.
      autoLogging: {
        ignore: (req) => req.url === "/health",
      },
    }),
  );

  // Health check — used by load balancers, Docker, and humans.
  app.get("/health", (_req, res) => {
    res.json({"status":"ok","service":"fast-pass-api","version":"0.1.0"});
  });

  // Route modules mounted here.
  // Each module owns its own router; app.ts just wires them up.
  // (Coming next: /api/v1/organizations, /drivers, /gates, etc.)

  // Catch-all 404 and error handler — must be last.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
