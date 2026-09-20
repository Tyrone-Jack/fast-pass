import { pool } from "../../db/pool.js";

/**
 * Row shape as returned by Postgres.
 * Snake_case columns → camelCase fields happens in `mapRow`.
 * Keeping this mapping explicit means the rest of the app
 * never has to think about column names.
 */
type OrganizationRow = {
  id: string;
  name: string;
  status: string;
  created_at: Date;
};

export type OrganizationRecord = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
};

function mapRow(row: OrganizationRow): OrganizationRecord {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };
}

export const organizationRepository = {
  async create(name: string): Promise<OrganizationRecord> {
    const { rows } = await pool.query<OrganizationRow>(
      `INSERT INTO organizations (name)
       VALUES ($1)
       RETURNING id, name, status, created_at`,
      [name],
    );
    // noUncheckedIndexedAccess — need to check
    const row = rows[0];
    if (!row) throw new Error("INSERT returned no row");
    return mapRow(row);
  },

  async findById(id: string): Promise<OrganizationRecord | null> {
    const { rows } = await pool.query<OrganizationRow>(
      `SELECT id, name, status, created_at
       FROM organizations
       WHERE id = $1`,
      [id],
    );
    const row = rows[0];
    return row ? mapRow(row) : null;
  },

  async list(limit: number, offset: number): Promise<OrganizationRecord[]> {
    const { rows } = await pool.query<OrganizationRow>(
      `SELECT id, name, status, created_at
       FROM organizations
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return rows.map(mapRow);
  },
};
