/**
 * Initial FastPass schema.
 *
 * Tables:
 *   organizations   — logistics companies (Section 7)
 *   drivers         — registered drivers (Section 7)
 *   gates           — physical access points (Section 7)
 *   access_requests — driver's intent to enter (Section 7)
 *   access_logs     — immutable verification records (Section 6/7)
 *
 * Conventions:
 *   - UUID primary keys (server-generated)
 *   - created_at / verified_at as TIMESTAMPTZ (timezone-aware)
 *   - status / result as TEXT with CHECK constraints
 *   - RESTRICT on foreign keys to preserve audit integrity
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // --- organizations -----------------------------------------------------
  pgm.createTable("organizations", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    name: { type: "text", notNull: true },
    status: {
      type: "text",
      notNull: true,
      default: "ACTIVE",
      check: "status IN ('ACTIVE','INACTIVE','SUSPENDED')",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  // --- drivers -----------------------------------------------------------
  pgm.createTable("drivers", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    organization_id: {
      type: "uuid",
      notNull: true,
      references: "organizations(id)",
      onDelete: "RESTRICT",
    },
    name: { type: "text", notNull: true },
    phone: { type: "text", notNull: true },
    status: {
      type: "text",
      notNull: true,
      default: "ACTIVE",
      check: "status IN ('ACTIVE','INACTIVE','SUSPENDED')",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.createIndex("drivers", "organization_id");

  // --- gates -------------------------------------------------------------
  pgm.createTable("gates", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    name: { type: "text", notNull: true },
    location: { type: "text", notNull: true },
    status: {
      type: "text",
      notNull: true,
      default: "ACTIVE",
      check: "status IN ('ACTIVE','INACTIVE','SUSPENDED')",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  // --- access_requests ---------------------------------------------------
  pgm.createTable("access_requests", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    driver_id: {
      type: "uuid",
      notNull: true,
      references: "drivers(id)",
      onDelete: "RESTRICT",
    },
    organization_id: {
      type: "uuid",
      notNull: true,
      references: "organizations(id)",
      onDelete: "RESTRICT",
    },
    gate_id: {
      type: "uuid",
      notNull: true,
      references: "gates(id)",
      onDelete: "RESTRICT",
    },
    purpose: { type: "text", notNull: true },
    status: {
      type: "text",
      notNull: true,
      default: "PENDING",
      check: "status IN ('PENDING','USED','EXPIRED','CANCELLED')",
    },
    expires_at: { type: "timestamptz", notNull: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.createIndex("access_requests", "driver_id");
  pgm.createIndex("access_requests", "organization_id");
  pgm.createIndex("access_requests", "gate_id");
  pgm.createIndex("access_requests", "status");

  // --- access_logs -------------------------------------------------------
  pgm.createTable("access_logs", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    request_id: {
      type: "uuid",
      notNull: true,
      references: "access_requests(id)",
      onDelete: "RESTRICT",
    },
    driver_id: {
      type: "uuid",
      notNull: true,
      references: "drivers(id)",
      onDelete: "RESTRICT",
    },
    gate_id: {
      type: "uuid",
      notNull: true,
      references: "gates(id)",
      onDelete: "RESTRICT",
    },
    result: {
      type: "text",
      notNull: true,
      check: "result IN ('ALLOW','DENY')",
    },
    reason: {
      type: "text",
      check:
        "reason IS NULL OR reason IN ('DRIVER_NOT_FOUND','DRIVER_INACTIVE','ORGANIZATION_INACTIVE','ORGANIZATION_MISMATCH','GATE_NOT_FOUND','GATE_INACTIVE','REQUEST_NOT_FOUND','REQUEST_EXPIRED','REQUEST_ALREADY_USED','GATE_NOT_AUTHORIZED','UNKNOWN')",
    },
    verified_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.createIndex("access_logs", "request_id");
  pgm.createIndex("access_logs", "driver_id");
  pgm.createIndex("access_logs", "gate_id");
  pgm.createIndex("access_logs", "verified_at");
};

exports.down = (pgm) => {
  pgm.dropTable("access_logs");
  pgm.dropTable("access_requests");
  pgm.dropTable("gates");
  pgm.dropTable("drivers");
  pgm.dropTable("organizations");
};
