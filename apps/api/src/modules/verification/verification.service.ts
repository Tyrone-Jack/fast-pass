import { ScanGateInputSchema } from "@fast-pass/shared";
import { HttpError } from "../../middleware/error-handler.js";
import type { CurrentDriver } from "../auth/auth.service.js";
import { gateRepository } from "../gates/gate.repository.js";
import { organizationRepository } from "../organizations/organization.repository.js";
import { driverRepository } from "../drivers/driver.repository.js";
import { verificationRepository } from "./verification.repository.js";

export type VerificationResult =
  | {
      result: "ALLOW";
      driver: { id: string; name: string };
      organization: { id: string; name: string };
      gate: { id: string; name: string };
      purpose: string;
      verifiedAt: string;
    }
  | { result: "DENY"; reason: string; verifiedAt: string };

export const verificationService = {
  async scanGate(
    driver: CurrentDriver,
    body: unknown,
  ): Promise<VerificationResult> {
    const parsed = ScanGateInputSchema.parse(body);
    const now = new Date();
    const verifiedAt = now.toISOString();

    // 1. Find gate by token
    const gate = await gateRepository.findByToken(parsed.gateToken);
    if (!gate) {
      // Cannot log without a valid gate (FK requires gate_id).
      // We still return DENY; audit is skipped here intentionally.
      return { result: "DENY", reason: "GATE_NOT_FOUND", verifiedAt };
    }

    // 2. Load driver + org (server-side truth, not client)
    const fullDriver = await driverRepository.findById(driver.id);
    if (!fullDriver) {
      return this.deny(null, gate.id, "DRIVER_NOT_FOUND", "Delivery", verifiedAt);
    }

    const org = await organizationRepository.findById(fullDriver.organizationId);
    if (!org) {
      return this.deny(
        fullDriver,
        gate.id,
        "ORGANIZATION_INACTIVE",
        "Delivery",
        verifiedAt,
      );
    }

    // 3. Driver active
    if (fullDriver.status !== "ACTIVE") {
      return this.deny(fullDriver, gate.id, "DRIVER_INACTIVE", org.purpose, verifiedAt);
    }

    // 4. Org active
    if (org.status !== "ACTIVE") {
      return this.deny(
        fullDriver,
        gate.id,
        "ORGANIZATION_INACTIVE",
        org.purpose,
        verifiedAt,
      );
    }

    // 5. Gate active
    if (gate.status !== "ACTIVE") {
      return this.deny(fullDriver, gate.id, "GATE_INACTIVE", org.purpose, verifiedAt);
    }

    // 6. Gate authorization: allow if no explicit entries, else match.
    const authorized = await this.isAuthorized(gate.id, org.id);
    if (!authorized) {
      return this.deny(
        fullDriver,
        gate.id,
        "GATE_NOT_AUTHORIZED",
        org.purpose,
        verifiedAt,
      );
    }

    // ALLOW
    await verificationRepository.writeLog({
      reference: null,
      driverId: fullDriver.id,
      organizationId: org.id,
      gateId: gate.id,
      purpose: org.purpose,
      result: "ALLOW",
      reason: null,
    });

    return {
      result: "ALLOW",
      driver: { id: fullDriver.id, name: fullDriver.name },
      organization: { id: org.id, name: org.name },
      gate: { id: gate.id, name: gate.name },
      purpose: org.purpose,
      verifiedAt,
    };
  },

  async isAuthorized(gateId: string, organizationId: string): Promise<boolean> {
    const { pool } = await import("../../db/pool.js");
    const { rows } = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM gate_authorized_organizations
       WHERE gate_id = $1`,
      [gateId],
    );
    const count = Number(rows[0]?.count ?? "0");
    if (count === 0) return true; // open gate

    const { rows: match } = await pool.query(
      `SELECT 1 FROM gate_authorized_organizations
       WHERE gate_id = $1 AND organization_id = $2`,
      [gateId, organizationId],
    );
    return match.length > 0;
  },

  async deny(
    driver: { id: string; organizationId: string } | null,
    gateId: string,
    reason: string,
    purpose: string,
    verifiedAt: string,
  ): Promise<VerificationResult> {
    if (driver) {
      await verificationRepository.writeLog({
        reference: null,
        driverId: driver.id,
        organizationId: driver.organizationId,
        gateId,
        purpose,
        result: "DENY",
        reason,
      });
    }
    return { result: "DENY", reason, verifiedAt };
  },
};
