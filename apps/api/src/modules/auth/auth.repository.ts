import { pool } from "../../db/pool.js";

type DriverRow = {
  id: string;
  organization_id: string;
  name: string;
  phone: string;
  email: string;
  password_hash: string;
  status: string;
  created_at: Date;
};

export type AuthDriver = {
  id: string;
  organizationId: string;
  name: string;
  phone: string;
  email: string;
  passwordHash: string;
  status: string;
  createdAt: string;
};

function mapRow(row: DriverRow): AuthDriver {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    passwordHash: row.password_hash,
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };
}

export const authRepository = {
  async findDriverByEmail(email: string): Promise<AuthDriver | null> {
    const { rows } = await pool.query<DriverRow>(
      `SELECT id, organization_id, name, phone, email, password_hash,
              status, created_at
       FROM drivers
       WHERE email = $1`,
      [email],
    );
    const row = rows[0];
    return row ? mapRow(row) : null;
  },

  async createSession(
    driverId: string,
    expiresAt: Date,
  ): Promise<string> {
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO sessions (driver_id, expires_at)
       VALUES ($1, $2)
       RETURNING id`,
      [driverId, expiresAt],
    );
    const row = rows[0];
    if (!row) throw new Error("INSERT returned no row");
    return row.id;
  },

  async findSession(
    sessionId: string,
  ): Promise<{ driverId: string; expiresAt: Date } | null> {
    const { rows } = await pool.query<{
      driver_id: string;
      expires_at: Date;
    }>(
      `SELECT driver_id, expires_at FROM sessions WHERE id = $1`,
      [sessionId],
    );
    const row = rows[0];
    if (!row) return null;
    return { driverId: row.driver_id, expiresAt: row.expires_at };
  },

  async deleteSession(sessionId: string): Promise<void> {
    await pool.query(`DELETE FROM sessions WHERE id = $1`, [sessionId]);
  },
};
