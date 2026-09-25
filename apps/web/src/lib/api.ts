const BASE = "/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public details?: Record<string, string[]>,
  ) {
    super(code);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(
      res.status,
      body?.error ?? "UNKNOWN_ERROR",
      body?.details,
    );
  }

  return body as T;
}

// --- Types ---------------------------------------------------------------
export type Organization = {
  id: string;
  name: string;
  purpose: string;
  status: string;
  createdAt: string;
};

export type Driver = {
  id: string;
  organizationId: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  createdAt: string;
};

export type Gate = {
  id: string;
  name: string;
  location: string;
  qrToken: string;
  status: string;
  createdAt: string;
};

export type CurrentDriver = {
  id: string;
  name: string;
  email: string;
  organizationId: string;
};

export type VerificationResult =
  | {
      result: "ALLOW";
      driver: { id: string; name: string };
      organization: { id: string; name: string };
      gate: { id: string; name: string };
      purpose: string;
      verifiedAt: string;
    }
  | { result: "DENY"; reason: string; verifiedAt: string };

// --- Endpoints ------------------------------------------------------------
export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiFetch<{ ok: true }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    logout: () =>
      apiFetch<{ ok: true }>("/auth/logout", { method: "POST" }),
    me: () => apiFetch<CurrentDriver>("/auth/me"),
  },

  organizations: {
    list: () => apiFetch<{ data: Organization[] }>("/organizations"),
    create: (name: string, purpose: string) =>
      apiFetch<Organization>("/organizations", {
        method: "POST",
        body: JSON.stringify({ name, purpose }),
      }),
  },

  drivers: {
    listByOrg: (organizationId: string) =>
      apiFetch<{ data: Driver[] }>(
        `/organizations/${organizationId}/drivers`,
      ),
    create: (
      organizationId: string,
      input: {
        name: string;
        phone: string;
        email: string;
        password: string;
      },
    ) =>
      apiFetch<Driver>(`/organizations/${organizationId}/drivers`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
  },

  gates: {
    list: () => apiFetch<{ data: Gate[] }>("/gates"),
    create: (input: { name: string; location: string }) =>
      apiFetch<Gate>("/gates", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    get: (id: string) => apiFetch<Gate>(`/gates/${id}`),
  },

  verification: {
    scanGate: (gateToken: string) =>
      apiFetch<VerificationResult>("/verification/scan-gate", {
        method: "POST",
        body: JSON.stringify({ gateToken }),
      }),
  },
};
