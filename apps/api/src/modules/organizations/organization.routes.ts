import { Router } from "express";
import { organizationService } from "./organization.service.js";

export const organizationRouter = Router();

/**
 * POST /api/v1/organizations
 * UC-01: register a logistics organization.
 */
organizationRouter.post("/", async (req, res) => {
  // req.body is unknown. The service validates it.
  // Express 5 forwards async rejections to the error handler.
  const org = await organizationService.create(req.body);
  res.status(201).json(org);
});

/**
 * GET /api/v1/organizations/:id
 */
organizationRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) throw new Error("Route matched without :id — Express bug?");
  const org = await organizationService.getById(id);
  res.json(org);
});

/**
 * GET /api/v1/organizations?limit=50&offset=0
 */
organizationRouter.get("/", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const orgs = await organizationService.list(limit, offset);
  res.json({ data: orgs });
});
