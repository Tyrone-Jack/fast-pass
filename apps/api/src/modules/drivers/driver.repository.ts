import { pool } from "../../db/pool.js";

type DriverRow = {
  id: string;
  organization_id: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  created_at: Date;
};

export type DriverRecord = {
  id: string;
  organizationId: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  createdAt: string;
};

function mapRow(row: DriverRow): DriverRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };
}

export const driverRepository = {
  async create(
    organizationId: string,
    name: string,
    phone: string,
    email: string,
    passwordHash: string,
  ): Promise<DriverRecord> {
    const { rows } = await pool.query<DriverRow>(
      `INSERT INTO drivers (organization_id, name, phone, email, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, organization_id, name, phone, email, status, created_at`,
      [organizationId, name, phone, email, passwordHash],
    );
    const row = rows[0];
    if (!row) throw new Error("INSERT returned no row");
    return mapRow(row);
  },

  async findById(id: string): Promise<DriverRecord | null> {
    const { rows } = await pool.query<DriverRow>(
      `SELECT id, organization_id, name, phone, email, status, created_at
       FROM drivers
       WHERE id = $1`,
      [id],
    );
    const row = rows[0];
    return row ? mapRow(row) : null;
  },

  async listByOrganization(
    organizationId: string,
    limit: number,
    offset: number,
  ): Promise<DriverRecord[]> {
    const { rows } = await pool.query<DriverRow>(
      `SELECT id, organization_id, name, phone, email, status, created_at
       FROM drivers
       WHERE organization_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [organizationId, limit, offset],
    );
    return rows.map(mapRow);
  },
};
