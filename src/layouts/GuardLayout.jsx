import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import "./guard.css";

export default function GuardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="guard-layout">
      <header className="guard-topbar">
        <div>
          <div className="guard-topbar__title">GateFlow</div>
          <div className="guard-topbar__sub">
            Guardia · {user?.park?.name ?? "—"}
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{ background: "none", border: "none", cursor: "pointer" }}
          title="Cerrar sesión"
        >
          <LogOut size={18} color="#bae6fd" />
        </button>
      </header>

      <nav className="guard-tabs">
        <NavLink
          to="/guard"
          end
          className={({ isActive }) =>
            `guard-tab${isActive ? " active" : ""}`
          }
        >
          Accesos abiertos
        </NavLink>
        <NavLink
          to="/guard/validar"
          className={({ isActive }) =>
            `guard-tab${isActive ? " active" : ""}`
          }
        >
          Validar QR
        </NavLink>
        <NavLink
          to="/guard/manual"
          className={({ isActive }) =>
            `guard-tab${isActive ? " active" : ""}`
          }
        >
          Manual
        </NavLink>
      </nav>

      <main className="guard-content">
        <Outlet />
      </main>
    </div>
  );
}