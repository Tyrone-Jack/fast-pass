import { z } from "zod";
import { EntityStatusSchema, IdSchema, TimestampSchema } from "./common.js";

/**
 * Full Driver record, server-side only.
 * Section 7 of the spec:
 *   drivers: id, organization_id, name, phone, status, created_at
 */
export const DriverSchema = z.object({
  id: IdSchema,
  organizationId: IdSchema,
  name: z.string().min(1).max(200),
  phone: z.string().min(5).max(20),
  status: EntityStatusSchema,
  createdAt: TimestampSchema,
});
export type Driver = z.infer<typeof DriverSchema>;

/**
 * Public Driver projection — safe to send to clients.
 * Excludes phone (PII) and organizationId (internal linkage).
 * Section 10 example response only exposes name + organization name.
 */
export const PublicDriverSchema = DriverSchema.pick({
  id: true,
  name: true,
  status: true,
});
export type PublicDriver = z.infer<typeof PublicDriverSchema>;

/**
 * Payload for POST /drivers (UC-02).
 * organizationId comes from the caller's session, not the body.
 * id/status/createdAt are generated server-side.
 */
export const CreateDriverInputSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z
    .string()
    .min(5)
    .max(20)
    // Very loose validation — we don't know the country's format.
    // Tighten this once the first customer tells us their format.
    .regex(/^[+0-9 ()-]+$/, "Phone may only contain digits, spaces, +, -, ()"),
});
export type CreateDriverInput = z.infer<typeof CreateDriverInputSchema>;

/**
 * Update payload — partial.
 */
export const UpdateDriverInputSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().min(5).max(20).optional(),
  status: EntityStatusSchema.optional(),
});
export type UpdateDriverInput = z.infer<typeof UpdateDriverInputSchema>;

/**
 * Query filter for GET /drivers?organizationId=...
 */
export const ListDriversQuerySchema = z.object({
  organizationId: IdSchema.optional(),
  status: EntityStatusSchema.optional(),
});
export type ListDriversQuery = z.infer<typeof ListDriversQuerySchema>;
