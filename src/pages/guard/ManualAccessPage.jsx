import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAccessLog } from "../../api/access.api";
import apiClient from "../../api/apiClient";

function useDestinations() {
  return useQuery({
    queryKey: ["destinations"],
    queryFn: async () => {
      const res = await apiClient.get("/destinations/");
      return res.data;
    },
  });
}

export default function ManualAccessPage() {
  const queryClient = useQueryClient();
  const { data: destinations = [] } = useDestinations();
  const [form, setForm] = useState({
    visitor_name: "",
    plate: "",
    destination: "",
    notes: "",
  });
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () => createAccessLog(form),
    onSuccess: () => {
      setSuccess(true);
      setForm({ visitor_name: "", plate: "", destination: "", notes: "" });
      queryClient.invalidateQueries(["access-logs"]);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const isValid = form.visitor_name && form.plate && form.destination;

  return (
    <>
      {success && (
        <div
          style={{
            background: "#f0fdf4",
            border: "0.5px solid #bbf7d0",
            borderRadius: "10px",
            padding: "12px 14px",
            fontSize: "13px",
            color: "#15803d",
            fontWeight: 500,
          }}
        >
          Acceso registrado correctamente.
        </div>
      )}

      <div
        style={{
          background: "var(--color-surface)",
          border: "0.5px solid var(--color-border)",
          borderRadius: "12px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {/* Visitante */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>
            Nombre del visitante
          </label>
          <input
            name="visitor_name"
            value={form.visitor_name}
            onChange={handleChange}
            placeholder="Ej. Juan García"
            style={{
              padding: "9px 10px",
              border: "0.5px solid var(--color-border)",
              borderRadius: "7px",
              fontSize: "13px",
              background: "var(--color-surface)",
              color: "var(--color-text)",
            }}
          />
        </div>

        {/* Placa */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>
            Placa del vehículo
          </label>
          <input
            name="plate"
            value={form.plate}
            onChange={handleChange}
            placeholder="ABC-123"
            style={{
              padding: "9px 10px",
              border: "0.5px solid var(--color-border)",
              borderRadius: "7px",
              fontSize: "13px",
              fontFamily: "monospace",
              letterSpacing: "1px",
              background: "var(--color-surface)",
              color: "var(--color-text)",
            }}
          />
        </div>

        {/* Destino */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>
            Destino
          </label>
          <select
            name="destination"
            value={form.destination}
            onChange={handleChange}
            style={{
              padding: "9px 10px",
              border: "0.5px solid var(--color-border)",
              borderRadius: "7px",
              fontSize: "13px",
              background: "var(--color-surface)",
              color: "var(--color-text)",
            }}
          >
            <option value="">Seleccionar destino...</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Notas */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>
            Notas (opcional)
          </label>
          <input
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Motivo de visita..."
            style={{
              padding: "9px 10px",
              border: "0.5px solid var(--color-border)",
              borderRadius: "7px",
              fontSize: "13px",
              background: "var(--color-surface)",
              color: "var(--color-text)",
            }}
          />
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={!isValid || mutation.isPending}
          style={{
            width: "100%",
            padding: "12px",
            background: isValid ? "#0369a1" : "var(--color-border)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 500,
            cursor: isValid ? "pointer" : "not-allowed",
          }}
        >
          {mutation.isPending ? "Registrando..." : "Registrar entrada"}
        </button>
      </div>
    </>
  );
}
