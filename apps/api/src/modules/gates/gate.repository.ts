import { pool } from "../../db/pool.js";

type GateRow = {
  id: string;
  name: string;
  location: string;
  status: string;
  created_at: Date;
};

export type GateRecord = {
  id: string;
  name: string;
  location: string;
  status: string;
  createdAt: string;
};

function mapRow(row: GateRow): GateRecord {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };
}

export const gateRepository = {
  async create(name: string, location: string): Promise<GateRecord> {
    const { rows } = await pool.query<GateRow>(
      `INSERT INTO gates (name, location)
       VALUES ($1, $2)
       RETURNING id, name, location, status, created_at`,
      [name, location],
    );
    const row = rows[0];
    if (!row) throw new Error("INSERT returned no row");
    return mapRow(row);
  },

  async findById(id: string): Promise<GateRecord | null> {
    const { rows } = await pool.query<GateRow>(
      `SELECT id, name, location, status, created_at
       FROM gates
       WHERE id = $1`,
      [id],
    );
    const row = rows[0];
    return row ? mapRow(row) : null;
  },

  async list(limit: number, offset: number): Promise<GateRecord[]> {
    const { rows } = await pool.query<GateRow>(
      `SELECT id, name, location, status, created_at
       FROM gates
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return rows.map(mapRow);
  },
};
