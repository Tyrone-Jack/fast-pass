import { CreateAccessRequestInputSchema } from "@fast-pass/shared";
import { HttpError } from "../../middleware/error-handler.js";
import { driverRepository } from "../drivers/driver.repository.js";
import { gateRepository } from "../gates/gate.repository.js";
import {
  accessRequestRepository,
  type AccessRequestRecord,
} from "./access-request.repository.js";

/**
 * How long an access request stays valid.
 * Spec Section 12: QR tokens should be short-lived.
 * 5 minutes is long enough to walk to the gate, short enough to be safe.
 */
const REQUEST_TTL_MS = 5 * 60 * 1000;

export const accessRequestService = {
  async create(body: unknown): Promise<AccessRequestRecord> {
    const parsed = CreateAccessRequestInputSchema.parse(body);

    // Trust boundary: verify the driver actually exists.
    // We do NOT trust the driverId the client sent — we look it up.
    const driver = await driverRepository.findById(parsed.driverId);
    if (!driver) {
      throw new HttpError(404, "Driver not found", "DRIVER_NOT_FOUND");
    }

    // Same for the gate.
    const gate = await gateRepository.findById(parsed.gateId);
    if (!gate) {
      throw new HttpError(404, "Gate not found", "GATE_NOT_FOUND");
    }

    // organizationId is derived from the driver record,
    // NOT from the request body.
    const expiresAt = new Date(Date.now() + REQUEST_TTL_MS);

    return accessRequestRepository.create({
      driverId: driver.id,
      organizationId: driver.organizationId,
      gateId: gate.id,
      purpose: parsed.purpose,
      expiresAt,
    });
  },

  async getById(id: string): Promise<AccessRequestRecord> {
    const req = await accessRequestRepository.findById(id);
    if (!req) {
      throw new HttpError(
        404,
        "Access request not found",
        "REQUEST_NOT_FOUND",
      );
    }
    return req;
  },
};
