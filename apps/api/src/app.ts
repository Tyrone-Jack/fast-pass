import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { organizationRouter } from "./modules/organizations/organization.routes.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error-handler.js";

export function createApp() {
  const app = express();

  app.use(helmet());

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "1mb" }));

  app.use(
    pinoHttp({
      level: env.LOG_LEVEL,
      autoLogging: {
        ignore: (req) => req.url === "/health",
      },
    }),
  );

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "fast-pass-api", version: "0.1.0" });
  });

  // --- API v1 --------------------------------------------------------------
  app.use("/api/v1/organizations", organizationRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
