import { z } from "zod";

/**
 * Entity ID format.
 * Prefixed CUID-style: org_..., drv_..., gate_..., req_..., log_...
 * For MVP we use a generic string with a length constraint.
 * Later this can be tightened to a specific ID generator's output.
 */
export const IdSchema = z
  .string()
  .min(3)
  .max(64)
  .regex(/^[a-z]+_[A-Za-z0-9]+$/, "ID must look like prefix_alphanumeric");

/**
 * ISO 8601 timestamp as a string.
 * We keep timestamps as strings at the boundary (JSON transport)
 * and convert to Date inside the API when needed.
 */
export const TimestampSchema = z
  .string()
  .datetime({ offset: true, message: "Must be an ISO 8601 timestamp" });

/**
 * Status used by organizations, drivers, gates.
 * Section 4 of the spec requires these to be checked during verification.
 */
export const EntityStatusSchema = z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]);
export type EntityStatus = z.infer<typeof EntityStatusSchema>;

/**
 * Access request lifecycle status.
 * Section 7 of the spec: access_requests.status
 */
export const AccessRequestStatusSchema = z.enum([
  "PENDING",
  "USED",
  "EXPIRED",
  "CANCELLED",
]);
export type AccessRequestStatus = z.infer<typeof AccessRequestStatusSchema>;

/**
 * Access log result — the outcome of verification.
 * Section 6 of the spec: result = ALLOW | DENY
 */
export const AccessResultSchema = z.enum(["ALLOW", "DENY"]);
export type AccessResult = z.infer<typeof AccessResultSchema>;

/**
 * Machine-readable reason codes for DENY.
 * Section 6 of the spec shows `reason: "REQUEST_EXPIRED"`.
 * These must be stable strings so logs are queryable.
 */
export const DenyReasonSchema = z.enum([
  "DRIVER_NOT_FOUND",
  "DRIVER_INACTIVE",
  "ORGANIZATION_INACTIVE",
  "ORGANIZATION_MISMATCH",
  "GATE_NOT_FOUND",
  "GATE_INACTIVE",
  "REQUEST_NOT_FOUND",
  "REQUEST_EXPIRED",
  "REQUEST_ALREADY_USED",
  "GATE_NOT_AUTHORIZED",
  "UNKNOWN",
]);
export type DenyReason = z.infer<typeof DenyReasonSchema>;
