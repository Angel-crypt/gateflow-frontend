import { Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import "./tenant.css";

export default function TenantLayout({ onNewPass }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="tenant-layout">
      <header className="tenant-topbar">
        <div>
          <div className="tenant-topbar__title">Mis pases</div>
          <div className="tenant-topbar__sub">
            {user?.destinations?.[0]?.name ?? "—"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={handleLogout}
            style={{ background: "none", border: "none", cursor: "pointer" }}
            title="Cerrar sesión"
          >
            <LogOut size={18} color="#bae6fd" />
          </button>
        </div>
      </header>

      <main className="tenant-content">
        <Outlet />
      </main>
    </div>
  );
}
