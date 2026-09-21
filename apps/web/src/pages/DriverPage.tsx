import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import {
  api,
  ApiError,
  type AccessRequest,
  type Driver,
  type Gate,
} from "../lib/api";

function errorMessage(err: unknown): string {
  if (err instanceof ApiError && err.details) {
    return Object.entries(err.details)
      .map(([f, m]) => `${f}: ${m.join(", ")}`)
      .join(" | ");
  }
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

export default function DriverPage() {
  const [driverId, setDriverId] = useState("");
  const [gateId, setGateId] = useState("");
  const [purpose, setPurpose] = useState("Package delivery");
  const [request, setRequest] = useState<AccessRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  const gatesQuery = useQuery({
    queryKey: ["gates"],
    queryFn: () => api.gates.list(),
  });

  // We need all drivers across all orgs. Simplest way for MVP:
  // fetch orgs, then fetch drivers for the first real org.
  // (A proper "list all drivers" endpoint can come later.)
  const orgsQuery = useQuery({
    queryKey: ["organizations"],
    queryFn: () => api.organizations.list(),
  });

  const realOrgId =
    orgsQuery.data?.data.find((o) => o.name !== "__SYSTEM__")?.id ?? "";

  const driversQuery = useQuery({
    queryKey: ["drivers", realOrgId],
    queryFn: () => api.drivers.listByOrg(realOrgId),
    enabled: !!realOrgId,
  });

  const create = useMutation({
    mutationFn: () =>
      api.accessRequests.create({
        driverId,
        gateId,
        purpose: purpose.trim(),
      }),
    onSuccess: (data) => {
      setRequest(data);
      setError(null);
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const expiresIn = request
    ? Math.max(
        0,
        Math.floor(
          (new Date(request.expiresAt).getTime() - Date.now()) / 1000,
        ),
      )
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Driver</h1>

      {!request && (
        <section className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold mb-4">
            Create access request
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Driver
              </label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">-- Select driver --</option>
                {driversQuery.data?.data.map((d: Driver) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Gate
              </label>
              <select
                value={gateId}
                onChange={(e) => setGateId(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">-- Select gate --</option>
                {gatesQuery.data?.data.map((g: Gate) => (
                  <option key={g.id} value={g.id}>
                    {g.name} — {g.location}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Purpose
              </label>
              <input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <button
              onClick={() => create.mutate()}
              disabled={create.isPending || !driverId || !gateId || !purpose.trim()}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {create.isPending ? "Creating..." : "Generate QR"}
            </button>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                {error}
              </div>
            )}
          </div>
        </section>
      )}

      {request && (
        <section className="bg-white rounded-lg border border-slate-200 p-6 text-center">
          <h2 className="text-lg font-semibold mb-2">Present this QR</h2>
          <p className="text-sm text-slate-600 mb-1">
            Show to the gate operator.
          </p>
          <p className="text-xs text-slate-500 mb-4">
            Expires in {expiresIn}s — status {request.status}
          </p>

          <div className="inline-block p-4 bg-white border border-slate-200 rounded-lg">
            <QRCodeSVG value={request.id} size={220} />
          </div>

          <div className="mt-4 text-xs text-slate-500 font-mono break-all">
            {request.id}
          </div>

          <button
            onClick={() => setRequest(null)}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            Create another request
          </button>
        </section>
      )}
    </div>
  );
}
