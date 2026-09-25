import bcrypt from "bcrypt";
import { LoginInputSchema } from "@fast-pass/shared";
import { HttpError } from "../../middleware/error-handler.js";
import { authRepository } from "./auth.repository.js";
import { driverRepository } from "../drivers/driver.repository.js";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type CurrentDriver = {
  id: string;
  name: string;
  email: string;
  organizationId: string;
};

export const authService = {
  async login(body: unknown): Promise<{
    sessionId: string;
    expiresAt: Date;
  }> {
    const parsed = LoginInputSchema.parse(body);

    const driver = await authRepository.findDriverByEmail(parsed.email);
    if (!driver) {
      throw new HttpError(401, "Invalid credentials", "INVALID_CREDENTIALS");
    }

    const ok = await bcrypt.compare(parsed.password, driver.passwordHash);
    if (!ok) {
      throw new HttpError(401, "Invalid credentials", "INVALID_CREDENTIALS");
    }

    if (driver.status !== "ACTIVE") {
      throw new HttpError(403, "Driver is not active", "DRIVER_INACTIVE");
    }

    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const sessionId = await authRepository.createSession(driver.id, expiresAt);
    return { sessionId, expiresAt };
  },

  async logout(sessionId: string | undefined): Promise<void> {
    if (!sessionId) return;
    await authRepository.deleteSession(sessionId);
  },

  async currentDriver(
    sessionId: string | undefined,
  ): Promise<CurrentDriver> {
    if (!sessionId) {
      throw new HttpError(401, "Not authenticated", "UNAUTHENTICATED");
    }
    const session = await authRepository.findSession(sessionId);
    if (!session || session.expiresAt < new Date()) {
      throw new HttpError(401, "Session expired", "SESSION_EXPIRED");
    }
    const driver = await driverRepository.findById(session.driverId);
    if (!driver) {
      throw new HttpError(401, "Driver no longer exists", "UNAUTHENTICATED");
    }
    if (driver.status !== "ACTIVE") {
      throw new HttpError(403, "Driver is not active", "DRIVER_INACTIVE");
    }
    return {
      id: driver.id,
      name: driver.name,
      email: driver.email,
      organizationId: driver.organizationId,
    };
  },
};
