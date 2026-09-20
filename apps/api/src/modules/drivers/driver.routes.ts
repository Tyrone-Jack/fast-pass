import { Router } from "express";
import { driverService } from "./driver.service.js";

export const driverRouter = Router();

/**
 * POST /api/v1/organizations/:organizationId/drivers
 * UC-02: register a driver under an organization.
 */
driverRouter.post("/organizations/:organizationId/drivers", async (req, res) => {
  const { organizationId } = req.params;
  if (!organizationId) throw new Error("Route matched without :organizationId");
  const driver = await driverService.create(organizationId, req.body);
  res.status(201).json(driver);
});

/**
 * GET /api/v1/drivers/:id
 */
driverRouter.get("/drivers/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) throw new Error("Route matched without :id");
  const driver = await driverService.getById(id);
  res.json(driver);
});

/**
 * GET /api/v1/organizations/:organizationId/drivers
 */
driverRouter.get("/organizations/:organizationId/drivers", async (req, res) => {
  const { organizationId } = req.params;
  if (!organizationId) throw new Error("Route matched without :organizationId");
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const drivers = await driverService.listByOrganization(
    organizationId,
    limit,
    offset,
  );
  res.json({ data: drivers });
});
