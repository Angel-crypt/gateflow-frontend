import { useState } from "react";
import "./admin.css";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Building2, Ticket, Activity,
  LogOut, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { ProfileDropdown } from "../components/ProfileDropdown";
import { ChangePasswordModal } from "../components/ChangePasswordModal";

// Solo rutas que el admin puede ver, verificadas contra la API
const NAV_SECTIONS = [
  {
    label: "Visión general",
    items: [
      { to: "/admin",          icon: LayoutDashboard, label: "Dashboard", end: true },
    ],
  },
  {
    label: "Gestión",
    items: [
      { to: "/admin/usuarios", icon: Users,     label: "Usuarios" },
      { to: "/admin/destinos", icon: Building2, label: "Destinos" },
      { to: "/admin/pases",    icon: Ticket,    label: "Pases" },
      { to: "/admin/accesos",  icon: Activity,  label: "Accesos" },
    ],
  },
];

function getInitials(firstName, lastName) {
  return ([firstName?.[0], lastName?.[0]].filter(Boolean).join("").toUpperCase()) || "?";
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const initials = getInitials(user.first_name, user.last_name);

  return (
    <div className={`admin-layout${collapsed ? " sidebar-collapsed" : ""}`}>
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Brand + toggle */}
        <div className="sidebar__brand">
          {!collapsed && (
            <div className="sidebar__brand-text">
              <div className="sidebar__brand-name">GateFlow</div>
              <div className="sidebar__brand-sub">Panel Administrador</div>
            </div>
          )}
          <button
            className="sidebar__collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            title={collapsed ? "Expandir" : "Colapsar"}
          >
            {collapsed
              ? <ChevronRight size={15} strokeWidth={2} />
              : <ChevronLeft size={15} strokeWidth={2} />
            }
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar__nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="sidebar__section">
              {!collapsed && (
                <span className="sidebar__nav-label">{section.label}</span>
              )}
              {section.items.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `sidebar__link${isActive ? " active" : ""}`
                  }
                  title={collapsed ? label : undefined}
                >
                  <Icon size={16} className="sidebar__link-icon" strokeWidth={2} />
                  {!collapsed && <span className="sidebar__link-label">{label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User info */}
        <div className="sidebar__user" title={collapsed ? `${user.first_name} ${user.last_name}` : undefined}>
          <div className="sidebar__avatar">{initials}</div>
          {!collapsed && (
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="sidebar__user-name">
                {user.first_name} {user.last_name}
              </div>
              <div className="sidebar__user-role">{user.park?.name ?? "—"}</div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          className="sidebar__logout"
          onClick={handleLogout}
          title="Cerrar sesión"
        >
          <LogOut size={16} strokeWidth={2} />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </aside>

      {/* ── Main ── */}
      <div className="admin-main">
        {/* Navbar */}
        <header className="navbar">
          <span className="navbar__title">{user.park?.name ?? "GateFlow"}</span>
          <div className="navbar__actions">
            <ProfileDropdown
              user={user}
              onChangePassword={() => setShowChangePassword(true)}
            />
          </div>
        </header>

        {/* Contenido */}
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
