import { useState } from "react";
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

  const statusStyle = isActive
    ? { background: "#dcfce7", color: "#16a34a" }
    : { background: "#f1f5f9", color: "#64748b" };

  const statusLabel = isActive ? "Activo" : "Inactivo";

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
        <div style={{ display: "flex", gap: "6px" }}>
          <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "999px", ...roleStyle }}>
            {roleLabel}
          </span>
          <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "999px", ...statusStyle }}>
            {statusLabel}
          </span>
        </div>
      </div>
      <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
        {user.park?.name ?? "—"}
      </div>
      <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
        <button
          onClick={() => onEdit(user)}
          style={{
            flex: 1, padding: "7px",
            background: "var(--color-surface)",
            color: "var(--color-text)",
            border: "0.5px solid var(--color-border)",
            borderRadius: "7px", fontSize: "12px",
            fontWeight: 500, cursor: "pointer",
          }}
        >
          Editar
        </button>
        <button
          onClick={() => onToggle(user)}
          style={{
            flex: 1, padding: "7px",
            background: isActive ? "#fef3c7" : "#dcfce7",
            color: isActive ? "#b45309" : "#16a34a",
            border: "none", borderRadius: "7px",
            fontSize: "12px", fontWeight: 500, cursor: "pointer",
          }}
        >
          {isActive ? "Desactivar" : "Activar"}
        </button>
      </div>
    </div>
  );
}

export default function UsuariosPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await getUsers();
      return res.data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (user) => toggleActiveUser(user.id, !user.is_active),
    onSuccess: () => queryClient.invalidateQueries(["users"]),
  });

  const filtered = data?.filter((u) =>
    roleFilter === "all" ? true : u.role === roleFilter
  ) ?? [];

  if (isLoading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text)" }}>
            Usuarios
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            {filtered.length} usuarios en total
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: "8px 14px",
            background: "#0369a1",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          + Nuevo usuario
        </button>
      </div>

      {/* Filtro de rol */}
      <div style={{ display: "flex", gap: "6px" }}>
        {["all", "guard", "tenant"].map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            style={{
              padding: "5px 12px",
              borderRadius: "999px",
              border: "0.5px solid var(--color-border)",
              fontSize: "11px",
              fontWeight: 500,
              cursor: "pointer",
              background: roleFilter === r ? "#0369a1" : "var(--color-surface)",
              color: roleFilter === r ? "#fff" : "var(--color-text-muted)",
            }}
          >
            {r === "all" ? "Todos" : r === "guard" ? "Guardias" : "Inquilinos"}
          </button>
        ))}
      </div>

      {!filtered.length && (
        <p style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", marginTop: "40px" }}>
          No hay usuarios registrados aún.
        </p>
      )}

      {filtered.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          onEdit={() => setSelectedUser(user)}
          onToggle={(u) => toggleMutation.mutate(u)}
        />
      ))}
    </div>
  );
}
