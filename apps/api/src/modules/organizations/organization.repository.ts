import { pool } from "../../db/pool.js";

type OrganizationRow = {
  id: string;
  name: string;
  purpose: string;
  status: string;
  created_at: Date;
};

export type OrganizationRecord = {
  id: string;
  name: string;
  purpose: string;
  status: string;
  createdAt: string;
};

function mapRow(row: OrganizationRow): OrganizationRecord {
  return {
    id: row.id,
    name: row.name,
    purpose: row.purpose,
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };
}

export const organizationRepository = {
  async create(name: string, purpose: string): Promise<OrganizationRecord> {
    const { rows } = await pool.query<OrganizationRow>(
      `INSERT INTO organizations (name, purpose)
       VALUES ($1, $2)
       RETURNING id, name, purpose, status, created_at`,
      [name, purpose],
    );
    const row = rows[0];
    if (!row) throw new Error("INSERT returned no row");
    return mapRow(row);
  },

  async findById(id: string): Promise<OrganizationRecord | null> {
    const { rows } = await pool.query<OrganizationRow>(
      `SELECT id, name, purpose, status, created_at
       FROM organizations
       WHERE id = $1`,
      [id],
    );
    const row = rows[0];
    return row ? mapRow(row) : null;
  },

  async list(limit: number, offset: number): Promise<OrganizationRecord[]> {
    const { rows } = await pool.query<OrganizationRow>(
      `SELECT id, name, purpose, status, created_at
       FROM organizations
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return rows.map(mapRow);
  },
};
