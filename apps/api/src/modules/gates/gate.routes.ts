import { Router } from "express";
import { gateService } from "./gate.service.js";

export const gateRouter = Router();

/**
 * POST /api/v1/gates
 * UC-03: register a gate.
 */
gateRouter.post("/", async (req, res) => {
  const gate = await gateService.create(req.body);
  res.status(201).json(gate);
});

gateRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) throw new Error("Route matched without :id");
  const gate = await gateService.getById(id);
  res.json(gate);
});

gateRouter.get("/", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const gates = await gateService.list(limit, offset);
  res.json({ data: gates });
});
