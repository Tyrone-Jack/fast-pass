/**
 * FastPass API client.
 * All HTTP calls go through `apiFetch`, which handles:
 *   - JSON encoding/decoding
 *   - Error responses (throws ApiError with parsed body)
 *   - Consistent base URL
 */

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

async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
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

// --- Types (matching shared schema output) -------------------------------
export type Organization = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
};

export type Driver = {
  id: string;
  organizationId: string;
  name: string;
  phone: string;
  status: string;
  createdAt: string;
};

export type Gate = {
  id: string;
  name: string;
  location: string;
  status: string;
  createdAt: string;
};

export type AccessRequest = {
  id: string;
  driverId: string;
  organizationId: string;
  gateId: string;
  purpose: string;
  status: string;
  expiresAt: string;
  createdAt: string;
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
  | {
      result: "DENY";
      reason: string;
      verifiedAt: string;
    };

// --- Endpoints -----------------------------------------------------------
export const api = {
  organizations: {
    list: () =>
      apiFetch<{ data: Organization[] }>("/organizations"),
    create: (name: string) =>
      apiFetch<Organization>("/organizations", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    get: (id: string) =>
      apiFetch<Organization>(`/organizations/${id}`),
  },

  drivers: {
    listByOrg: (organizationId: string) =>
      apiFetch<{ data: Driver[] }>(
        `/organizations/${organizationId}/drivers`,
      ),
    create: (
      organizationId: string,
      input: { name: string; phone: string },
    ) =>
      apiFetch<Driver>(
        `/organizations/${organizationId}/drivers`,
        {
          method: "POST",
          body: JSON.stringify(input),
        },
      ),
  },

  gates: {
    list: () => apiFetch<{ data: Gate[] }>("/gates"),
    create: (input: { name: string; location: string }) =>
      apiFetch<Gate>("/gates", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  },

  accessRequests: {
    create: (input: {
      driverId: string;
      gateId: string;
      purpose: string;
    }) =>
      apiFetch<AccessRequest>("/access-requests", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    get: (id: string) =>
      apiFetch<AccessRequest>(`/access-requests/${id}`),
  },

  verification: {
    scan: (input: { requestId: string; gateId: string }) =>
      apiFetch<VerificationResult>("/verification/scan", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  },
};
