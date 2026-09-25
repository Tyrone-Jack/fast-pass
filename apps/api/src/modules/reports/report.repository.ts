import { pool } from "../../db/pool.js";

export type GateLogRow = {
  result: string;
  reason: string | null;
  purpose: string;
  verified_at: Date;
  driver_name: string;
  driver_phone: string;
  driver_email: string;
  organization_name: string;
};

export type OrgLogRow = {
  result: string;
  reason: string | null;
  purpose: string;
  verified_at: Date;
  driver_name: string;
  gate_name: string;
  gate_location: string;
};

export const reportRepository = {
  async gateLogs(gateId: string): Promise<GateLogRow[]> {
    const { rows } = await pool.query<GateLogRow>(
      `SELECT al.result, al.reason, al.purpose, al.verified_at,
              d.name AS driver_name, d.phone AS driver_phone,
              d.email AS driver_email, o.name AS organization_name
       FROM access_logs al
       JOIN drivers d ON d.id = al.driver_id
       JOIN organizations o ON o.id = al.organization_id
       WHERE al.gate_id = $1
       ORDER BY al.verified_at DESC`,
      [gateId],
    );
    return rows;
  },

  async orgLogs(organizationId: string): Promise<OrgLogRow[]> {
    const { rows } = await pool.query<OrgLogRow>(
      `SELECT al.result, al.reason, al.purpose, al.verified_at,
              d.name AS driver_name,
              g.name AS gate_name, g.location AS gate_location
       FROM access_logs al
       JOIN drivers d ON d.id = al.driver_id
       JOIN gates g ON g.id = al.gate_id
       WHERE al.organization_id = $1
       ORDER BY al.verified_at DESC`,
      [organizationId],
    );
    return rows;
  },

  async gateById(gateId: string): Promise<{ id: string; name: string; location: string } | null> {
    const { rows } = await pool.query<{ id: string; name: string; location: string }>(
      `SELECT id, name, location FROM gates WHERE id = $1`,
      [gateId],
    );
    return rows[0] ?? null;
  },

  async orgById(id: string): Promise<{ id: string; name: string; purpose: string } | null> {
    const { rows } = await pool.query<{ id: string; name: string; purpose: string }>(
      `SELECT id, name, purpose FROM organizations WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  },
};
