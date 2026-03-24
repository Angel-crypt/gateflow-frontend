import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser } from "../../api/users.api";

export default function EditUserModal({ user, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    email: user.email ?? "",
    role: user.role ?? "guard",
  });

  const mutation = useMutation({
    mutationFn: () => updateUser(user.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      onClose();
    },
  });

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const isValid = form.first_name && form.last_name && form.email;

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "flex-end",
        justifyContent: "center", zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "16px 16px 0 0",
          padding: "16px",
          width: "100%",
          maxWidth: "480px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ width: "32px", height: "3px", background: "var(--color-border)", borderRadius: "2px", margin: "0 auto" }} />

        <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text)" }}>
          Editar usuario
        </div>

        {/* Nombre */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Nombre
            </label>
            <input
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              style={{
                padding: "9px 10px", border: "0.5px solid var(--color-border)",
                borderRadius: "7px", fontSize: "13px",
                background: "var(--color-surface)", color: "var(--color-text)",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Apellido
            </label>
            <input
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              style={{
                padding: "9px 10px", border: "0.5px solid var(--color-border)",
                borderRadius: "7px", fontSize: "13px",
                background: "var(--color-surface)", color: "var(--color-text)",
              }}
            />
          </div>
        </div>

        {/* Email */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>
            Correo electrónico
          </label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            style={{
              padding: "9px 10px", border: "0.5px solid var(--color-border)",
              borderRadius: "7px", fontSize: "13px",
              background: "var(--color-surface)", color: "var(--color-text)",
            }}
          />
        </div>

        {/* Rol */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>
            Rol
          </label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            style={{
              padding: "9px 10px", border: "0.5px solid var(--color-border)",
              borderRadius: "7px", fontSize: "13px",
              background: "var(--color-surface)", color: "var(--color-text)",
            }}
          >
            <option value="guard">Guardia</option>
            <option value="tenant">Inquilino</option>
          </select>
        </div>

        {/* Error */}
        {mutation.isError && (
          <div style={{ fontSize: "12px", color: "#dc2626" }}>
            {mutation.error?.response?.data?.detail ?? "Error al actualizar el usuario."}
          </div>
        )}

        {/* Botones */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "11px",
              background: "var(--color-surface)",
              color: "var(--color-text-muted)",
              border: "0.5px solid var(--color-border)",
              borderRadius: "8px", fontSize: "13px", cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!isValid || mutation.isPending}
            style={{
              flex: 1, padding: "11px",
              background: isValid ? "#0369a1" : "var(--color-border)",
              color: "#fff", border: "none",
              borderRadius: "8px", fontSize: "13px",
              fontWeight: 500, cursor: isValid ? "pointer" : "not-allowed",
            }}
          >
            {mutation.isPending ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
