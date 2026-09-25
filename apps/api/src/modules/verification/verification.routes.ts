import { Router } from "express";
import { verificationService } from "./verification.service.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { HttpError } from "../../middleware/error-handler.js";

export const verificationRouter = Router();

/**
 * POST /api/v1/verification/scan-gate
 * Requires driver session.
 * Body: { gateToken }
 */
verificationRouter.post("/scan-gate", requireAuth, async (req, res) => {
  if (!req.driver) throw new HttpError(401, "Not authenticated", "UNAUTHENTICATED");
  const result = await verificationService.scanGate(req.driver, req.body);
  res.json(result);
});
