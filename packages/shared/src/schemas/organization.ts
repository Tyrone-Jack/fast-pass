import { z } from "zod";
import { EntityStatusSchema, IdSchema, TimestampSchema } from "./common.js";

export const OrganizationSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(200),
  purpose: z.string().min(1).max(200),
  status: EntityStatusSchema,
  createdAt: TimestampSchema,
});
export type Organization = z.infer<typeof OrganizationSchema>;

export const CreateOrganizationInputSchema = z.object({
  name: z.string().min(1).max(200),
  purpose: z.string().min(1).max(200).default("Delivery"),
});
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationInputSchema>;

export const UpdateOrganizationInputSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  purpose: z.string().min(1).max(200).optional(),
  status: EntityStatusSchema.optional(),
});
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationInputSchema>;
