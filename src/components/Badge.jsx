import "./Badge.css";

/**
 * Badge — etiqueta de estado o rol.
 *
 * variant  "success" | "danger" | "warning" | "primary" | "neutral"
 *
 * Atajos de rol:
 *   <Badge role="admin" />   → primary
 *   <Badge role="guard" />   → warning
 *   <Badge role="tenant" />  → neutral
 *
 * Atajos de estado:
 *   <Badge active />   → success
 *   <Badge inactive /> → danger
 */

const ROLE_VARIANT = { admin: "primary", guard: "warning", tenant: "neutral" };
const ROLE_LABEL   = { admin: "Admin",   guard: "Guardia", tenant: "Inquilino" };

export function Badge({ children, variant, role, active, inactive }) {
  if (role) {
    return (
      <span className={`badge badge--${ROLE_VARIANT[role] ?? "neutral"}`}>
        {ROLE_LABEL[role] ?? role}
      </span>
    );
  }

  if (active)   return <span className="badge badge--success">Activo</span>;
  if (inactive) return <span className="badge badge--danger">Inactivo</span>;

  return <span className={`badge badge--${variant ?? "neutral"}`}>{children}</span>;
}
