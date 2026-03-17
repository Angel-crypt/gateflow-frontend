import { useEffect, useRef, useState } from "react";
import { KeyRound, Building2, ShieldCheck, ChevronDown } from "lucide-react";
import "./ProfileDropdown.css";

const ROLE_LABEL = { admin: "Administrador", guard: "Guardia", tenant: "Inquilino" };

function getInitials(firstName, lastName) {
  return ([firstName?.[0], lastName?.[0]].filter(Boolean).join("").toUpperCase()) || "?";
}

export function ProfileDropdown({ user, onChangePassword }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Cierra al hacer click fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Cierra con Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const initials = getInitials(user.first_name, user.last_name);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="profile-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="Perfil de usuario"
        aria-expanded={open}
      >
        <div className="profile-btn__avatar">{initials}</div>
        <ChevronDown size={14} style={{ transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>

      {open && (
        <div className="profile-dropdown">
          {/* Header */}
          <div className="profile-dropdown__header">
            <div className="profile-dropdown__avatar">{initials}</div>
            <div>
              <div className="profile-dropdown__name">
                {user.first_name} {user.last_name}
              </div>
              <div className="profile-dropdown__email">{user.email}</div>
            </div>
          </div>

          {/* Info */}
          <div className="profile-dropdown__body">
            <div className="profile-dropdown__info">
              <div className="profile-dropdown__row profile-dropdown__row--block">
                <span className="profile-dropdown__row-label">
                  <Building2 size={13} />
                  Parque
                </span>
                <span className="profile-dropdown__row-value">
                  {user.park?.name ?? "—"}
                </span>
              </div>
              <div className="profile-dropdown__row">
                <span className="profile-dropdown__row-label">
                  <ShieldCheck size={13} />
                  Rol
                </span>
                <span className="profile-dropdown__row-value">
                  {ROLE_LABEL[user.role] ?? user.role}
                </span>
              </div>
            </div>

            <div className="profile-dropdown__divider" />

            <button
              className="profile-dropdown__action"
              onClick={() => { setOpen(false); onChangePassword(); }}
            >
              <KeyRound size={15} color="var(--color-text-muted)" />
              Cambiar contraseña
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
