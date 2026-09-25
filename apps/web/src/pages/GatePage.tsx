import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type Gate } from "../lib/api";

export default function GatePage() {
  const [gateId, setGateId] = useState("");

  const gatesQuery = useQuery({
    queryKey: ["gates"],
    queryFn: () => api.gates.list(),
  });

  const selected = gatesQuery.data?.data.find((g: Gate) => g.id === gateId);

  function downloadPdf() {
    if (!selected) return;
    window.open(`/api/v1/reports/gate/${selected.id}.pdf`, "_blank");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Gate dashboard</h1>

      <section className="bg-white rounded-lg border border-slate-200 p-6">
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Select your gate
        </label>
        <select
          value={gateId}
          onChange={(e) => setGateId(e.target.value)}
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="">-- Select a gate --</option>
          {gatesQuery.data?.data.map((g: Gate) => (
            <option key={g.id} value={g.id}>
              {g.name} — {g.location}
            </option>
          ))}
        </select>
      </section>

      {selected && (
        <>
          <section className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              {selected.name}
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              {selected.location}
            </p>

            <div className="mb-4">
              <div className="text-xs text-slate-500 mb-1">Gate token</div>
              <div className="text-xs font-mono bg-slate-50 border border-slate-200 rounded p-2 break-all">
                {selected.qrToken}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-xs text-slate-500 mb-2">
                Printable QR (mount at the physical gate)
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded p-4 flex justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    `fastpass://gate/${selected.qrToken}`,
                  )}`}
                  alt="Gate QR code"
                  width={200}
                  height={200}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">
                Print and mount at the gate entrance
              </p>
            </div>

            <button
              onClick={downloadPdf}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Download access log PDF
            </button>
          </section>
        </>
      )}
    </div>
  );
}
