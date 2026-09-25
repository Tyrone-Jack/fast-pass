import { z } from "zod";

export const LoginInputSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const ScanGateInputSchema = z.object({
  gateToken: z.string().min(1).max(200),
});
export type ScanGateInput = z.infer<typeof ScanGateInputSchema>;
