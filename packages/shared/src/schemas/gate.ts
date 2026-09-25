import { z } from "zod";
import { EntityStatusSchema, IdSchema, TimestampSchema } from "./common.js";

export const GateSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(200),
  location: z.string().min(1).max(500),
  qrToken: z.string().min(1).max(200),
  status: EntityStatusSchema,
  createdAt: TimestampSchema,
});
export type Gate = z.infer<typeof GateSchema>;

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
