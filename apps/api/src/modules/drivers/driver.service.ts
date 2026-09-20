import { CreateDriverInputSchema } from "@fast-pass/shared";
import { HttpError } from "../../middleware/error-handler.js";
import { organizationRepository } from "../organizations/organization.repository.js";
import {
  driverRepository,
  type DriverRecord,
} from "./driver.repository.js";

export const driverService = {
  /**
   * Create a driver under an organization.
   * Trust boundary: organizationId comes from the caller (URL/query),
   * NOT from the request body. `name` and `phone` are the only body fields.
   */
  async create(
    organizationId: string,
    body: unknown,
  ): Promise<DriverRecord> {
    // 1. Verify the organization actually exists — this is the
    //    server-side check Section 12 requires.
    const org = await organizationRepository.findById(organizationId);
    if (!org) {
      throw new HttpError(
        404,
        "Organization not found",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    // 2. Validate + strip body fields.
    const parsed = CreateDriverInputSchema.parse(body);

    return driverRepository.create(organizationId, parsed.name, parsed.phone);
  },

  async getById(id: string): Promise<DriverRecord> {
    const driver = await driverRepository.findById(id);
    if (!driver) {
      throw new HttpError(404, "Driver not found", "DRIVER_NOT_FOUND");
    }
    return driver;
  },

  async listByOrganization(
    organizationId: string,
    limit: number,
    offset: number,
  ): Promise<DriverRecord[]> {
    return driverRepository.listByOrganization(organizationId, limit, offset);
  },
};
