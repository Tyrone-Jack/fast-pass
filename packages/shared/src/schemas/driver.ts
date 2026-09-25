import { z } from "zod";
import { EntityStatusSchema, IdSchema, TimestampSchema } from "./common.js";

export const DriverSchema = z.object({
  id: IdSchema,
  organizationId: IdSchema,
  name: z.string().min(1).max(200),
  phone: z.string().min(5).max(20),
  email: z.string().email().max(200),
  status: EntityStatusSchema,
  createdAt: TimestampSchema,
});
export type Driver = z.infer<typeof DriverSchema>;

export const PublicDriverSchema = DriverSchema.pick({
  id: true,
  name: true,
  status: true,
  email: true,
});
export type PublicDriver = z.infer<typeof PublicDriverSchema>;

export const CreateDriverInputSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(5).max(20).regex(/^[+0-9 ()-]+$/),
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
});
export type CreateDriverInput = z.infer<typeof CreateDriverInputSchema>;

export const UpdateDriverInputSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().min(5).max(20).optional(),
  status: EntityStatusSchema.optional(),
});
export type UpdateDriverInput = z.infer<typeof UpdateDriverInputSchema>;

export const ListDriversQuerySchema = z.object({
  organizationId: IdSchema.optional(),
  status: EntityStatusSchema.optional(),
});
export type ListDriversQuery = z.infer<typeof ListDriversQuerySchema>;
