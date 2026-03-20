import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createPass } from "../../api/passes.api";
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

export default function CreatePassModal({ onClose, onSuccess }) {
  const { data: destinations = [] } = useDestinations();
  const [form, setForm] = useState({
    visitor_name: "",
    plate: "",
    pass_type: "day",
    valid_from: "",
    valid_to: "",
    destination: "",
  });

  const mutation = useMutation({
    mutationFn: () => createPass(form),
    onSuccess,
  });

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const isValid =
    form.visitor_name && form.plate && form.valid_from && form.valid_to;

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
          Nuevo pase
        </div>

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
              padding: "9px 10px", border: "0.5px solid var(--color-border)",
              borderRadius: "7px", fontSize: "13px",
              background: "var(--color-surface)", color: "var(--color-text)",
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
              padding: "9px 10px", border: "0.5px solid var(--color-border)",
              borderRadius: "7px", fontSize: "13px",
              fontFamily: "monospace", letterSpacing: "1px",
              background: "var(--color-surface)", color: "var(--color-text)",
            }}
          />
        </div>

        {/* Tipo */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>
            Tipo de pase
          </label>
          <select
            name="pass_type"
            value={form.pass_type}
            onChange={handleChange}
            style={{
              padding: "9px 10px", border: "0.5px solid var(--color-border)",
              borderRadius: "7px", fontSize: "13px",
              background: "var(--color-surface)", color: "var(--color-text)",
            }}
          >
            <option value="day">Day Pass — múltiples entradas</option>
            <option value="single">Single Use — una sola entrada</option>
          </select>
        </div>

        {/* Destino */}
        {destinations.length > 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Destino
            </label>
            <select
              name="destination"
              value={form.destination}
              onChange={handleChange}
              style={{
                padding: "9px 10px", border: "0.5px solid var(--color-border)",
                borderRadius: "7px", fontSize: "13px",
                background: "var(--color-surface)", color: "var(--color-text)",
              }}
            >
              <option value="">Seleccionar destino...</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Fechas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Desde
            </label>
            <input
              type="datetime-local"
              name="valid_from"
              value={form.valid_from}
              onChange={handleChange}
              style={{
                padding: "9px 10px", border: "0.5px solid var(--color-border)",
                borderRadius: "7px", fontSize: "12px",
                background: "var(--color-surface)", color: "var(--color-text)",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Hasta
            </label>
            <input
              type="datetime-local"
              name="valid_to"
              value={form.valid_to}
              onChange={handleChange}
              style={{
                padding: "9px 10px", border: "0.5px solid var(--color-border)",
                borderRadius: "7px", fontSize: "12px",
                background: "var(--color-surface)", color: "var(--color-text)",
              }}
            />
          </div>
        </div>

        {/* Error */}
        {mutation.isError && (
          <div style={{ fontSize: "12px", color: "#dc2626" }}>
            {mutation.error?.response?.data?.detail ?? "Error al crear el pase."}
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
            {mutation.isPending ? "Creando..." : "Crear pase"}
          </button>
        </div>
      </div>
    </div>
  );
}
