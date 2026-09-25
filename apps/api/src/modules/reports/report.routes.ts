import { Router } from "express";
import { reportService } from "./report.service.js";

export const reportRouter = Router();

/**
 * GET /api/v1/reports/gate/:gateId.pdf
 * Real PDF. Anonymous for MVP — add auth in a later phase.
 */
reportRouter.get("/gate/:gateId.pdf", async (req, res) => {
  const { gateId } = req.params;
  if (!gateId) throw new Error("Route matched without :gateId");
  const stream = await reportService.gatePdf(gateId);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="gate-${gateId}.pdf"`,
  );
  stream.pipe(res);
});

/**
 * GET /api/v1/reports/org/:orgId.csv
 */
reportRouter.get("/org/:orgId.csv", async (req, res) => {
  const { orgId } = req.params;
  if (!orgId) throw new Error("Route matched without :orgId");
  const csv = await reportService.orgCsv(orgId);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="org-${orgId}.csv"`,
  );
  res.send(csv);
});
