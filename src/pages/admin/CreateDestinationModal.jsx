import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDestination } from "../../api/destinations.api";
import { getUsers } from "../../api/users.api";

export default function CreateDestinationModal({ onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    type: "company",
    responsible: "",
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await getUsers();
      return res.data.results ?? res.data;
    },
  });

  const tenants = users.filter((u) => u.role === "tenant");

  const mutation = useMutation({
    mutationFn: () => createDestination({
      ...form,
      responsible: form.responsible || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(["destinations"]);
      onClose();
    },
  });

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const isValid = form.name && form.type;

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
          Nuevo destino
        </div>

        {/* Nombre */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>
            Nombre
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Ej. Empresa ABC"
            style={{
              padding: "9px 10px", border: "0.5px solid var(--color-border)",
              borderRadius: "7px", fontSize: "13px",
              background: "var(--color-surface)", color: "var(--color-text)",
            }}
          />
        </div>

        {/* Tipo */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>
            Tipo
          </label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            style={{
              padding: "9px 10px", border: "0.5px solid var(--color-border)",
              borderRadius: "7px", fontSize: "13px",
              background: "var(--color-surface)", color: "var(--color-text)",
            }}
          >
            <option value="company">Empresa</option>
            <option value="area">Área</option>
          </select>
        </div>

        {/* Responsable */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>
            Responsable (opcional)
          </label>
          <select
            name="responsible"
            value={form.responsible}
            onChange={handleChange}
            style={{
              padding: "9px 10px", border: "0.5px solid var(--color-border)",
              borderRadius: "7px", fontSize: "13px",
              background: "var(--color-surface)", color: "var(--color-text)",
            }}
          >
            <option value="">Sin responsable</option>
            {tenants.map((u) => (
              <option key={u.id} value={u.id}>
                {u.first_name} {u.last_name} — {u.email}
              </option>
            ))}
          </select>
        </div>

        {/* Error */}
        {mutation.isError && (
          <div style={{ fontSize: "12px", color: "#dc2626" }}>
            {mutation.error?.response?.data?.detail ?? "Error al crear el destino."}
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
            {mutation.isPending ? "Creando..." : "Crear destino"}
          </button>
        </div>
      </div>
    </div>
  );
}
