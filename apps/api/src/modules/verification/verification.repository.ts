import { pool } from "../../db/pool.js";

export type AccessLogInsert = {
  reference: string | null;
  driverId: string;
  organizationId: string;
  gateId: string;
  purpose: string;
  result: "ALLOW" | "DENY";
  reason: string | null;
};

export const verificationRepository = {
  async writeLog(entry: AccessLogInsert): Promise<void> {
    await pool.query(
      `INSERT INTO access_logs
         (reference, driver_id, organization_id, gate_id, purpose, result, reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        entry.reference,
        entry.driverId,
        entry.organizationId,
        entry.gateId,
        entry.purpose,
        entry.result,
        entry.reason,
      ],
    );
  },
};
