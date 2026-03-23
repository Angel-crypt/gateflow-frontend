import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createPass } from "../../api/passes.api";
import apiClient from "../../api/apiClient";

function useDestinations() {
  return useQuery({
    queryKey: ["destinations"],
    queryFn: async () => {
      const res = await apiClient.get("/api/destinations/");
      return res.data.results ?? res.data;
    },
  });
}

// Formato YYYY-MM-DDTHH:mm para datetime-local
function toLocalISO(date) {
  const d = new Date(date);
  d.setSeconds(0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function addHours(isoStr, hours) {
  const d = new Date(isoStr);
  d.setMinutes(d.getMinutes() + hours * 60);
  return toLocalISO(d);
}

const nowISO = () => toLocalISO(new Date());

const DURATIONS = [
  { key: "1h",     label: "1h",           hours: 1  },
  { key: "2h",     label: "2h",           hours: 2  },
  { key: "4h",     label: "4h",           hours: 4  },
  { key: "8h",     label: "8h",           hours: 8  },
  { key: "1d",     label: "1 día",        hours: 24 },
  { key: "custom", label: "Personalizado", hours: null },
];

const PILL_ACTIVE   = { padding: "5px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 500, cursor: "pointer", border: "1px solid #0369a1", background: "#0369a1", color: "#fff",                        transition: "all 150ms" };
const PILL_INACTIVE = { padding: "5px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 500, cursor: "pointer", border: "0.5px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text-muted)", transition: "all 150ms" };

const INPUT_STYLE = {
  padding: "9px 10px",
  border: "0.5px solid var(--color-border)",
  borderRadius: "7px",
  fontSize: "13px",
  background: "var(--color-surface)",
  color: "var(--color-text)",
  width: "100%",
  boxSizing: "border-box",
};

export default function CreatePassModal({ onClose, onSuccess }) {
  const { data: destinations = [] } = useDestinations();

  const [fromMode, setFromMode] = useState("now");
  const [duration, setDuration] = useState("1h");

  const initialNow = nowISO();
  const [form, setForm] = useState({
    visitor_name: "",
    plate: "",
    pass_type: "day",
    valid_from: initialNow,
    valid_to: addHours(initialNow, 1),
    destination: "",
  });

  const mutation = useMutation({
    mutationFn: () => createPass(form),
    onSuccess,
  });

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Cambiar modo "Desde"
  const handleFromMode = (mode) => {
    setFromMode(mode);
    if (mode === "now") {
      const now = nowISO();
      const durDef = DURATIONS.find((d) => d.key === duration);
      setForm((f) => ({
        ...f,
        valid_from: now,
        valid_to: durDef?.hours ? addHours(now, durDef.hours) : f.valid_to,
      }));
    } else {
      setForm((f) => ({ ...f, valid_from: "" }));
    }
  };

  // Cambiar duración
  const handleDuration = (key) => {
    setDuration(key);
    const durDef = DURATIONS.find((d) => d.key === key);
    if (key !== "custom" && form.valid_from) {
      setForm((f) => ({ ...f, valid_to: addHours(f.valid_from, durDef.hours) }));
    } else if (key === "custom") {
      setForm((f) => ({ ...f, valid_to: "" }));
    }
  };

  // Cambiar valid_from en modo personalizado
  const handleValidFromChange = (e) => {
    const newFrom = e.target.value;
    const durDef = DURATIONS.find((d) => d.key === duration);
    setForm((f) => ({
      ...f,
      valid_from: newFrom,
      valid_to: durDef?.hours && newFrom ? addHours(newFrom, durDef.hours) : f.valid_to,
    }));
  };

  const isValid = form.visitor_name && form.plate && form.valid_from && form.valid_to;

  const formatDisplay = (iso) =>
    iso ? new Date(iso).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" }) : "—";

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
          maxHeight: "92vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ width: "32px", height: "3px", background: "var(--color-border)", borderRadius: "2px", margin: "0 auto", flexShrink: 0 }} />

        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text)" }}>
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
            style={INPUT_STYLE}
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
            style={{ ...INPUT_STYLE, fontFamily: "monospace", letterSpacing: "1px" }}
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
            style={INPUT_STYLE}
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
              style={INPUT_STYLE}
            >
              <option value="">Seleccionar destino...</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* ── Separador ── */}
        <div style={{ height: "0.5px", background: "var(--color-border)" }} />

        {/* ── Desde ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Válido desde
            </span>
            <div style={{ display: "flex", gap: "5px" }}>
              {["now", "custom"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleFromMode(mode)}
                  style={fromMode === mode ? PILL_ACTIVE : PILL_INACTIVE}
                >
                  {mode === "now" ? "Ahora" : "Personalizado"}
                </button>
              ))}
            </div>
          </div>

          {fromMode === "now" ? (
            <div style={{
              padding: "9px 10px",
              background: "var(--color-bg)",
              border: "0.5px solid var(--color-border)",
              borderRadius: "7px",
              fontSize: "13px",
              color: "var(--color-text)",
              fontFamily: "monospace",
            }}>
              {formatDisplay(form.valid_from)}
            </div>
          ) : (
            <input
              type="datetime-local"
              value={form.valid_from}
              onChange={handleValidFromChange}
              style={{ ...INPUT_STYLE, fontSize: "12px" }}
            />
          )}
        </div>

        {/* ── Duración ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>
            Duración
          </span>

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {DURATIONS.map((d) => (
              <button
                key={d.key}
                onClick={() => handleDuration(d.key)}
                style={duration === d.key ? PILL_ACTIVE : PILL_INACTIVE}
              >
                {d.label}
              </button>
            ))}
          </div>

          {duration === "custom" ? (
            <input
              type="datetime-local"
              value={form.valid_to}
              min={form.valid_from || undefined}
              onChange={(e) => setForm((f) => ({ ...f, valid_to: e.target.value }))}
              style={{ ...INPUT_STYLE, fontSize: "12px" }}
            />
          ) : (
            form.valid_from && form.valid_to && (
              <div style={{
                fontSize: "12px",
                color: "var(--color-text-muted)",
                padding: "8px 10px",
                background: "var(--color-bg)",
                borderRadius: "7px",
                border: "0.5px solid var(--color-border)",
                display: "flex",
                justifyContent: "space-between",
              }}>
                <span>Hasta</span>
                <span style={{ fontFamily: "monospace", color: "var(--color-text)", fontWeight: 500 }}>
                  {formatDisplay(form.valid_to)}
                </span>
              </div>
            )
          )}
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
