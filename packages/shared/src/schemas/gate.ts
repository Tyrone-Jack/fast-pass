import { z } from "zod";
import { EntityStatusSchema, IdSchema, TimestampSchema } from "./common.js";

/**
 * Full Gate record.
 * Section 7 of the spec:
 *   gates: id, name, location, status, created_at
 *
 * Section 3 UC-03 example:
 *   Gate #01 / ABC Distribution Centre / Nairobi / ACTIVE
 */
export const GateSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(200),
  location: z.string().min(1).max(500),
  status: EntityStatusSchema,
  createdAt: TimestampSchema,
});
export type Gate = z.infer<typeof GateSchema>;

/**
 * Public Gate projection — the whole record is safe to expose.
 * Kept as a separate export so we can trim it later without breaking callers.
 */
export const PublicGateSchema = GateSchema;
export type PublicGate = z.infer<typeof PublicGateSchema>;

/**
 * Payload for POST /gates (UC-03).
 * Only FastPass Admin can call this (Section 3).
 */
export const CreateGateInputSchema = z.object({
  name: z.string().min(1).max(200),
  location: z.string().min(1).max(500),
});
export type CreateGateInput = z.infer<typeof CreateGateInputSchema>;

export const UpdateGateInputSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  location: z.string().min(1).max(500).optional(),
  status: EntityStatusSchema.optional(),
});
export type UpdateGateInput = z.infer<typeof UpdateGateInputSchema>;

export const ListGatesQuerySchema = z.object({
  status: EntityStatusSchema.optional(),
});
export type ListGatesQuery = z.infer<typeof ListGatesQuerySchema>;
