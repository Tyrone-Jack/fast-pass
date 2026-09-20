import { z } from "zod";
import {
  AccessRequestStatusSchema,
  IdSchema,
  TimestampSchema,
} from "./common.js";

/**
 * Full AccessRequest record.
 * Section 7 of the spec:
 *   access_requests: id, driver_id, organization_id, gate_id,
 *                    purpose, status, expires_at, created_at
 *
 * Section 3 UC-04 example:
 *   Driver: John Kamau / Company: ABC Logistics
 *   Destination: XYZ Warehouse / Purpose: Package delivery
 *   Created: 10:31
 */
export const AccessRequestSchema = z.object({
  id: IdSchema,
  driverId: IdSchema,
  organizationId: IdSchema,
  gateId: IdSchema,
  purpose: z.string().min(1).max(500),
  status: AccessRequestStatusSchema,
  expiresAt: TimestampSchema,
  createdAt: TimestampSchema,
});
export type AccessRequest = z.infer<typeof AccessRequestSchema>;

/**
 * Payload for POST /access-requests.
 * Section 10 example body:
 *   { "driverId": "drv_104", "gateId": "gate_01",
 *     "purpose": "Package delivery" }
 *
 * IMPORTANT:
 * - organizationId is NOT here. Derived server-side from driverId.
 * - status/expiresAt/createdAt are NOT here. Server-generated.
 * - This is the Section 12 trust boundary: the client cannot lie
 *   about which organization it belongs to.
 */
export const CreateAccessRequestInputSchema = z.object({
  driverId: IdSchema,
  gateId: IdSchema,
  purpose: z.string().min(1).max(500),
});
export type CreateAccessRequestInput = z.infer<typeof CreateAccessRequestInputSchema>;

/**
 * Public projection returned to the Driver app after creating a request.
 * Section 10 response example:
 *   { "id": "req_82F91", "status": "PENDING",
 *     "expiresAt": "2026-08-27T10:00:00Z" }
 */
export const PublicAccessRequestSchema = AccessRequestSchema.pick({
  id: true,
  status: true,
  expiresAt: true,
});
export type PublicAccessRequest = z.infer<typeof PublicAccessRequestSchema>;
