import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, toggleActiveUser, deleteUser } from "../../api/users.api";
import { Spinner } from "../../components/Spinner";

function UserCard({ user, onEdit, onToggle, onDelete }) {
  const isActive = user.is_active;

  const roleStyle =
    user.role === "guard"
      ? { background: "#e0f2fe", color: "#0369a1" }
      : { background: "#fef3c7", color: "#b45309" };

  const roleLabel = user.role === "guard" ? "Guardia" : "Inquilino";

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "0.5px solid var(--color-border)",
        borderRadius: "10px",
        padding: "12px 14px",
        opacity: isActive ? 1 : 0.6,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text)" }}>
            {user.first_name} {user.last_name}
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            {user.email}
          </div>
        </div>
        <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "999px", ...roleStyle }}>
          {roleLabel}
        </span>
      </div>
    </div>
  );
}

export default function UsuariosPage() {
  return null;
}
