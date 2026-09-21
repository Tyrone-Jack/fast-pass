import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  api,
  ApiError,
  type Organization,
  type Driver,
  type Gate,
} from "../lib/api";

// --- helpers ---------------------------------------------------------------
function errorMessage(err: unknown): string {
  if (err instanceof ApiError && err.details) {
    return Object.entries(err.details)
      .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
      .join(" | ");
  }
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "ACTIVE"
      ? "bg-green-100 text-green-700"
      : status === "SUSPENDED"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-slate-100 text-slate-600";
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${cls}`}>
      {status}
    </span>
  );
}

// --- Organizations ---------------------------------------------------------
function OrganizationsSection() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const orgsQuery = useQuery({
    queryKey: ["organizations"],
    queryFn: () => api.organizations.list(),
  });

  const create = useMutation({
    mutationFn: (n: string) => api.organizations.create(n),
    onSuccess: () => {
      setName("");
      setError(null);
      qc.invalidateQueries({ queryKey: ["organizations"] });
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const realOrgs =
    orgsQuery.data?.data.filter((o) => o.name !== "__SYSTEM__") ?? [];

  return (
    <section className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        Organizations
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) create.mutate(name.trim());
        }}
        className="flex gap-2 mb-4"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Organization name"
          className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={create.isPending || !name.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {create.isPending ? "Creating..." : "Create"}
        </button>
      </form>

      {error && (
        <div className="text-sm text-red-600 mb-3 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}

      <ul className="divide-y divide-slate-100">
        {realOrgs.map((org) => (
          <li key={org.id} className="py-2 flex justify-between items-center">
            <div>
              <div className="font-medium text-slate-900">{org.name}</div>
              <div className="text-xs text-slate-500 font-mono">{org.id}</div>
            </div>
            <StatusBadge status={org.status} />
          </li>
        ))}
        {realOrgs.length === 0 && !orgsQuery.isLoading && (
          <li className="text-sm text-slate-500 py-2">
            No organizations yet. Create one above.
          </li>
        )}
      </ul>
    </section>
  );
}

// --- Drivers ---------------------------------------------------------------
function DriversSection() {
  const qc = useQueryClient();
  const orgsQuery = useQuery({
    queryKey: ["organizations"],
    queryFn: () => api.organizations.list(),
  });
  const realOrgs =
    orgsQuery.data?.data.filter((o) => o.name !== "__SYSTEM__") ?? [];

  const [orgId, setOrgId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const driversQuery = useQuery({
    queryKey: ["drivers", orgId],
    queryFn: () => api.drivers.listByOrg(orgId),
    enabled: !!orgId,
  });

  const create = useMutation({
    mutationFn: () =>
      api.drivers.create(orgId, { name: name.trim(), phone: phone.trim() }),
    onSuccess: () => {
      setName("");
      setPhone("");
      setError(null);
      qc.invalidateQueries({ queryKey: ["drivers", orgId] });
    },
    onError: (err) => setError(errorMessage(err)),
  });

  return (
    <section className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Drivers</h2>

      <div className="mb-4">
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Organization
        </label>
        <select
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="">-- Select an organization --</option>
          {realOrgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      {orgId && (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim() && phone.trim()) create.mutate();
            }}
            className="flex gap-2 mb-4"
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Driver name"
              className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
              className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={create.isPending || !name.trim() || !phone.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {create.isPending ? "Creating..." : "Add"}
            </button>
          </form>

          {error && (
            <div className="text-sm text-red-600 mb-3 bg-red-50 border border-red-200 rounded-md p-2">
              {error}
            </div>
          )}

          <ul className="divide-y divide-slate-100">
            {driversQuery.data?.data.map((d: Driver) => (
              <li
                key={d.id}
                className="py-2 flex justify-between items-center"
              >
                <div>
                  <div className="font-medium text-slate-900">{d.name}</div>
                  <div className="text-xs text-slate-500">{d.phone}</div>
                </div>
                <StatusBadge status={d.status} />
              </li>
            ))}
            {driversQuery.data?.data.length === 0 && (
              <li className="text-sm text-slate-500 py-2">
                No drivers in this organization yet.
              </li>
            )}
          </ul>
        </>
      )}
    </section>
  );
}

// --- Gates -----------------------------------------------------------------
function GatesSection() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);

  const gatesQuery = useQuery({
    queryKey: ["gates"],
    queryFn: () => api.gates.list(),
  });

  const create = useMutation({
    mutationFn: () =>
      api.gates.create({ name: name.trim(), location: location.trim() }),
    onSuccess: () => {
      setName("");
      setLocation("");
      setError(null);
      qc.invalidateQueries({ queryKey: ["gates"] });
    },
    onError: (err) => setError(errorMessage(err)),
  });

  return (
    <section className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Gates</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim() && location.trim()) create.mutate();
        }}
        className="flex gap-2 mb-4"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Gate name"
          className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm"
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={create.isPending || !name.trim() || !location.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {create.isPending ? "Creating..." : "Add"}
        </button>
      </form>

      {error && (
        <div className="text-sm text-red-600 mb-3 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}

      <ul className="divide-y divide-slate-100">
        {gatesQuery.data?.data.map((g: Gate) => (
          <li key={g.id} className="py-2 flex justify-between items-center">
            <div>
              <div className="font-medium text-slate-900">{g.name}</div>
              <div className="text-xs text-slate-500">{g.location}</div>
            </div>
            <StatusBadge status={g.status} />
          </li>
        ))}
        {gatesQuery.data?.data.length === 0 && (
          <li className="text-sm text-slate-500 py-2">
            No gates yet. Create one above.
          </li>
        )}
      </ul>
    </section>
  );
}

// --- Root ------------------------------------------------------------------
export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Admin</h1>
      <OrganizationsSection />
      <DriversSection />
      <GatesSection />
    </div>
  );
}
