import {
  CreateOrganizationInputSchema,
  type CreateOrganizationInput,
} from "@fast-pass/shared";
import { HttpError } from "../../middleware/error-handler.js";
import {
  organizationRepository,
  type OrganizationRecord,
} from "./organization.repository.js";

/**
 * Organization service.
 *
 * Trust boundary (spec Section 12): the client may only supply `name`.
 * Everything else (id, status, createdAt) is server-generated.
 * This is enforced here — not in the route, not in the repository.
 */
export const organizationService = {
  async create(input: unknown): Promise<OrganizationRecord> {
    // Validate + strip unknown fields via Zod.
    // If the client sends { name, id, status }, only `name` survives.
    const parsed: CreateOrganizationInput =
      CreateOrganizationInputSchema.parse(input);

    return organizationRepository.create(parsed.name);
  },

  async getById(id: string): Promise<OrganizationRecord> {
    const org = await organizationRepository.findById(id);
    if (!org) {
      throw new HttpError(404, "Organization not found", "ORGANIZATION_NOT_FOUND");
    }
    return org;
  },

  async list(limit: number, offset: number): Promise<OrganizationRecord[]> {
    return organizationRepository.list(limit, offset);
  },
};
