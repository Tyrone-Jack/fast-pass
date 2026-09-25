import { Router } from "express";
import { reportService } from "./report.service.js";

export const reportRouter = Router();

reportRouter.get("/gate/:gateId.pdf", async (req, res) => {
  const { gateId } = req.params;
  if (!gateId) throw new Error("Route matched without :gateId");
  const doc = await reportService.gatePdf(gateId);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="gate-${gateId}.pdf"`);
  doc.pipe(res);
});

reportRouter.get("/org/:orgId.csv", async (req, res) => {
  const { orgId } = req.params;
  if (!orgId) throw new Error("Route matched without :orgId");
  const csv = await reportService.orgCsv(orgId);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="org-${orgId}.csv"`);
  res.send(csv);
});
