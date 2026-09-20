import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import AdminPage from "./pages/AdminPage";
import DriverPage from "./pages/DriverPage";
import GatePage from "./pages/GatePage";

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { pathname } = useLocation();
  const active = pathname.startsWith(to);
  return (
    <Link
      to={to}
      className={`px-4 py-2 rounded-md text-sm font-medium transition ${
        active
          ? "bg-blue-600 text-white"
          : "text-slate-700 hover:bg-slate-200"
      }`}
    >
      {children}
    </Link>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2">
          <span className="font-bold text-lg text-slate-900 mr-4">
            FastPass
          </span>
          <NavLink to="/admin">Admin</NavLink>
          <NavLink to="/driver">Driver</NavLink>
          <NavLink to="/gate">Gate</NavLink>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/driver" element={<DriverPage />} />
          <Route path="/gate" element={<GatePage />} />
        </Routes>
      </main>
    </div>
  );
}
