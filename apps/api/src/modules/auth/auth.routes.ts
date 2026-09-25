import { Router } from "express";
import { authService } from "./auth.service.js";
import { env } from "../../config/env.js";

export const authRouter = Router();

const COOKIE_NAME = "fastpass_session";

/**
 * POST /api/v1/auth/login
 */
authRouter.post("/login", async (req, res) => {
  const { sessionId, expiresAt } = await authService.login(req.body);

  res.cookie(COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  res.json({ ok: true });
});

/**
 * POST /api/v1/auth/logout
 */
authRouter.post("/logout", async (req, res) => {
  const sessionId = req.cookies?.[COOKIE_NAME];
  await authService.logout(sessionId);
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
});

/**
 * GET /api/v1/auth/me
 */
authRouter.get("/me", async (req, res) => {
  const sessionId = req.cookies?.[COOKIE_NAME];
  const driver = await authService.currentDriver(sessionId);
  res.json(driver);
});

export { COOKIE_NAME };
