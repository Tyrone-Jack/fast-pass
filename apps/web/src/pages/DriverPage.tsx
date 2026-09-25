import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { api, ApiError, type VerificationResult } from "../lib/api";
import { useAuth } from "../lib/auth";

const SCANNER_ID = "fastpass-scanner";

export default function DriverPage() {
  const { driver, logout } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [token, setToken] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(true);

  async function safeStop() {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      if (scanner.getState() === 2) {
        await scanner.stop();
      }
    } catch {
      // already stopped or transitioning — ignore
    }
    try {
      scanner.clear();
    } catch {
      // container not ready — ignore
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      void safeStop();
    };
  }, []);

  async function verify(gateToken: string) {
    if (!gateToken.trim()) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.verification.scanGate(gateToken.trim());
      if (mountedRef.current) setResult(res);
    } catch (err) {
      if (!mountedRef.current) return;
      if (err instanceof ApiError) {
        setError(err.code);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Verification failed");
      }
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }

  async function startScan() {
    setError(null);
    setResult(null);
    setScanning(true);
    await new Promise((r) => setTimeout(r, 100));
    if (!mountedRef.current) return;
    try {
      const scanner = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          let extracted = decodedText.trim();
          const m = extracted.match(/^fastpass:\/\/gate\/(.+)$/);
          if (m && m[1]) extracted = m[1];
          await safeStop();
          if (mountedRef.current) setScanning(false);
          await verify(extracted);
        },
        () => {
          // silent decode failure
        },
      );
    } catch (err) {
      if (!mountedRef.current) return;
      setScanning(false);
      setError(
        "Camera unavailable: " +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  }

  async function stopScan() {
    await safeStop();
    if (mountedRef.current) setScanning(false);
  }

  function reset() {
    setResult(null);
    setError(null);
    setToken("");
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Hi, {driver?.name}
          </h1>
          <p className="text-sm text-slate-500">{driver?.email}</p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          Sign out
        </button>
      </div>

      {!result && !error && (
        <section className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Scan the QR code at the gate
          </h2>

          <div
            id={SCANNER_ID}
            className={`w-full max-w-sm mx-auto ${scanning ? "" : "hidden"}`}
          />

          {!scanning && (
            <button
              onClick={startScan}
              disabled={busy}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Open camera
            </button>
          )}

          {scanning && (
            <button
              onClick={stopScan}
              className="w-full border border-slate-300 px-4 py-2 rounded-md text-sm"
            >
              Cancel
            </button>
          )}

          <div className="border-t border-slate-200 pt-4">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Or paste the gate token manually
            </label>
            <div className="flex gap-2">
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="gate token"
                className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm font-mono"
              />
              <button
                onClick={() => verify(token)}
                disabled={busy || !token.trim()}
                className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                Verify
              </button>
            </div>
          </div>
        </section>
      )}

      {result?.result === "ALLOW" && (
        <section className="bg-green-50 border-2 border-green-500 rounded-lg p-6 text-center">
          <div className="text-5xl font-black text-green-700 mb-4">ALLOW</div>
          <div className="text-xl font-semibold text-slate-900">
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
            className="mt-6 bg-green-700 text-white px-6 py-2 rounded-md font-medium hover:bg-green-800"
          >
            Done
          </button>
        </section>
      )}

      {result?.result === "DENY" && (
        <section className="bg-red-50 border-2 border-red-500 rounded-lg p-6 text-center">
          <div className="text-5xl font-black text-red-700 mb-4">DENY</div>
          <div className="text-lg font-semibold text-slate-900">
            {result.reason.replace(/_/g, " ").toLowerCase()}
          </div>
          <div className="text-slate-500 text-xs mt-2 font-mono">
            {result.reason}
          </div>
          <button
            onClick={reset}
            className="mt-6 bg-red-700 text-white px-6 py-2 rounded-md font-medium hover:bg-red-800"
          >
            Try again
          </button>
        </section>
      )}

      {error && !result && (
        <button
          onClick={reset}
          className="w-full bg-slate-200 text-slate-800 px-4 py-2 rounded-md font-medium"
        >
          Try again
        </button>
      )}
    </div>
  );
}
