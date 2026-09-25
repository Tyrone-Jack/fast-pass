import type { NextFunction, Request, Response } from "express";
import { authService, type CurrentDriver } from "../modules/auth/auth.service.js";
import { COOKIE_NAME } from "../modules/auth/auth.routes.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      driver?: CurrentDriver;
    }
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const sessionId = req.cookies?.[COOKIE_NAME];
    const driver = await authService.currentDriver(sessionId);
    req.driver = driver;
    next();
  } catch (err) {
    next(err);
  }
}
