import { CreateGateInputSchema } from "@fast-pass/shared";
import { HttpError } from "../../middleware/error-handler.js";
import { gateRepository, type GateRecord } from "./gate.repository.js";

export const gateService = {
  async create(body: unknown): Promise<GateRecord> {
    const parsed = CreateGateInputSchema.parse(body);
    return gateRepository.create(parsed.name, parsed.location);
  },

  async getById(id: string): Promise<GateRecord> {
    const gate = await gateRepository.findById(id);
    if (!gate) {
      throw new HttpError(404, "Gate not found", "GATE_NOT_FOUND");
    }
    return gate;
  },

  async list(limit: number, offset: number): Promise<GateRecord[]> {
    return gateRepository.list(limit, offset);
  },
};
