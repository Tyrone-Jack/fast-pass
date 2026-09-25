import {
  CreateOrganizationInputSchema,
  type CreateOrganizationInput,
} from "@fast-pass/shared";
import { HttpError } from "../../middleware/error-handler.js";
import {
  organizationRepository,
  type OrganizationRecord,
} from "./organization.repository.js";

export const organizationService = {
  async create(input: unknown): Promise<OrganizationRecord> {
    const parsed: CreateOrganizationInput =
      CreateOrganizationInputSchema.parse(input);
    return organizationRepository.create(parsed.name, parsed.purpose);
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
