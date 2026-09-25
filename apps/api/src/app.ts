import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { organizationRouter } from "./modules/organizations/organization.routes.js";
import { driverRouter } from "./modules/drivers/driver.routes.js";
import { gateRouter } from "./modules/gates/gate.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { verificationRouter } from "./modules/verification/verification.routes.js";
import { reportRouter } from "./modules/reports/report.routes.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error-handler.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(
    pinoHttp({
      level: env.LOG_LEVEL,
      autoLogging: { ignore: (req) => req.url === "/health" },
    }),
  );

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "fast-pass-api", version: "0.2.0" });
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/organizations", organizationRouter);
  app.use("/api/v1/gates", gateRouter);
  app.use("/api/v1/verification", verificationRouter);
  app.use("/api/v1/reports", reportRouter);
  app.use("/api/v1", driverRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
