import { pool } from "../../db/pool.js";

export type AccessLogInsert = {
  requestId: string;
  driverId: string;
  gateId: string;
  result: "ALLOW" | "DENY";
  reason: string | null;
};

/**
 * The verification repository has ONE job: append to the audit log.
 * No update. No delete. Section 6 of the spec: immutable records.
 */
export const verificationRepository = {
  async writeLog(entry: AccessLogInsert): Promise<void> {
    await pool.query(
      `INSERT INTO access_logs (request_id, driver_id, gate_id, result, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        entry.requestId,
        entry.driverId,
        entry.gateId,
        entry.result,
        entry.reason,
      ],
    );
  },
};
