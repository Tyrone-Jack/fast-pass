exports.shorthands = undefined;

exports.up = (pgm) => {
  // 1. organizations.purpose
  pgm.addColumn("organizations", {
    purpose: { type: "text", notNull: true, default: "Delivery" },
  });

  // 2. drivers: email + password_hash
  pgm.addColumn("drivers", {
    email: { type: "text" },
    password_hash: { type: "text" },
  });
  pgm.sql(`
    UPDATE drivers
    SET email = 'unused-' || id || '@invalid.fastpass.local',
        password_hash = '!'
    WHERE email IS NULL;
  `);
  pgm.alterColumn("drivers", "email", { notNull: true });
  pgm.alterColumn("drivers", "password_hash", { notNull: true });
  pgm.addConstraint("drivers", "drivers_email_unique", { unique: "email" });

  // 3. gates.qr_token
  pgm.addColumn("gates", { qr_token: { type: "text" } });
  pgm.sql(`
    UPDATE gates
    SET qr_token = replace(gen_random_uuid()::text, '-', '') ||
                   replace(gen_random_uuid()::text, '-', '')
    WHERE qr_token IS NULL;
  `);
  pgm.alterColumn("gates", "qr_token", { notNull: true });
  pgm.addConstraint("gates", "gates_qr_token_unique", { unique: "qr_token" });

  // 4. gate_authorized_organizations
  pgm.createTable("gate_authorized_organizations", {
    gate_id: {
      type: "uuid",
      notNull: true,
      references: "gates(id)",
      onDelete: "CASCADE",
    },
    organization_id: {
      type: "uuid",
      notNull: true,
      references: "organizations(id)",
      onDelete: "CASCADE",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.addConstraint(
    "gate_authorized_organizations",
    "gate_authorized_organizations_pkey",
    { primaryKey: ["gate_id", "organization_id"] },
  );

  // 5. sessions
  pgm.createTable("sessions", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    driver_id: {
      type: "uuid",
      notNull: true,
      references: "drivers(id)",
      onDelete: "CASCADE",
    },
    expires_at: { type: "timestamptz", notNull: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.createIndex("sessions", "driver_id");
  pgm.createIndex("sessions", "expires_at");

  // 6. access_logs: adjust for v2
  //    IMPORTANT: drop FK BEFORE type change.
  pgm.dropConstraint("access_logs", "access_logs_request_id_fkey", {
    ifExists: true,
  });
  pgm.renameColumn("access_logs", "request_id", "reference");
  pgm.sql(`ALTER TABLE access_logs ALTER COLUMN reference DROP NOT NULL;`);
  pgm.sql(`ALTER TABLE access_logs ALTER COLUMN reference TYPE text USING reference::text;`);

  pgm.addColumn("access_logs", {
    organization_id: {
      type: "uuid",
      references: "organizations(id)",
      onDelete: "RESTRICT",
    },
    purpose: { type: "text" },
  });

  pgm.sql(`
    UPDATE access_logs al
    SET organization_id = d.organization_id,
        purpose = COALESCE(o.purpose, 'Delivery')
    FROM drivers d
    JOIN organizations o ON o.id = d.organization_id
    WHERE al.driver_id = d.id
      AND al.organization_id IS NULL;
  `);

  pgm.alterColumn("access_logs", "organization_id", { notNull: true });
  pgm.alterColumn("access_logs", "purpose", { notNull: true });
  pgm.createIndex("access_logs", "organization_id");

  // 7. Drop access_requests
  pgm.dropTable("access_requests");
};

exports.down = (pgm) => {
  // Recreate access_requests
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

  // access_logs: reverse v2 columns
  pgm.dropColumn("access_logs", "purpose");
  pgm.dropColumn("access_logs", "organization_id");
  pgm.sql(`ALTER TABLE access_logs ALTER COLUMN reference TYPE uuid USING NULL;`);
  pgm.renameColumn("access_logs", "reference", "request_id");
  pgm.sql(`ALTER TABLE access_logs ALTER COLUMN request_id SET NOT NULL;`);
  pgm.addConstraint("access_logs", "access_logs_request_id_fkey", {
    foreignKeys: {
      columns: "request_id",
      references: "access_requests(id)",
      onDelete: "RESTRICT",
    },
  });

  // Drop new tables
  pgm.dropTable("sessions");
  pgm.dropTable("gate_authorized_organizations");

  // gates
  pgm.dropConstraint("gates", "gates_qr_token_unique");
  pgm.dropColumn("gates", "qr_token");

  // drivers
  pgm.dropConstraint("drivers", "drivers_email_unique");
  pgm.dropColumn("drivers", "password_hash");
  pgm.dropColumn("drivers", "email");

  // organizations
  pgm.dropColumn("organizations", "purpose");
};
