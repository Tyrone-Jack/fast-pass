import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  api,
  ApiError,
  type Gate,
  type VerificationResult,
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

export default function GatePage() {
  const [gateId, setGateId] = useState("");
  const [requestId, setRequestId] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const gatesQuery = useQuery({
    queryKey: ["gates"],
    queryFn: () => api.gates.list(),
  });

  const scan = useMutation({
    mutationFn: () =>
      api.verification.scan({
        requestId: requestId.trim(),
        gateId,
      }),
    onSuccess: (data) => {
      setResult(data);
      setError(null);
    },
    onError: (err) => {
      setError(errorMessage(err));
      setResult(null);
    },
  });

  function reset() {
    setResult(null);
    setRequestId("");
    setError(null);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Gate</h1>

      <section className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Your gate
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

        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Scanned request ID
          </label>
          <input
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            placeholder="Paste scanned QR value"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-mono"
          />
        </div>

        <button
          onClick={() => scan.mutate()}
          disabled={scan.isPending || !gateId || !requestId.trim()}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {scan.isPending ? "Verifying..." : "Verify"}
        </button>

        {error && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
            {error}
          </div>
        )}
      </section>

      {result && result.result === "ALLOW" && (
        <section className="bg-green-50 border-2 border-green-500 rounded-lg p-6 text-center">
          <div className="text-4xl font-black text-green-700 mb-4">ALLOW</div>
          <div className="text-lg font-semibold text-slate-900">
            {result.driver.name}
          </div>
          <div className="text-slate-700">{result.organization.name}</div>
          <div className="text-slate-600 text-sm mt-2">
            Purpose: {result.purpose}
          </div>
          <div className="text-slate-500 text-xs mt-1">
            Gate: {result.gate.name}
          </div>
          <button
            onClick={reset}
            className="mt-4 text-sm text-green-800 hover:underline"
          >
            Next scan
          </button>
        </section>
      )}

      {result && result.result === "DENY" && (
        <section className="bg-red-50 border-2 border-red-500 rounded-lg p-6 text-center">
          <div className="text-4xl font-black text-red-700 mb-4">DENY</div>
          <div className="text-lg font-semibold text-slate-900">
            {result.reason.replace(/_/g, " ").toLowerCase()}
          </div>
          <div className="text-slate-600 text-xs mt-2 font-mono">
            {result.reason}
          </div>
          <button
            onClick={reset}
            className="mt-4 text-sm text-red-800 hover:underline"
          >
            Next scan
          </button>
        </section>
      )}
    </div>
  );
}
