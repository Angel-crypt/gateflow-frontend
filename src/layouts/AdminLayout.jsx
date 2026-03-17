import { useState } from "react";
import "./admin.css";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { Button } from "../components/Button";
import { ChangePasswordModal } from "../components/ChangePasswordModal";

const NAV_ITEMS = [
  { to: "/admin",          icon: "▦",  label: "Dashboard",  end: true },
  { to: "/admin/usuarios", icon: "👥", label: "Usuarios" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();

  return (
    <div className="admin-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="sidebar__brand-name">GateFlow</div>
          <div className="sidebar__brand-sub">Panel Administrador</div>
        </div>

        <nav className="sidebar__nav">
          <span className="sidebar__nav-label">Menú</span>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar__link${isActive ? " active" : ""}`
              }
            >
              <span className="sidebar__link-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__user">
          <div className="sidebar__avatar">{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div className="sidebar__user-name">
              {user.first_name} {user.last_name}
            </div>
            <div className="sidebar__user-role">{user.park?.name ?? "—"}</div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="admin-main">
        {/* Navbar */}
        <header className="navbar">
          <span className="navbar__title">{user.park?.name ?? "GateFlow"}</span>
          <div className="navbar__actions">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowChangePassword(true)}
            >
              Cambiar contraseña
            </Button>
            <Button variant="danger" size="sm" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </div>
        </header>

        {/* Contenido de la página */}
        <main className="admin-content">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="admin-footer">
          <span className="admin-footer__text">GateFlow — Gestión de Accesos</span>
          <span className="admin-footer__text">
            {user.first_name} {user.last_name} · Admin
          </span>
        </footer>
      </div>

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
}
