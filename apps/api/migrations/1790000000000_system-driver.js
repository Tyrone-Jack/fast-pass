/**
 * Seed a SYSTEM driver.
 *
 * Purpose: when verification is attempted with a requestId that
 * doesn't exist in the DB, there's no real driver to log against.
 * The access_logs.driver_id FK still requires a valid driver row.
 *
 * We insert a known-UUID system driver representing FastPass itself.
 * Its organization is likewise a SYSTEM organization.
 *
 * This row must never appear in user-facing lists — services filter
 * it out when listing real organizations or drivers.
 */

exports.shorthands = undefined;

const SYSTEM_ORG_ID = "00000000-0000-0000-0000-000000000001";
const SYSTEM_DRIVER_ID = "00000000-0000-0000-0000-000000000000";

exports.up = (pgm) => {
  pgm.sql(`
    INSERT INTO organizations (id, name, status)
    VALUES ('${SYSTEM_ORG_ID}', '__SYSTEM__', 'INACTIVE')
    ON CONFLICT (id) DO NOTHING;
  `);

  pgm.sql(`
    INSERT INTO drivers (id, organization_id, name, phone, status)
    VALUES (
      '${SYSTEM_DRIVER_ID}',
      '${SYSTEM_ORG_ID}',
      '__SYSTEM__',
      '0000000000',
      'INACTIVE'
    )
    ON CONFLICT (id) DO NOTHING;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DELETE FROM drivers WHERE id = '${SYSTEM_DRIVER_ID}';`);
  pgm.sql(`DELETE FROM organizations WHERE id = '${SYSTEM_ORG_ID}';`);
};
