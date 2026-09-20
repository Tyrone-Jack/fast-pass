import { Router } from "express";
import { accessRequestService } from "./access-request.service.js";

export const accessRequestRouter = Router();

/**
 * POST /api/v1/access-requests
 * UC-04: driver creates an access request.
 * Returns the request record including id + expiresAt.
 * The QR is just the id encoded client-side.
 */
accessRequestRouter.post("/", async (req, res) => {
  const request = await accessRequestService.create(req.body);
  res.status(201).json(request);
});

accessRequestRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) throw new Error("Route matched without :id");
  const request = await accessRequestService.getById(id);
  res.json(request);
});
