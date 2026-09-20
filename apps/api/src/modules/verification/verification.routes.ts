import { Router } from "express";
import { verificationService } from "./verification.service.js";

export const verificationRouter = Router();

/**
 * POST /api/v1/verification/scan
 * UC-06: guard scans a QR. Body: { requestId, gateId }.
 * Returns ALLOW or DENY per Section 4 verification rules.
 */
verificationRouter.post("/scan", async (req, res) => {
  const result = await verificationService.scan(req.body);
  // 200 for both ALLOW and DENY — the request itself succeeded.
  // The "result" field conveys the business outcome.
  res.json(result);
});
