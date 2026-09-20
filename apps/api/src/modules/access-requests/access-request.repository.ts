import { pool } from "../../db/pool.js";

type AccessRequestRow = {
  id: string;
  driver_id: string;
  organization_id: string;
  gate_id: string;
  purpose: string;
  status: string;
  expires_at: Date;
  created_at: Date;
};

export type AccessRequestRecord = {
  id: string;
  driverId: string;
  organizationId: string;
  gateId: string;
  purpose: string;
  status: string;
  expiresAt: string;
  createdAt: string;
};

function mapRow(row: AccessRequestRow): AccessRequestRecord {
  return {
    id: row.id,
    driverId: row.driver_id,
    organizationId: row.organization_id,
    gateId: row.gate_id,
    purpose: row.purpose,
    status: row.status,
    expiresAt: row.expires_at.toISOString(),
    createdAt: row.created_at.toISOString(),
  };
}

export const accessRequestRepository = {
  async create(input: {
    driverId: string;
    organizationId: string;
    gateId: string;
    purpose: string;
    expiresAt: Date;
  }): Promise<AccessRequestRecord> {
    const { rows } = await pool.query<AccessRequestRow>(
      `INSERT INTO access_requests
         (driver_id, organization_id, gate_id, purpose, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, driver_id, organization_id, gate_id, purpose,
                 status, expires_at, created_at`,
      [
        input.driverId,
        input.organizationId,
        input.gateId,
        input.purpose,
        input.expiresAt,
      ],
    );
    const row = rows[0];
    if (!row) throw new Error("INSERT returned no row");
    return mapRow(row);
  },

  async findById(id: string): Promise<AccessRequestRecord | null> {
    const { rows } = await pool.query<AccessRequestRow>(
      `SELECT id, driver_id, organization_id, gate_id, purpose,
              status, expires_at, created_at
       FROM access_requests
       WHERE id = $1`,
      [id],
    );
    const row = rows[0];
    return row ? mapRow(row) : null;
  },

  async markUsed(id: string): Promise<void> {
    await pool.query(
      `UPDATE access_requests SET status = 'USED' WHERE id = $1`,
      [id],
    );
  },
};
