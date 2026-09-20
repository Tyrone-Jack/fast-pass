import { z } from "zod";
import {
  AccessResultSchema,
  DenyReasonSchema,
  IdSchema,
  TimestampSchema,
} from "./common.js";

/**
 * Immutable AccessLog record.
 * Section 7 of the spec:
 *   access_logs: id, request_id, driver_id, gate_id,
 *                result, reason, verified_at
 *
 * There is NO update schema and NO delete schema.
 * Logs are append-only.
 */
export const AccessLogSchema = z.object({
  id: IdSchema,
  requestId: IdSchema,
  driverId: IdSchema,
  gateId: IdSchema,
  result: AccessResultSchema,
  reason: DenyReasonSchema.nullable(), // null when result === "ALLOW"
  verifiedAt: TimestampSchema,
});
export type AccessLog = z.infer<typeof AccessLogSchema>;

export const ListAccessLogsQuerySchema = z.object({
  driverId: IdSchema.optional(),
  gateId: IdSchema.optional(),
  requestId: IdSchema.optional(),
  result: AccessResultSchema.optional(),
  from: TimestampSchema.optional(),
  to: TimestampSchema.optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListAccessLogsQuery = z.infer<typeof ListAccessLogsQuerySchema>;
