import bcrypt from "bcrypt";
import { CreateDriverInputSchema } from "@fast-pass/shared";
import { HttpError } from "../../middleware/error-handler.js";
import { organizationRepository } from "../organizations/organization.repository.js";
import {
  driverRepository,
  type DriverRecord,
} from "./driver.repository.js";

export const driverService = {
  async create(organizationId: string, body: unknown): Promise<DriverRecord> {
    const org = await organizationRepository.findById(organizationId);
    if (!org) {
      throw new HttpError(404, "Organization not found", "ORGANIZATION_NOT_FOUND");
    }

    const parsed = CreateDriverInputSchema.parse(body);
    const passwordHash = await bcrypt.hash(parsed.password, 10);

    try {
      return await driverRepository.create(
        organizationId,
        parsed.name,
        parsed.phone,
        parsed.email.toLowerCase(),
        passwordHash,
      );
    } catch (err: unknown) {
      // Unique constraint on email
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code: string }).code === "23505"
      ) {
        throw new HttpError(409, "Email already registered", "EMAIL_IN_USE");
      }
      throw err;
    }
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
