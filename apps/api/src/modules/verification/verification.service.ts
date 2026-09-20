import { z } from "zod";
import { accessRequestRepository } from "../access-requests/access-request.repository.js";
import { driverRepository } from "../drivers/driver.repository.js";
import { gateRepository } from "../gates/gate.repository.js";
import { organizationRepository } from "../organizations/organization.repository.js";
import { verificationRepository } from "./verification.repository.js";

/**
 * Input for POST /verification/scan.
 * Section 10 of the spec: { requestId, gateId }.
 */
const ScanInputSchema = z.object({
  requestId: z.string().min(1),
  gateId: z.string().min(1),
});

export type VerificationResult =
  | {
      result: "ALLOW";
      driver: { id: string; name: string };
      organization: { id: string; name: string };
      gate: { id: string; name: string };
      purpose: string;
      verifiedAt: string;
    }
  | {
      result: "DENY";
      reason: string;
      verifiedAt: string;
    };

export const verificationService = {
  /**
   * Section 5 verification flow.
   *
   * Scanning the QR does NOT grant access. It triggers this function.
   * The QR merely carries the requestId — nothing else.
   *
   * Every attempt (ALLOW or DENY) writes exactly one row to access_logs.
   */
  async scan(body: unknown): Promise<VerificationResult> {
    const parsed = ScanInputSchema.parse(body);
    const { requestId, gateId } = parsed;
    const now = new Date();
    const verifiedAt = now.toISOString();

    // --- 1. Fetch the request ---
    const request = await accessRequestRepository.findById(requestId);
    if (!request) {
      await this.logDeny(requestId, gateId, "REQUEST_NOT_FOUND");
      return { result: "DENY", reason: "REQUEST_NOT_FOUND", verifiedAt };
    }

    // --- 2. Fetch the gate ---
    const gate = await gateRepository.findById(gateId);
    if (!gate) {
      // We have a request but no gate. Log against the request's driver
      // since we know who's involved.
      await verificationRepository.writeLog({
        requestId,
        driverId: request.driverId,
        gateId,
        result: "DENY",
        reason: "GATE_NOT_FOUND",
      });
      return { result: "DENY", reason: "GATE_NOT_FOUND", verifiedAt };
    }

    // --- 3. Request state checks ---
    if (request.status === "USED") {
      return this.deny(request, gateId, "REQUEST_ALREADY_USED", verifiedAt);
    }
    if (request.status !== "PENDING") {
      // EXPIRED or CANCELLED stored state
      return this.deny(request, gateId, "REQUEST_EXPIRED", verifiedAt);
    }
    if (new Date(request.expiresAt) < now) {
      return this.deny(request, gateId, "REQUEST_EXPIRED", verifiedAt);
    }

    // --- 4. Driver checks ---
    const driver = await driverRepository.findById(request.driverId);
    if (!driver) {
      return this.deny(request, gateId, "DRIVER_NOT_FOUND", verifiedAt);
    }
    if (driver.status !== "ACTIVE") {
      return this.deny(request, gateId, "DRIVER_INACTIVE", verifiedAt);
    }

    // --- 5. Organization checks ---
    const organization = await organizationRepository.findById(
      request.organizationId,
    );
    if (!organization) {
      return this.deny(request, gateId, "ORGANIZATION_INACTIVE", verifiedAt);
    }
    if (organization.status !== "ACTIVE") {
      return this.deny(request, gateId, "ORGANIZATION_INACTIVE", verifiedAt);
    }

    // --- 6. Gate checks ---
    if (gate.status !== "ACTIVE") {
      return this.deny(request, gateId, "GATE_INACTIVE", verifiedAt);
    }

    // --- 7. Gate authorization ---
    // The request was created for a specific gate. Scanning at a
    // different gate is denied.
    if (request.gateId !== gateId) {
      return this.deny(request, gateId, "GATE_NOT_AUTHORIZED", verifiedAt);
    }

    // --- ALL CHECKS PASSED ---
    await verificationRepository.writeLog({
      requestId,
      driverId: driver.id,
      gateId,
      result: "ALLOW",
      reason: null,
    });

    // Mark request as consumed — single-use per Section 12.
    await accessRequestRepository.markUsed(requestId);

    return {
      result: "ALLOW",
      driver: { id: driver.id, name: driver.name },
      organization: { id: organization.id, name: organization.name },
      gate: { id: gate.id, name: gate.name },
      purpose: request.purpose,
      verifiedAt,
    };
  },

  /**
   * Helper: write a DENY log + return the response shape.
   * Keeps the main flow readable.
   */
  async deny(
    request: { id: string; driverId: string },
    gateId: string,
    reason: string,
    verifiedAt: string,
  ): Promise<VerificationResult> {
    await verificationRepository.writeLog({
      requestId: request.id,
      driverId: request.driverId,
      gateId,
      result: "DENY",
      reason,
    });
    return { result: "DENY", reason, verifiedAt };
  },

  /**
   * Helper for the earliest DENY case where we have no request record.
   * Uses a placeholder driver_id because the audit table requires one.
   *
   * NOTE: In the schema, access_logs.driver_id has a FK to drivers.
   * A request that doesn't exist means we have no driver.
   * For the MVP we insert a fixed sentinel UUID that we'll seed as a
   * "system" driver. See migration 2 in the next phase.
   */
  async logDeny(
    requestId: string,
    gateId: string,
    reason: string,
  ): Promise<void> {
    // Placeholder — handled in the next migration.
    // We'll seed a SYSTEM driver row and reference its UUID.
    await verificationRepository.writeLog({
      requestId,
      driverId: "00000000-0000-0000-0000-000000000000",
      gateId,
      result: "DENY",
      reason,
    });
  },
};
