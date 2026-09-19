import { z } from "zod";
import { EntityStatusSchema, IdSchema, TimestampSchema } from "./common.js";

/**
 * Full Organization record as returned by the API.
 * Section 7 of the spec:
 *   organizations: id, name, status, created_at
 */
export const OrganizationSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(200),
  status: EntityStatusSchema,
  createdAt: TimestampSchema,
});
export type Organization = z.infer<typeof OrganizationSchema>;

/**
 * Payload for POST /organizations.
 * UC-01: Admin creates an organization.
 * Only `name` is required from the client — `id`, `status`, `createdAt`
 * are generated server-side and must NOT be accepted from input.
 */
export const CreateOrganizationInputSchema = z.object({
  name: z.string().min(1).max(200),
});
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationInputSchema>;

/**
 * Payload for updating an organization.
 * All fields optional — only what's provided gets updated.
 */
export const UpdateOrganizationInputSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: EntityStatusSchema.optional(),
});
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationInputSchema>;
